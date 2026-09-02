"""
Tracking API
Real-time shipment tracking, milestones, and logistics event streaming.
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import (
    Shipment, RouteStop, LogisticsEvent, LogisticsEventType,
    Vehicle, Order, OrderStatus,
)
from app.schemas.schemas import (
    TrackingEventCreate, TrackingEventResponse, TrackingStatus
)
from app.services.maps_service import build_google_maps_url

router = APIRouter(prefix="/tracking", tags=["Logistics - Tracking"])


@router.get("/{shipment_id}", response_model=TrackingStatus)
async def get_tracking_status(
    shipment_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get live tracking status for a shipment including latest coordinates,
    estimated arrival, milestone event history, and driver navigation URL.
    """
    shipment = await db.get(Shipment, shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    # Fetch logistics events in chronological order
    events_stmt = (
        select(LogisticsEvent)
        .where(LogisticsEvent.shipment_id == shipment_id)
        .order_by(LogisticsEvent.timestamp.asc())
    )
    events_res = await db.execute(events_stmt)
    events = events_res.scalars().all()

    # Determine latest known coordinates
    latest_lat = None
    latest_lng = None
    for ev in reversed(events):
        if ev.latitude is not None and ev.longitude is not None:
            latest_lat = ev.latitude
            latest_lng = ev.longitude
            break

    # If no event coordinates yet, fallback to vehicle or pickup/drop
    if latest_lat is None and shipment.vehicle_id:
        vehicle = await db.get(Vehicle, shipment.vehicle_id)
        if vehicle and vehicle.latitude is not None:
            latest_lat = vehicle.latitude
            latest_lng = vehicle.longitude

    if latest_lat is None:
        latest_lat = shipment.pickup_latitude
        latest_lng = shipment.pickup_longitude

    # Determine estimated arrival
    estimated_arrival = shipment.delivery_time
    if not estimated_arrival and shipment.route_id:
        # Check last route stop ETA
        last_stop_stmt = (
            select(RouteStop)
            .where(RouteStop.route_id == shipment.route_id)
            .order_by(RouteStop.sequence.desc())
            .limit(1)
        )
        last_stop_res = await db.execute(last_stop_stmt)
        last_stop = last_stop_res.scalar_one_or_none()
        if last_stop and last_stop.eta:
            estimated_arrival = last_stop.eta

    # Build Google Maps navigation link from route stops if available
    maps_url = None
    if shipment.route_id:
        stops_stmt = (
            select(RouteStop)
            .where(RouteStop.route_id == shipment.route_id)
            .order_by(RouteStop.sequence)
        )
        stops_res = await db.execute(stops_stmt)
        stops = stops_res.scalars().all()
        coords = [(s.latitude, s.longitude) for s in stops if s.latitude and s.longitude]
        if len(coords) >= 2:
            maps_url = build_google_maps_url(coords)

    event_responses = [
        TrackingEventResponse(
            id=ev.id,
            event_type=ev.event_type.value if hasattr(ev.event_type, "value") else str(ev.event_type),
            latitude=ev.latitude,
            longitude=ev.longitude,
            notes=ev.notes,
            timestamp=ev.timestamp,
        )
        for ev in events
    ]

    return TrackingStatus(
        shipment_id=shipment.id,
        current_status=shipment.status,
        current_latitude=latest_lat,
        current_longitude=latest_lng,
        estimated_arrival=estimated_arrival,
        events=event_responses,
        maps_url=maps_url,
    )


@router.post("/{shipment_id}/events", response_model=TrackingEventResponse, status_code=status.HTTP_201_CREATED)
async def create_tracking_event(
    shipment_id: UUID,
    payload: TrackingEventCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Append a new logistics event to a shipment.
    Automatically updates the shipment and order status when appropriate.
    """
    shipment = await db.get(Shipment, shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    # Validate event type
    try:
        event_enum = LogisticsEventType(payload.event_type.upper())
    except ValueError:
        valid_types = [e.value for e in LogisticsEventType]
        raise HTTPException(
            status_code=400,
            detail=f"Invalid event_type '{payload.event_type}'. Valid types: {valid_types}"
        )

    event = LogisticsEvent(
        shipment_id=shipment.id,
        event_type=event_enum,
        latitude=payload.latitude or shipment.drop_latitude,
        longitude=payload.longitude or shipment.drop_longitude,
        notes=payload.notes,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(event)

    # Sync shipment status
    status_updates = {
        LogisticsEventType.PICKUP_STARTED: "in_transit",
        LogisticsEventType.PICKUP_DONE: "in_transit",
        LogisticsEventType.IN_TRANSIT: "in_transit",
        LogisticsEventType.HUB_ARRIVED: "at_hub",
        LogisticsEventType.HUB_DEPARTED: "in_transit",
        LogisticsEventType.DELIVERED: "delivered",
        LogisticsEventType.TRUCK_BREAKDOWN: "delayed",
        LogisticsEventType.REROUTED: "rerouted",
        LogisticsEventType.FARMER_CANCELLED: "partially_fulfilled",
        LogisticsEventType.CANCELLED: "cancelled",
    }

    if event_enum in status_updates:
        shipment.status = status_updates[event_enum]
        if event_enum == LogisticsEventType.DELIVERED and not shipment.delivery_time:
            shipment.delivery_time = datetime.now(timezone.utc)
        db.add(shipment)

        # Update order status if linked
        if shipment.order_id:
            order = await db.get(Order, shipment.order_id)
            if order:
                if event_enum == LogisticsEventType.DELIVERED:
                    order.status = OrderStatus.DELIVERED
                elif event_enum == LogisticsEventType.CANCELLED:
                    order.status = OrderStatus.CANCELLED
                elif event_enum in (LogisticsEventType.PICKUP_STARTED, LogisticsEventType.IN_TRANSIT):
                    order.status = OrderStatus.IN_TRANSIT
                db.add(order)

    await db.commit()
    await db.refresh(event)

    return TrackingEventResponse(
        id=event.id,
        event_type=event.event_type.value if hasattr(event.event_type, "value") else str(event.event_type),
        latitude=event.latitude,
        longitude=event.longitude,
        notes=event.notes,
        timestamp=event.timestamp,
    )
