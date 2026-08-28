"""
Dispatch Service
Writes routing plans to the database, creates Shipments, Routes, RouteStops.

Problems addressed:
- #25: End-to-end trace from DB writes
- #10: Logistics tracking (creates base records for tracking)
"""
import logging
from typing import List, Optional
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import (
    Shipment, Route, RouteStop, LogisticsEvent, 
    LogisticsEventType, RouteStatus, VehicleStatus, Order, OrderStatus
)

logger = logging.getLogger(__name__)


async def dispatch_route(
    db: AsyncSession,
    order_id: str,
    allocation_ids: List[str],
    vehicle_id: str,
    route_mode: str,
    distance_km: float,
    duration_min: float,
    stops_data: List[dict],  # [{stop_type, lat, lng, qty, seq, farmer_id/hub_id/buyer_id, eta}]
    landed_cost: float,
    consolidation_savings_km: float = 0.0
) -> Optional[Shipment]:
    """
    Persist the final plan into the database.
    """
    try:
        # 1. Create Route
        route = Route(
            vehicle_id=vehicle_id,
            distance_km=distance_km,
            duration_minutes=int(duration_min),
            status=RouteStatus.PLANNED,
            route_mode=route_mode
        )
        db.add(route)
        await db.flush()  # to get route.id

        # 2. Create RouteStops
        for stop in stops_data:
            rs = RouteStop(
                route_id=route.id,
                stop_type=stop["stop_type"],
                farmer_id=stop.get("farmer_id"),
                hub_id=stop.get("hub_id"),
                buyer_id=stop.get("buyer_id"),
                latitude=stop["lat"],
                longitude=stop["lng"],
                quantity_kg=stop["qty"],
                sequence=stop["seq"],
                eta=stop.get("eta")
            )
            db.add(rs)

        # 3. Create Shipment
        # (Assuming 1 allocation maps to the main route for simplicity, or link via order)
        # Using the first allocation as the primary link, though our schema allows order_id natively.
        shipment = Shipment(
            allocation_id=allocation_ids[0] if allocation_ids else None,
            order_id=order_id,
            route_id=route.id,
            vehicle_id=vehicle_id,
            status="planned",
            estimated_distance_km=distance_km,
            estimated_duration_min=duration_min,
            landed_cost=landed_cost,
            consolidation_savings_km=consolidation_savings_km,
            route_mode=route_mode
        )
        db.add(shipment)
        await db.flush()

        # 4. Create initial tracking event
        event = LogisticsEvent(
            shipment_id=shipment.id,
            event_type=LogisticsEventType.PLANNED,
            notes="Shipment planned and route optimized."
        )
        db.add(event)

        # Update order status
        if order_id:
            order = await db.get(Order, order_id)
            if order:
                order.status = OrderStatus.ALLOCATED
                db.add(order)

        await db.commit()
        await db.refresh(shipment)
        
        return shipment
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in dispatch_route: {e}")
        return None
