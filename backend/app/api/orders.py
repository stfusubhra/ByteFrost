from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.orm import joinedload
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import (
    Allocation,
    Order,
    OrderItem,
    OrderStatus,
    ProduceListing,
    RouteStop,
    Shipment,
    User,
    UserRole,
    Vehicle,
)
from app.schemas.schemas import (
    AllocationRequest,
    OrderAllocationResponse,
    OrderCreate,
    OrderDetailResponse,
    OrderItemDetailResponse,
    OrderResponse,
    OrderShipmentSummary,
)

router = APIRouter()

# Roles allowed to place orders (buyers and consumers)
ORDER_CREATOR_ROLES = {
    UserRole.BUYER_BULK,
    UserRole.BUYER_RETAILER,
    UserRole.CONSUMER,
    UserRole.FPO_MANAGER,
}


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_roles(current_user, ORDER_CREATOR_ROLES)

    order = Order(
        buyer_id=UUID(current_user["id"]),
        delivery_address=payload.delivery_address,
        delivery_latitude=payload.delivery_latitude,
        delivery_longitude=payload.delivery_longitude,
        delivery_deadline=payload.delivery_deadline,
        notes=payload.notes,
    )
    db.add(order)
    await db.flush()

    total = 0
    for item in payload.items:
        # Atomic decrement: ensure sufficient quantity and active listing
        stmt = (
            update(ProduceListing)
            .where(
                ProduceListing.id == item.listing_id,
                ProduceListing.is_active == True,
                ProduceListing.quantity_kg >= item.quantity_kg,
            )
            .values(quantity_kg=ProduceListing.quantity_kg - item.quantity_kg)
        )
        result = await db.execute(stmt)
        if result.rowcount == 0:
            # Either listing not found, inactive, or insufficient quantity
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient quantity for listing {item.listing_id}. "
                    f"Check if listing exists, is active, and has enough stock."
                ),
            )

        # Fetch the listing to get price_per_kg (now that we know it exists and quantity sufficient)
        listing_result = await db.execute(
            select(ProduceListing).where(ProduceListing.id == item.listing_id)
        )
        listing = listing_result.scalar_one()
        price_per_kg = listing.price_per_kg
        if price_per_kg is None:
            raise HTTPException(
                status_code=400,
                detail=f"Listing {listing.id} has no price set",
            )

        order_item = OrderItem(
            order_id=order.id,
            listing_id=listing.id,
            quantity_kg=item.quantity_kg,
            price_per_kg=price_per_kg,
        )
        db.add(order_item)
        total += item.quantity_kg * float(price_per_kg)

    order.total_amount = total
    await db.flush()

    # Reload the order with its items eagerly loaded so the response can
    # serialize the nested items without triggering a lazy-load outside the
    # request session.
    result = await db.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(joinedload(Order.items))
    )
    order = result.unique().scalar_one()
    return order


@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    current_user: dict = Depends(get_current_user),
    status: str = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    query = select(Order).where(Order.buyer_id == UUID(current_user["id"]))

    if status:
        query = query.where(Order.status == OrderStatus(status))

    # Eager-load items: OrderResponse serializes order.items, and lazy
    # loading raises MissingGreenlet outside an async session context.
    query = query.options(joinedload(Order.items)).order_by(Order.created_at.desc())

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.unique().scalars().all()


@router.get("/incoming", response_model=List[OrderResponse])
async def list_incoming_orders(
    current_user: dict = Depends(get_current_user),
    status: str = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Orders that contain the current user's listings (farmer/FPO as seller).

    Orders link to sellers through their items -> listings, so we join
    OrderItem -> ProduceListing and filter on the listing's seller_id.
    """
    seller_id = UUID(current_user["id"])
    query = (
        select(Order)
        .join(OrderItem, OrderItem.order_id == Order.id)
        .join(ProduceListing, ProduceListing.id == OrderItem.listing_id)
        .where(ProduceListing.seller_id == seller_id)
        .options(joinedload(Order.items))
        .order_by(Order.created_at.desc())
        .distinct()
    )

    if status:
        query = query.where(Order.status == OrderStatus(status))

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.unique().scalars().all()


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order(
    order_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderDetailResponse:
    """Order detail with items (enriched with crop/seller info), allocations,
    and shipments — everything the buyer order-detail page needs in one call.
    """
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.buyer_id == UUID(current_user["id"]),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Items enriched with listing + seller info
    item_rows = await db.execute(
        select(OrderItem, ProduceListing, User)
        .join(ProduceListing, ProduceListing.id == OrderItem.listing_id)
        .join(User, User.id == ProduceListing.seller_id)
        .where(OrderItem.order_id == order_id)
    )
    items = []
    for item, listing, seller in item_rows.all():
        items.append(
            OrderItemDetailResponse(
                id=item.id,
                listing_id=item.listing_id,
                quantity_kg=item.quantity_kg,
                price_per_kg=float(item.price_per_kg),
                crop_name=listing.crop_name,
                variety=listing.variety,
                seller_name=seller.full_name,
                pickup_location=listing.pickup_location,
                quality_grade=listing.quality_grade,
            )
        )

    # Allocations enriched with listing + seller info
    alloc_rows = await db.execute(
        select(Allocation, ProduceListing, User)
        .join(ProduceListing, ProduceListing.id == Allocation.listing_id)
        .join(User, User.id == ProduceListing.seller_id)
        .where(Allocation.order_id == order_id)
    )
    allocations = []
    for alloc, listing, seller in alloc_rows.all():
        allocations.append(
            OrderAllocationResponse(
                id=alloc.id,
                listing_id=alloc.listing_id,
                quantity_kg=alloc.quantity_kg,
                score=alloc.score,
                crop_name=listing.crop_name,
                seller_name=seller.full_name,
                price_per_kg=float(listing.price_per_kg) if listing.price_per_kg is not None else None,
            )
        )

    # Shipments with vehicle info
    ship_rows = await db.execute(
        select(Shipment, Vehicle)
        .outerjoin(Vehicle, Vehicle.id == Shipment.vehicle_id)
        .where(Shipment.order_id == order_id)
    )
    shipments = []
    for ship, vehicle in ship_rows.all():
        stop_count = None
        if ship.route_id:
            stop_res = await db.execute(
                select(func.count(RouteStop.id)).where(RouteStop.route_id == ship.route_id)
            )
            stop_count = stop_res.scalar()
        shipments.append(
            OrderShipmentSummary(
                id=ship.id,
                status=ship.status,
                route_mode=ship.route_mode,
                estimated_distance_km=ship.estimated_distance_km,
                estimated_duration_min=ship.estimated_duration_min,
                landed_cost=ship.landed_cost,
                estimated_arrival=ship.delivery_time,
                vehicle_type=vehicle.vehicle_type if vehicle else None,
                vehicle_capacity_kg=vehicle.capacity_kg if vehicle else None,
                stop_count=stop_count,
            )
        )

    return OrderDetailResponse(
        id=order.id,
        buyer_id=order.buyer_id,
        status=order.status,
        total_amount=float(order.total_amount) if order.total_amount is not None else None,
        delivery_address=order.delivery_address,
        delivery_deadline=order.delivery_deadline,
        created_at=order.created_at,
        items=items,
        allocations=allocations,
        shipments=shipments,
    )


@router.post("/{order_id}/confirm")
async def confirm_order(
    order_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.buyer_id == UUID(current_user["id"]),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Order status is {order.status}, cannot confirm")

    order.status = OrderStatus.CONFIRMED

    return {"message": f"Order {order.id} confirmed", "status": order.status}


@router.post("/{order_id}/allocate")
async def allocate_order(
    order_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.buyer_id == UUID(current_user["id"]),
        ).options(joinedload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != OrderStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail=f"Order status is {order.status}, cannot allocate")

    for order_item in order.items:
        # Atomic decrement for each item
        stmt = (
            update(ProduceListing)
            .where(
                ProduceListing.id == order_item.listing_id,
                ProduceListing.is_active == True,
                ProduceListing.quantity_kg >= order_item.quantity_kg,
            )
            .values(quantity_kg=ProduceListing.quantity_kg - order_item.quantity_kg)
        )
        result = await db.execute(stmt)
        if result.rowcount == 0:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient quantity in listing {order_item.listing_id}. Available stock may have changed.",
            )

        # We could optionally fetch the listing to confirm, but not necessary for allocation.
        # However, we need to ensure the listing still exists and is active; the update already checked.

    order.status = OrderStatus.ALLOCATED

    return {"message": f"Order {order.id} allocated to listings", "status": order.status}


@router.post("/{order_id}/dispatch")
async def dispatch_order(
    order_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.buyer_id == UUID(current_user["id"]),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status not in (OrderStatus.ALLOCATED, OrderStatus.CONFIRMED):
        raise HTTPException(status_code=400, detail=f"Order status is {order.status}, cannot dispatch")

    order.status = OrderStatus.DISPATCHED

    return {"message": f"Order {order.id} dispatched", "status": order.status}


@router.post("/{order_id}/ship")
async def ship_order(
    order_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.buyer_id == UUID(current_user["id"]),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != OrderStatus.DISPATCHED:
        raise HTTPException(status_code=400, detail=f"Order status is {order.status}, cannot ship")

    order.status = OrderStatus.IN_TRANSIT

    return {"message": f"Order {order.id} shipped", "status": order.status}


@router.post("/{order_id}/deliver")
async def deliver_order(
    order_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.buyer_id == UUID(current_user["id"]),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != OrderStatus.IN_TRANSIT:
        raise HTTPException(status_code=400, detail=f"Order status is {order.status}, cannot deliver")

    order.status = OrderStatus.DELIVERED

    return {"message": f"Order {order.id} delivered", "status": order.status}


@router.post("/{order_id}/allocate-from-listings")
async def allocate_from_listings(
    order_id: UUID,
    payload: AllocationRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.buyer_id == UUID(current_user["id"]),
        ).options(joinedload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != OrderStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail=f"Order status is {order.status}, cannot allocate from listings")

    total_allocated = 0
    for item in payload.items:
        # Atomic decrement
        stmt = (
            update(ProduceListing)
            .where(
                ProduceListing.id == item.listing_id,
                ProduceListing.is_active == True,
                ProduceListing.quantity_kg >= item.quantity_kg,
            )
            .values(quantity_kg=ProduceListing.quantity_kg - item.quantity_kg)
        )
        result = await db.execute(stmt)
        if result.rowcount == 0:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient quantity in listing {item.listing_id}. Available stock may have changed.",
            )
        total_allocated += item.quantity_kg

    if total_allocated == 0:
        raise HTTPException(status_code=400, detail="No items allocated")

    order.status = OrderStatus.ALLOCATED

    return {"message": f"Order {order.id} allocated from {total_allocated} kg of listings", "status": order.status}


@router.get("/{order_id}/status")
async def get_order_status(
    order_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.buyer_id == UUID(current_user["id"]),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return {"order_id": str(order.id), "status": order.status, "total_amount": order.total_amount}