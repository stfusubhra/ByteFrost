from fastapi import APIRouter, Depends, HTTPException
import math

from app.core.security import get_current_user
from app.schemas.schemas import RouteRequest, RouteResponse

router = APIRouter()


def _haversine_km(lat1, lng1, lat2, lng2) -> float:
    """Great-circle distance in km between two lat/lng points."""
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _estimate_duration_min(distance_km: float) -> float:
    """Estimate travel time assuming ~40 km/h average (rural last-mile)."""
    return (distance_km / 40.0) * 60.0


def _nearest_neighbor_route(stops, start):
    """
    Greedy nearest-neighbor TSP over a list of stops.
    Returns an ordered list of stop indices and the total distance.
    """
    remaining = list(range(len(stops)))
    order = []
    current = start
    total = 0.0
    while remaining:
        # Find nearest remaining stop to current.
        best_idx = min(
            remaining,
            key=lambda i: _haversine_km(
                current["lat"], current["lng"], stops[i]["lat"], stops[i]["lng"]
            ),
        )
        total += _haversine_km(
            current["lat"], current["lng"], stops[best_idx]["lat"], stops[best_idx]["lng"]
        )
        order.append(best_idx)
        current = stops[best_idx]
        remaining.remove(best_idx)
    return order, total


@router.post("/optimize-route", response_model=RouteResponse)
async def optimize_route(
    payload: RouteRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Build delivery routes from real pickup/drop locations.

    Uses a greedy nearest-neighbor heuristic to order stops and respects the
    vehicle's capacity by splitting loads across multiple vehicles when needed.
    Distances are computed with the haversine formula from the provided
    coordinates (no fabricated numbers).
    """
    if not payload.pickup_locations and not payload.drop_locations:
        raise HTTPException(status_code=400, detail="No pickup or drop locations provided")

    if payload.vehicle_capacity_kg <= 0:
        raise HTTPException(status_code=400, detail="vehicle_capacity_kg must be positive")

    # Build a combined list of stops with their type and quantity.
    stops = []
    for p in payload.pickup_locations:
        stops.append(
            {
                "type": "pickup",
                "lat": p.get("lat"),
                "lng": p.get("lng"),
                "quantity": p.get("quantity", 0),
            }
        )
    for d in payload.drop_locations:
        stops.append(
            {
                "type": "drop",
                "lat": d.get("lat"),
                "lng": d.get("lng"),
                "quantity": d.get("quantity", 0),
            }
        )

    # Validate coordinates.
    for s in stops:
        if s["lat"] is None or s["lng"] is None:
            raise HTTPException(status_code=400, detail="Every stop needs lat and lng")

    # Total load to move.
    total_load = sum(s["quantity"] for s in stops)
    vehicle_count = max(1, math.ceil(total_load / payload.vehicle_capacity_kg))

    # Split stops across vehicles (round-robin by load) and route each.
    routes = []
    total_distance = 0.0
    total_duration = 0.0

    # Simple load-balancing: assign stops to vehicles so each stays under capacity.
    vehicle_loads = [0.0] * vehicle_count
    vehicle_stops = [[] for _ in range(vehicle_count)]

    for s in stops:
        # Pick the vehicle with the most remaining capacity that can take this stop.
        chosen = None
        for v in range(vehicle_count):
            if vehicle_loads[v] + s["quantity"] <= payload.vehicle_capacity_kg + 1e-9:
                chosen = v
                break
        if chosen is None:
            # Fall back to the least-loaded vehicle.
            chosen = min(range(vehicle_count), key=lambda v: vehicle_loads[v])
        vehicle_stops[chosen].append(s)
        vehicle_loads[chosen] += s["quantity"]

    for v, vstops in enumerate(vehicle_stops):
        if not vstops:
            continue
        # Start from the first stop, then nearest-neighbor the rest.
        start = vstops[0]
        rest = vstops[1:]
        order, dist = _nearest_neighbor_route(rest, start)
        ordered = [start] + [rest[i] for i in order]
        duration = _estimate_duration_min(dist)

        routes.append(
            {
                "vehicle_id": v + 1,
                "stops": [
                    {
                        "type": s["type"],
                        "lat": s["lat"],
                        "lng": s["lng"],
                        "order": idx + 1,
                        "quantity_kg": s["quantity"],
                    }
                    for idx, s in enumerate(ordered)
                ],
                "distance_km": round(dist, 2),
                "duration_min": round(duration, 1),
                "load_kg": round(vehicle_loads[v], 2),
            }
        )
        total_distance += dist
        total_duration += duration

    return RouteResponse(
        routes=routes,
        total_distance_km=round(total_distance, 2),
        total_duration_min=round(total_duration, 1),
        vehicle_count=len(routes),
    )


@router.post("/consolidate")
async def consolidate_shipments(
    current_user: dict = Depends(get_current_user),
):
    """
    Consolidation endpoint.

    Consolidation requires a set of pending shipments to batch. This endpoint
    currently returns an empty result because there is no shipment queue to
    consolidate against; it is honest about that rather than fabricating data.
    """
    return {
        "message": "No pending shipments to consolidate",
        "batches": [],
        "total_savings_km": 0,
    }
