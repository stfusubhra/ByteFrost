from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import (
    Allocation,
    Order,
    OrderItem,
    OrderStatus,
    ProduceListing,
    Shipment,
    User,
)
from app.schemas.schemas import BuyerInsightsResponse

router = APIRouter()


@router.get("/buyer-summary", response_model=BuyerInsightsResponse)
async def buyer_summary(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate procurement insights for the current buyer.

    Computed live from orders/items/allocations/shipments so the numbers
    always reflect the actual data (no cached analytics).
    """
    buyer_id = UUID(current_user["id"])

    orders_result = await db.execute(
        select(Order).where(Order.buyer_id == buyer_id)
    )
    orders = orders_result.scalars().all()

    total_orders = len(orders)
    delivered = [o for o in orders if o.status == OrderStatus.DELIVERED]
    in_transit = [o for o in orders if o.status == OrderStatus.IN_TRANSIT]
    pending = [o for o in orders if o.status in (OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.ALLOCATED, OrderStatus.DISPATCHED)]
    cancelled = [o for o in orders if o.status == OrderStatus.CANCELLED]

    total_spend = sum(float(o.total_amount or 0) for o in delivered)

    # Top crops: aggregate quantity by crop across DELIVERED order items
    crop_rows = await db.execute(
        select(ProduceListing.crop_name, func.sum(OrderItem.quantity_kg))
        .join(OrderItem, OrderItem.listing_id == ProduceListing.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.buyer_id == buyer_id, Order.status == OrderStatus.DELIVERED)
        .group_by(ProduceListing.crop_name)
        .order_by(func.sum(OrderItem.quantity_kg).desc())
        .limit(5)
    )
    top_crops = [
        {"crop_name": name, "quantity_kg": float(qty or 0)}
        for name, qty in crop_rows.all()
    ]
    total_kg = sum(c["quantity_kg"] for c in top_crops)

    # Supplier reliability: average match score per supplier across allocations
    supplier_rows = await db.execute(
        select(User.full_name, func.avg(Allocation.score), func.count(Allocation.id))
        .join(ProduceListing, ProduceListing.id == Allocation.listing_id)
        .join(User, User.id == ProduceListing.seller_id)
        .join(Order, Order.id == Allocation.order_id)
        .where(Order.buyer_id == buyer_id)
        .group_by(User.full_name)
        .order_by(func.avg(Allocation.score).desc())
        .limit(5)
    )
    suppliers = [
        {
            "supplier_name": name,
            "avg_score": round(float(score or 0), 3),
            "allocation_count": int(cnt or 0),
        }
        for name, score, cnt in supplier_rows.all()
    ]

    # Delivery performance: shipments linked to this buyer's orders
    shipment_rows = await db.execute(
        select(Shipment)
        .join(Order, Order.id == Shipment.order_id)
        .where(Order.buyer_id == buyer_id)
    )
    shipments = shipment_rows.scalars().all()
    delivered_shipments = [s for s in shipments if s.status == "delivered"]
    on_time = 0
    for s in delivered_shipments:
        if s.estimated_duration_min and s.actual_duration_min:
            if s.actual_duration_min <= s.estimated_duration_min * 1.15:
                on_time += 1
        else:
            on_time += 1  # no timing data -> count as on-time (demo data)

    delivery_performance = {
        "total_shipments": len(shipments),
        "delivered_shipments": len(delivered_shipments),
        "on_time_rate": round(on_time / len(delivered_shipments), 3) if delivered_shipments else 0.0,
        # Landed cost includes goods + transport (fulfillment service semantics)
        "avg_landed_cost_per_kg": round(
            sum(float(s.landed_cost or 0) for s in delivered_shipments) / total_kg, 2
        ) if total_kg else 0.0,
    }

    # Monthly spend trend (last 6 months of delivered orders)
    from collections import defaultdict
    from datetime import datetime, timezone

    monthly = defaultdict(float)
    for o in delivered:
        month_key = o.created_at.strftime("%Y-%m")
        monthly[month_key] += float(o.total_amount or 0)
    spend_trend = [
        {"month": month, "amount": round(amount, 2)}
        for month, amount in sorted(monthly.items())[-6:]
    ]

    return BuyerInsightsResponse(
        total_orders=total_orders,
        total_spend=round(total_spend, 2),
        total_kg=round(total_kg, 2),
        orders_by_status={
            "delivered": len(delivered),
            "in_transit": len(in_transit),
            "pending": len(pending),
            "cancelled": len(cancelled),
        },
        top_crops=top_crops,
        suppliers=suppliers,
        delivery_performance=delivery_performance,
        spend_trend=spend_trend,
    )