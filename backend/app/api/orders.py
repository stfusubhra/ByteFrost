from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import joinedload
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import Order, OrderItem, OrderStatus, ProduceListing, UserRole
from app.schemas.schemas import AllocationRequest, OrderCreate, OrderResponse

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

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.buyer_id == UUID(current_user["id"]),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


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

    if order.status != OrderStatus.DISPATCHED:
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