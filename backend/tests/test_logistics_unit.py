"""
Unit tests for KisanSetu logistics optimization, consolidation, and landed cost calculation.
Runs fast in-memory without external Postgres dependency.
"""
import pytest
from datetime import datetime, timezone, timedelta
from uuid import uuid4

from app.services.consolidation_service import consolidate_pickups, PickupStop
from app.services.landed_cost_service import calculate_landed_cost, FarmerAllocation
from app.services.maps_service import haversine, estimate_eta, build_google_maps_url
from app.services.vrp_solver import solve_vrp


def test_haversine_distance():
    # Mumbai to Pune (~120 km)
    mumbai_lat, mumbai_lng = 19.0760, 72.8777
    pune_lat, pune_lng = 18.5204, 73.8567
    dist = haversine(mumbai_lat, mumbai_lng, pune_lat, pune_lng)
    assert 110 < dist < 140


def test_eta_calculation():
    start = datetime(2026, 9, 2, 10, 0, tzinfo=timezone.utc)
    eta = estimate_eta(start, distance_km=80.0, speed_kmh=40.0)
    # 80 km at 40 km/h is 2 hours
    assert eta == start + timedelta(hours=2)


def test_build_google_maps_url():
    coords = [(22.57, 88.36), (22.60, 88.40), (22.50, 88.30)]
    url = build_google_maps_url(coords)
    assert "https://www.google.com/maps/dir/?api=1" in url
    assert "origin=22.57,88.36" in url
    assert "destination=22.5,88.3" in url
    assert "waypoints=22.6,88.4" in url


def test_consolidation_service():
    f1 = uuid4()
    f2 = uuid4()
    f3 = uuid4()
    stops = [
        PickupStop(farmer_id=f1, latitude=22.5000, longitude=88.3000, quantity_kg=200),
        PickupStop(farmer_id=f2, latitude=22.5010, longitude=88.3010, quantity_kg=300),  # near f1
        PickupStop(farmer_id=f3, latitude=25.5000, longitude=91.3000, quantity_kg=150),  # far away
    ]
    batches = consolidate_pickups(stops, max_gap_km=50.0)
    assert len(batches) == 2
    # First batch should combine f1 and f2
    assert batches[0].total_quantity_kg == 500
    assert len(batches[0].stops) == 2


def test_landed_cost_calculation():
    f1 = str(uuid4())
    allocations = [
        FarmerAllocation(farmer_id=f1, quantity_kg=500.0, price_per_kg=30.0, distance_km=15.0)
    ]
    # Total distance 100km, cost 12/km, 2 hours transit
    breakdown = calculate_landed_cost(
        allocations=allocations,
        total_route_distance_km=100.0,
        operating_cost_per_km=12.0,
        transit_hours=2.0,
        uses_hub=False,
    )
    # produce_cost = 500 * 30 = 15000
    # transport_cost = 100 * 12 = 1200
    # expected_loss = 500 * 0.005 * 2 * 30 = 150
    assert breakdown.produce_cost == 15000.0
    assert breakdown.transport_cost == 1200.0
    assert breakdown.expected_loss == 150.0
    assert breakdown.total == 15000.0 + 1200.0 + 150.0
    assert breakdown.is_economically_viable is True


def test_landed_cost_flags_economic_infeasibility():
    f1 = str(uuid4())
    allocations = [
        FarmerAllocation(farmer_id=f1, quantity_kg=10.0, price_per_kg=10.0, distance_km=500.0)
    ]
    # Produce cost = 100 INR, transport cost = 6000 INR -> Not viable!
    breakdown = calculate_landed_cost(
        allocations=allocations,
        total_route_distance_km=500.0,
        operating_cost_per_km=12.0,
        transit_hours=12.0,
        uses_hub=False,
    )
    assert breakdown.is_economically_viable is False
    assert breakdown.warning is not None


@pytest.mark.asyncio
async def test_vrp_solver_execution():
    locations = [
        {"lat": 22.5726, "lng": 88.3639, "quantity_kg": 0, "is_drop": False},  # Depot
        {"lat": 22.6000, "lng": 88.4000, "quantity_kg": 200, "is_drop": False},  # Pickup
        {"lat": 22.5000, "lng": 88.3000, "quantity_kg": 200, "is_drop": True},  # Drop
    ]
    result = await solve_vrp(locations, [500.0])
    assert result is not None
    assert result["status"] == "SUCCESS"
    assert len(result["routes"]) == 1
    assert result["total_distance_km"] > 0
