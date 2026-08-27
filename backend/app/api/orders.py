from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Order, OrderItem, OrderStatus, ProduceListing
from app.schemas.schemas import OrderCreate, OrderResponse

router = APIRouter()


@router.post("/", response_model=OrderResponse, status_code=201)
async def create_order(
    payload: OrderCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
        order_item = OrderItem(
            order_id=order.id,
            listing_id=item.listing_id,
            quantity_kg=item.quantity_kg,
            price_per_kg=item.price_per_kg,
        )
        db.add(order_item)
        total += item.quantity_kg * item.price_per_kg

    order.total_amount = total
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
    await db.commit()

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
        result = await db.execute(
            select(ProduceListing).where(ProduceListing.id == order_item.listing_id)
        )
        listing = result.scalar_one_or_none()
        if not listing:
            raise HTTPException(status_code=404, detail=f"Listing {order_item.listing_id} not found")

        if listing.quantity_kg < order_item.quantity_kg:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient quantity in listing {listing.id}. Available: {listing.quantity_kg}, Required: {order_item.quantity_kg}"
            )

        listing.quantity_kg -= order_item.quantity_kg

    order.status = OrderStatus.ALLOCATED
    await db.commit()

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

    if order.status != OrderStatus.ALLOCATED:
        raise HTTPException(status_code=400, detail=f"Order status is {order.status}, cannot dispatch")

    order.status = OrderStatus.DISPATCHED
    await db.commit()

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
    await db.commit()

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
    await db.commit()

    return {"message": f"Order {order.id} delivered", "status": order.status}


@router.post("/{order_id}/allocate-from-listings")
async def allocate_from_listings(
    order_id: UUID,
    listing_items: list,
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
    for item in listing_items:
        listing_id = item["listing_id"]
        quantity_kg = item["quantity_kg"]

        result = await db.execute(
            select(ProduceListing).where(ProduceListing.id == listing_id)
        )
        listing = result.scalar_one_or_none()
        if not listing:
            raise HTTPException(status_code=404, detail=f"Listing {listing_id} not found")

        if listing.quantity_kg < quantity_kg:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient quantity in listing {listing.id}. Available: {listing.quantity_kg}, Required: {quantity_kg}"
            )

        listing.quantity_kg -= quantity_kg
        total_allocated += quantity_kg

    if total_allocated == 0:
        raise HTTPException(status_code=400, detail="No items allocated")

    order.status = OrderStatus.ALLOCATED
    await db.commit()

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
