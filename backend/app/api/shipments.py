"""
Shipments API
Query and manage shipments, routes, and associated stops.
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import (
    Shipment, Route, RouteStop, Vehicle, Order,
    LogisticsEvent, LogisticsEventType, UserRole,
)
from app.schemas.schemas import (
    ShipmentResponse, ShipmentDetailResponse, RouteStopResponse, VehicleResponse
)
from app.services.maps_service import build_google_maps_url

router = APIRouter(prefix="/shipments", tags=["Logistics - Shipments"])


class ShipmentStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@router.get("/", response_model=List[ShipmentResponse])
async def list_shipments(
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List shipments accessible to the current user.
    - Admin / Logistics: all shipments
    - Buyer: shipments linked to buyer's orders
    - Farmer: shipments containing pickup stops for this farmer
    """
    user_id = UUID(current_user["id"])
    role = current_user.get("role")

    query = select(Shipment)

    if role in (UserRole.ADMIN.value, UserRole.LOGISTICS.value, "admin", "logistics"):
        # Full view
        pass
    elif role in (UserRole.BUYER_BULK.value, UserRole.BUYER_RETAILER.value, UserRole.CONSUMER.value, "buyer_bulk", "buyer_retailer", "consumer"):
        # Find orders belonging to this buyer
        buyer_order_subquery = select(Order.id).where(Order.buyer_id == user_id)
        # Also check RouteStops where buyer_id matches
        buyer_route_subquery = select(RouteStop.route_id).where(RouteStop.buyer_id == user_id)

        query = query.where(
            or_(
                Shipment.order_id.in_(buyer_order_subquery),
                Shipment.route_id.in_(buyer_route_subquery)
            )
        )
    elif role in (UserRole.FARMER.value, UserRole.FPO_MANAGER.value, "farmer", "fpo_manager"):
        # Find routes that have a stop for this farmer
        farmer_route_subquery = select(RouteStop.route_id).where(RouteStop.farmer_id == user_id)
        query = query.where(Shipment.route_id.in_(farmer_route_subquery))
    else:
        # Unknown role: return empty list
        return []

    if status:
        query = query.where(Shipment.status == status)

    query = query.order_by(Shipment.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{shipment_id}", response_model=ShipmentDetailResponse)
async def get_shipment(
    shipment_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed shipment information including stops, vehicle, and navigation map URL.
    """
    shipment = await db.get(Shipment, shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    # Fetch stops if route_id is present
    stops_responses: List[RouteStopResponse] = []
    coords: List[tuple] = []
    if shipment.route_id:
        stops_result = await db.execute(
            select(RouteStop)
            .where(RouteStop.route_id == shipment.route_id)
            .order_by(RouteStop.sequence)
        )
        stops = stops_result.scalars().all()
        for s in stops:
            stops_responses.append(
                RouteStopResponse(
                    id=s.id,
                    stop_type=s.stop_type.value if hasattr(s.stop_type, "value") else str(s.stop_type),
                    farmer_id=s.farmer_id,
                    hub_id=s.hub_id,
                    buyer_id=s.buyer_id,
                    latitude=s.latitude,
                    longitude=s.longitude,
                    quantity_kg=s.quantity_kg,
                    sequence=s.sequence,
                    time_window_earliest=s.time_window_earliest,
                    time_window_latest=s.time_window_latest,
                    max_transit_hours=s.max_transit_hours,
                    eta=s.eta,
                )
            )
            if s.latitude and s.longitude:
                coords.append((s.latitude, s.longitude))

    # Fetch vehicle if assigned
    vehicle_response = None
    if shipment.vehicle_id:
        vehicle = await db.get(Vehicle, shipment.vehicle_id)
        if vehicle:
            vehicle_response = VehicleResponse.model_validate(vehicle)

    maps_url = build_google_maps_url(coords) if len(coords) >= 2 else None

    detail = ShipmentDetailResponse(
        id=shipment.id,
        allocation_id=shipment.allocation_id,
        order_id=shipment.order_id,
        route_id=shipment.route_id,
        vehicle_id=shipment.vehicle_id,
        status=shipment.status,
        landed_cost=shipment.landed_cost,
        route_mode=shipment.route_mode,
        estimated_distance_km=shipment.estimated_distance_km,
        estimated_duration_min=shipment.estimated_duration_min,
        pickup_latitude=shipment.pickup_latitude,
        pickup_longitude=shipment.pickup_longitude,
        drop_latitude=shipment.drop_latitude,
        drop_longitude=shipment.drop_longitude,
        pickup_time=shipment.pickup_time,
        delivery_time=shipment.delivery_time,
        created_at=shipment.created_at,
        stops=stops_responses,
        vehicle=vehicle_response,
        maps_url=maps_url,
    )
    return detail


@router.patch("/{shipment_id}/status", response_model=ShipmentResponse)
async def update_shipment_status(
    shipment_id: UUID,
    payload: ShipmentStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update the status of a shipment (e.g. dispatched, in_transit, delivered, cancelled)
    and automatically record a corresponding LogisticsEvent.
    """
    shipment = await db.get(Shipment, shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    old_status = shipment.status
    shipment.status = payload.status
    shipment.updated_at = datetime.now(timezone.utc)

    # If delivered, record delivery_time
    if payload.status.lower() == "delivered" and not shipment.delivery_time:
        shipment.delivery_time = datetime.now(timezone.utc)

    # Map status to event type
    status_event_map = {
        "dispatched": LogisticsEventType.IN_TRANSIT,
        "in_transit": LogisticsEventType.IN_TRANSIT,
        "delivered": LogisticsEventType.DELIVERED,
        "cancelled": LogisticsEventType.CANCELLED,
    }
    event_type = status_event_map.get(payload.status.lower(), LogisticsEventType.IN_TRANSIT)

    event = LogisticsEvent(
        shipment_id=shipment.id,
        event_type=event_type,
        latitude=payload.latitude or shipment.drop_latitude,
        longitude=payload.longitude or shipment.drop_longitude,
        notes=payload.notes or f"Shipment status updated from {old_status} to {payload.status}.",
        timestamp=datetime.now(timezone.utc),
    )
    db.add(event)

    # If order is linked, update order status appropriately
    if shipment.order_id:
        order = await db.get(Order, shipment.order_id)
        if order:
            from app.models.models import OrderStatus
            if payload.status.lower() == "in_transit":
                order.status = OrderStatus.IN_TRANSIT
            elif payload.status.lower() == "delivered":
                order.status = OrderStatus.DELIVERED
            elif payload.status.lower() == "cancelled":
                order.status = OrderStatus.CANCELLED
            db.add(order)

    db.add(shipment)
    await db.commit()
    await db.refresh(shipment)
    return shipment
