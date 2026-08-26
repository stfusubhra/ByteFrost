from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Order, OrderItem, OrderStatus
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
):
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
