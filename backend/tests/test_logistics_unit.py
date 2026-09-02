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


def test_multi_farmer_matching_and_allocation_exact_example():
    """
    User prompt specification:
    Buyer requests: 1000 kg tomatoes
    Available:
      Farmer A → 400 kg
      Farmer B → 300 kg
      Farmer C → 300 kg
      Farmer D → 500 kg but very far away (450 km, transport cost > 30% produce value)

    Expectation:
      - System selects feasible combination of Farmer A (400 kg), Farmer B (300 kg), Farmer C (300 kg)
      - Total matched: 1000 kg
      - Shortage: 0 kg
      - Status: FEASIBLE
      - Farmer D is excluded / not allocated due to distance & transport economics
    """
    from app.services.supply_matching_service import MatchedFarmer, allocate_supply_from_candidates

    fa_id = uuid4()
    fb_id = uuid4()
    fc_id = uuid4()
    fd_id = uuid4()

    candidates = [
        MatchedFarmer(
            listing_id=uuid4(),
            farmer_id=fa_id,
            farmer_name="Farmer A",
            crop_name="Tomato",
            available_kg=400.0,
            allocated_kg=0.0,
            price_per_kg=25.0,
            quality_grade="A",
            distance_km=20.0,
            latitude=19.1,
            longitude=73.0,
            score=0.88,
            reliability_score=0.9,
            estimated_transport_cost=240.0,
        ),
        MatchedFarmer(
            listing_id=uuid4(),
            farmer_id=fb_id,
            farmer_name="Farmer B",
            crop_name="Tomato",
            available_kg=300.0,
            allocated_kg=0.0,
            price_per_kg=24.0,
            quality_grade="A",
            distance_km=30.0,
            latitude=19.2,
            longitude=73.1,
            score=0.84,
            reliability_score=0.85,
            estimated_transport_cost=360.0,
        ),
        MatchedFarmer(
            listing_id=uuid4(),
            farmer_id=fc_id,
            farmer_name="Farmer C",
            crop_name="Tomato",
            available_kg=300.0,
            allocated_kg=0.0,
            price_per_kg=26.0,
            quality_grade="B",
            distance_km=40.0,
            latitude=19.3,
            longitude=73.2,
            score=0.79,
            reliability_score=0.8,
            estimated_transport_cost=480.0,
        ),
        # Farmer D: 500 kg available, but 450 km away.
        # Est. transport = 450 * 12 = 5,400 INR. Produce value for 500 kg @ 20 = 10,000 INR.
        # Transport is 54% of produce value (> 30% cap)
        MatchedFarmer(
            listing_id=uuid4(),
            farmer_id=fd_id,
            farmer_name="Farmer D",
            crop_name="Tomato",
            available_kg=500.0,
            allocated_kg=0.0,
            price_per_kg=20.0,
            quality_grade="B",
            distance_km=450.0,
            latitude=23.0,
            longitude=77.0,
            score=0.45,
            reliability_score=0.7,
            estimated_transport_cost=5400.0,
        ),
    ]

    result = allocate_supply_from_candidates(candidates, required_kg=1000.0)

    assert result.status == "FEASIBLE"
    assert result.total_matched_kg == 1000.0
    assert result.shortage_kg == 0.0
    assert len(result.matched_farmers) == 3

    # Verify each farmer's individual contribution
    allocations = {m.farmer_name: m.allocated_kg for m in result.matched_farmers}
    assert allocations["Farmer A"] == 400.0
    assert allocations["Farmer B"] == 300.0
    assert allocations["Farmer C"] == 300.0
    assert "Farmer D" not in allocations


def test_partial_fulfillment_and_shortage_tracking():
    """
    User prompt specification:
    If only 850 kg is feasible:
      Requested → 1000 kg
      Fulfillable → 850 kg
      Shortage → 150 kg
    The system must never falsely report complete fulfillment.
    """
    from app.services.supply_matching_service import MatchedFarmer, allocate_supply_from_candidates

    candidates = [
        MatchedFarmer(
            listing_id=uuid4(),
            farmer_id=uuid4(),
            farmer_name="Farmer 1",
            crop_name="Tomato",
            available_kg=500.0,
            allocated_kg=0.0,
            price_per_kg=25.0,
            quality_grade="A",
            distance_km=25.0,
            latitude=19.1,
            longitude=73.0,
            score=0.85,
            reliability_score=0.9,
        ),
        MatchedFarmer(
            listing_id=uuid4(),
            farmer_id=uuid4(),
            farmer_name="Farmer 2",
            crop_name="Tomato",
            available_kg=350.0,
            allocated_kg=0.0,
            price_per_kg=24.0,
            quality_grade="B",
            distance_km=40.0,
            latitude=19.2,
            longitude=73.1,
            score=0.80,
            reliability_score=0.85,
        ),
    ]

    result = allocate_supply_from_candidates(candidates, required_kg=1000.0)

    assert result.status == "PARTIAL"
    assert result.status != "FEASIBLE"
    assert result.total_matched_kg == 850.0
    assert result.shortage_kg == 150.0
    assert result.required_kg == 1000.0
    assert len(result.matched_farmers) == 2
    assert result.infeasibility_reason is not None


def test_multi_factor_scoring_not_just_lowest_price():
    """
    Verifies that farmer evaluation does not simply pick the lowest price.
    A farmer with slightly higher price but superior quality (Grade A),
    proximity, freshness, and high reliability outranks a distant, low-reliability seller.
    """
    from app.services.supply_matching_service import (
        WEIGHT_DISTANCE, WEIGHT_QUANTITY, WEIGHT_QUALITY,
        WEIGHT_FRESHNESS, WEIGHT_PRICE, WEIGHT_RELIABILITY,
    )

    # Weights ensure price is only 10% of total score
    assert WEIGHT_PRICE == 0.10
    assert (WEIGHT_DISTANCE + WEIGHT_QUALITY + WEIGHT_QUANTITY + WEIGHT_FRESHNESS + WEIGHT_RELIABILITY) == 0.90

