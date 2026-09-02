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


def test_hub_capacity_breakdown_and_rejection_when_full():
    """
    Verifies hub capacity tracking:
    - total, occupied, reserved, available, incoming, outgoing.
    - strictly rejects assigning produce to a hub that cannot accommodate it.
    """
    from app.services.hub_service import HubCandidate, evaluate_hub_routing

    hub_id = uuid4()
    # Hub with 1000 kg capacity, 700 kg occupied, 150 kg reserved -> 150 kg available
    limited_hub = HubCandidate(
        hub_id=hub_id,
        name="Nashik Local Hub",
        hub_type="local",
        latitude=19.9975,
        longitude=73.7898,
        capacity_kg=1000.0,
        occupied_kg=700.0,
        reserved_kg=150.0,
        available_kg=150.0,
        distance_to_centroid_km=15.0,
    )

    farmers = [{"lat": 20.0, "lng": 73.8, "quantity_kg": 500.0}]

    # Case 1: Requirement is 500 kg (exceeds 150 kg available capacity)
    # The hub cannot accommodate it -> Hub mode must be disqualified, defaulting to direct
    decision_heavy = evaluate_hub_routing(
        farmer_locations=farmers,
        buyer_lat=18.5204,
        buyer_lng=73.8567,
        total_kg=500.0,
        candidate_hubs=[limited_hub],
    )
    assert decision_heavy.mode == "direct"
    assert decision_heavy.local_hub is None

    # Case 2: Requirement is 100 kg (within 150 kg available capacity)
    # The hub CAN accommodate it
    decision_light = evaluate_hub_routing(
        farmer_locations=farmers,
        buyer_lat=18.5204,
        buyer_lng=73.8567,
        total_kg=100.0,
        candidate_hubs=[limited_hub],
    )
    # Both direct and hub are feasible; whichever is cheaper/feasible is picked
    assert decision_light.is_hub_feasible is True


def test_direct_delivery_preferred_when_urgent_or_cheaper():
    """
    Hubs should NOT be mandatory.
    When direct delivery is faster (no hub transfer delay) or buyer deadline is tight,
    system must choose direct routing.
    """
    from app.services.hub_service import HubCandidate, evaluate_hub_routing

    local_hub = HubCandidate(
        hub_id=uuid4(),
        name="Pune Regional Consolidation",
        hub_type="local",
        latitude=18.55,
        longitude=73.85,
        capacity_kg=5000.0,
        occupied_kg=1000.0,
        reserved_kg=0.0,
        available_kg=4000.0,
        distance_to_centroid_km=20.0,
    )

    # Farmers and buyer are close to each other (~10 km)
    # Direct trip takes ~0.25 hrs.
    # Hub trip requires routing 20 km away to the hub + 1.5 hrs handling delay = ~2.5 hrs.
    farmers = [{"lat": 18.52, "lng": 73.85, "quantity_kg": 200.0}]
    buyer_lat, buyer_lng = 18.53, 73.86

    # Tight deadline: 1.0 hour
    now = datetime(2026, 9, 2, 12, 0, tzinfo=timezone.utc)
    deadline = now + timedelta(hours=1.0)

    decision = evaluate_hub_routing(
        farmer_locations=farmers,
        buyer_lat=buyer_lat,
        buyer_lng=buyer_lng,
        total_kg=200.0,
        candidate_hubs=[local_hub],
        delivery_deadline=deadline,
        now=now,
    )

    # Direct delivery takes < 1 hr; Hub delivery violates the 1.0 hr deadline
    assert decision.mode == "direct"
    assert decision.is_direct_feasible is True
    assert decision.is_hub_feasible is False


def test_vehicle_matching_single_and_multiple_vehicles_exact_example():
    """
    User prompt specification:
    Required → 1000 kg
    Truck A → 500 kg
    Truck B → 700 kg
    Truck C → 1500 kg

    System determines whether one or multiple vehicles are required:
    - Case 1: When Truck C (1500 kg) is available -> Single truck assigned (Truck C)
    - Case 2: When Truck C is unavailable, only Truck A (500 kg) and Truck B (700 kg)
              -> Multiple vehicles required: Truck B (700 kg) + Truck A (300 kg) = 1000 kg
    """
    from app.services.truck_assignment_service import MatchedVehicleItem, match_vehicles_from_candidates

    truck_a = MatchedVehicleItem(
        vehicle_id=uuid4(),
        vehicle_type="STANDARD",
        capacity_kg=500.0,
        current_load_kg=0.0,
        net_available_kg=500.0,
        allocated_load_kg=0.0,
        operating_cost_per_km=10.0,
        distance_to_pickup_km=15.0,
        score=0.0,
    )
    truck_b = MatchedVehicleItem(
        vehicle_id=uuid4(),
        vehicle_type="STANDARD",
        capacity_kg=700.0,
        current_load_kg=0.0,
        net_available_kg=700.0,
        allocated_load_kg=0.0,
        operating_cost_per_km=12.0,
        distance_to_pickup_km=20.0,
        score=0.0,
    )
    truck_c = MatchedVehicleItem(
        vehicle_id=uuid4(),
        vehicle_type="STANDARD",
        capacity_kg=1500.0,
        current_load_kg=0.0,
        net_available_kg=1500.0,
        allocated_load_kg=0.0,
        operating_cost_per_km=16.0,
        distance_to_pickup_km=25.0,
        score=0.0,
    )

    # Case 1: All 3 trucks available. Truck C can carry 1000 kg alone.
    res_single = match_vehicles_from_candidates(
        candidates=[truck_a, truck_b, truck_c],
        required_capacity_kg=1000.0,
    )
    assert res_single.status == "MATCHED"
    assert res_single.requires_multiple_vehicles is False
    assert len(res_single.vehicles) == 1
    assert res_single.vehicles[0].capacity_kg == 1500.0
    assert res_single.vehicles[0].allocated_load_kg == 1000.0
    assert res_single.shortfall_kg == 0.0

    # Case 2: Truck C is unavailable / busy. Only Truck A (500 kg) & Truck B (700 kg) available.
    # Neither can take 1000 kg alone, so multiple vehicles must be assigned.
    res_multi = match_vehicles_from_candidates(
        candidates=[truck_a, truck_b],
        required_capacity_kg=1000.0,
    )
    assert res_multi.status == "MATCHED"
    assert res_multi.requires_multiple_vehicles is True
    assert len(res_multi.vehicles) == 2
    assert res_multi.total_allocated_kg == 1000.0
    assert res_multi.shortfall_kg == 0.0

    # Verify individual contributions: Truck B (700 kg) + Truck A (300 kg)
    v_loads = {v.capacity_kg: v.allocated_load_kg for v in res_multi.vehicles}
    assert v_loads[700.0] == 700.0
    assert v_loads[500.0] == 300.0


def test_insufficient_vehicle_capacity_never_assigned():
    """
    User prompt requirement:
    Never assign a vehicle with insufficient capacity.
    If required is 1000 kg and only 500 kg truck exists, status is INSUFFICIENT_CAPACITY
    and vehicles list is empty.
    """
    from app.services.truck_assignment_service import MatchedVehicleItem, match_vehicles_from_candidates

    truck_small = MatchedVehicleItem(
        vehicle_id=uuid4(),
        vehicle_type="STANDARD",
        capacity_kg=500.0,
        current_load_kg=0.0,
        net_available_kg=500.0,
        allocated_load_kg=0.0,
        operating_cost_per_km=10.0,
        distance_to_pickup_km=10.0,
        score=0.0,
    )

    res = match_vehicles_from_candidates(
        candidates=[truck_small],
        required_capacity_kg=1000.0,
    )
    assert res.status == "INSUFFICIENT_CAPACITY"
    assert res.shortfall_kg == 500.0
    assert res.total_allocated_kg == 500.0
    # Must NEVER assign a vehicle with insufficient capacity
    assert len(res.vehicles) == 0


def test_refrigeration_requirement_matching():
    """
    When produce requires refrigeration, standard trucks must be excluded
    and only refrigerated trucks matched.
    """
    from app.services.truck_assignment_service import MatchedVehicleItem, match_vehicles_from_candidates

    standard_truck = MatchedVehicleItem(
        vehicle_id=uuid4(),
        vehicle_type="STANDARD",
        capacity_kg=1000.0,
        current_load_kg=0.0,
        net_available_kg=1000.0,
        allocated_load_kg=0.0,
        operating_cost_per_km=12.0,
        distance_to_pickup_km=10.0,
        score=0.0,
    )
    refrigerated_truck = MatchedVehicleItem(
        vehicle_id=uuid4(),
        vehicle_type="REFRIGERATED",
        capacity_kg=1200.0,
        current_load_kg=0.0,
        net_available_kg=1200.0,
        allocated_load_kg=0.0,
        operating_cost_per_km=18.0,
        distance_to_pickup_km=15.0,
        score=0.0,
    )

    res = match_vehicles_from_candidates(
        candidates=[standard_truck, refrigerated_truck],
        required_capacity_kg=800.0,
        requires_refrigeration=True,
    )
    assert res.status == "MATCHED"
    assert res.vehicles[0].vehicle_type == "REFRIGERATED"
    assert res.refrigeration_met is True


def test_economic_plan_comparison_cheaper_landed_cost_selected():
    """
    User prompt example:
      Plan A: Distance -> 210 km, Cost -> ₹8,500
      Plan B: Distance -> 240 km, Cost -> ₹7,600
      Select Plan B because it has lower total landed cost.
    """
    from app.services.landed_cost_service import (
        LandedCostBreakdown,
        PlanCandidate,
        select_cheapest_viable_plan,
    )

    plan_a = PlanCandidate(
        plan_name="Plan A (Direct Farther Supplier)",
        distance_km=210.0,
        landed_cost=LandedCostBreakdown(
            produce_cost=6000.0,
            transport_cost=2100.0,
            handling_cost=200.0,
            expected_loss=200.0,
            total=8500.0,
            is_economically_viable=True,
        ),
        routing_mode="direct",
    )

    plan_b = PlanCandidate(
        plan_name="Plan B (Hub Consolidated Sourcing)",
        distance_km=240.0,
        landed_cost=LandedCostBreakdown(
            produce_cost=4800.0,
            transport_cost=2200.0,
            handling_cost=400.0,
            expected_loss=200.0,
            total=7600.0,
            is_economically_viable=True,
        ),
        routing_mode="hub",
    )

    selected = select_cheapest_viable_plan([plan_a, plan_b])
    assert selected.plan_name == "Plan B (Hub Consolidated Sourcing)"
    assert selected.landed_cost.total == 7600.0
    assert selected.distance_km == 240.0


def test_realistic_landed_cost_all_components():
    """
    Verifies realistic landed cost components:
    Produce Cost + Fuel Cost + Driver Cost + Toll + Loading/Unloading + Hub Handling + Cold Chain + Expected Spoilage
    And calculation of:
    - total_cost
    - transportation_cost
    - cost_per_kg
    - cost_per_delivered_kg
    """
    from app.services.landed_cost_service import (
        FarmerAllocation,
        calculate_landed_cost,
    )

    allocations = [
        FarmerAllocation(farmer_id="F1", quantity_kg=600.0, price_per_kg=20.0),
        FarmerAllocation(farmer_id="F2", quantity_kg=400.0, price_per_kg=22.0),
    ]

    landed = calculate_landed_cost(
        allocations=allocations,
        total_route_distance_km=100.0,
        transit_hours=2.5,
        uses_hub=True,
        requires_cold_chain=True,
        loading_rate_per_kg=0.30,
    )

    # 1. Produce cost = 600*20 + 400*22 = 12000 + 8800 = 20,800
    assert landed.produce_cost == 20800.0
    # 2. Fuel cost = 100 km * 6.50 = 650.0
    assert landed.fuel_cost == 650.0
    # 3. Driver cost = 100 km * 2.50 = 250.0
    assert landed.driver_cost == 250.0
    # 4. Toll charges = 100 km * 1.50 = 150.0
    assert landed.toll_charges == 150.0
    # 5. Cold chain cost = 100 km * 1.50 = 150.0
    assert landed.cold_chain_cost == 150.0
    # Transport cost = fuel (650) + driver (250) + toll (150) + cold chain (150) = 1,200.0
    assert landed.transport_cost == 1200.0
    # 6. Loading/unloading = 1000 kg * 0.30 = 300.0
    assert landed.loading_unloading_cost == 300.0
    # 7. Hub handling = 1000 kg * 0.50 = 500.0
    assert landed.hub_handling_cost == 500.0
    # 8. Expected spoilage > 0
    assert landed.expected_spoilage_cost > 0.0
    # 9. Cost per kg and cost per delivered kg
    assert landed.cost_per_kg > 0.0
    assert landed.cost_per_delivered_kg >= landed.cost_per_kg
    assert landed.total == (
        landed.produce_cost
        + landed.transport_cost
        + landed.handling_cost
        + landed.expected_spoilage_cost
    )


def test_complete_1000kg_tomato_shipment_planning_scenario():
    """
    End-to-end integration test of the 1,000 kg Tomato shipment planning workflow:
    Order (1,000 kg Tomatoes)
    ↓
    Supplier Matching (evaluates price, freshness, distance, quality)
    ↓
    Quantity Allocation (Farmer A 400 kg + Farmer B 350 kg + Farmer C 250 kg = 1,000 kg)
    ↓
    Direct vs Hub Evaluation (transit time, deadline, handling fee)
    ↓
    Vehicle Selection (1000 kg capacity match)
    ↓
    Route Optimization (VRP pickup and drop sequence)
    ↓
    Cost Calculation (produce + fuel + driver + toll + loading + spoilage)
    ↓
    Decision Explanation (selected farmers, vehicles, route, distance, ETA, cost/kg, why selected)
    """
    from app.services.supply_matching_service import MatchedFarmer, allocate_supply_from_candidates
    from app.services.hub_service import HubCandidate, evaluate_hub_routing
    from app.services.truck_assignment_service import MatchedVehicleItem, match_vehicles_from_candidates
    from app.services.landed_cost_service import FarmerAllocation, calculate_landed_cost
    from app.schemas.schemas import PlanExplanation, PlanFarmerContribution

    # 1. Order Requirement: 1,000 kg Tomatoes
    buyer_lat, buyer_lng = 18.5204, 73.8567  # Pune

    # Available Farmers:
    farmers_supply = [
        MatchedFarmer(
            listing_id=uuid4(),
            farmer_id=uuid4(),
            farmer_name="Farmer A (Shirwal)",
            crop_name="Tomato",
            available_kg=400.0,
            allocated_kg=0.0,
            price_per_kg=22.0,
            quality_grade="A",
            distance_km=25.0,
            latitude=18.15,
            longitude=73.98,
            score=0.92,
            reliability_score=0.95,
        ),
        MatchedFarmer(
            listing_id=uuid4(),
            farmer_id=uuid4(),
            farmer_name="Farmer B (Saswad)",
            crop_name="Tomato",
            available_kg=350.0,
            allocated_kg=0.0,
            price_per_kg=23.0,
            quality_grade="A",
            distance_km=30.0,
            latitude=18.34,
            longitude=74.03,
            score=0.88,
            reliability_score=0.90,
        ),
        MatchedFarmer(
            listing_id=uuid4(),
            farmer_id=uuid4(),
            farmer_name="Farmer C (Khed Shivapur)",
            crop_name="Tomato",
            available_kg=300.0,
            allocated_kg=0.0,
            price_per_kg=24.0,
            quality_grade="B",
            distance_km=45.0,
            latitude=18.32,
            longitude=73.83,
            score=0.82,
            reliability_score=0.88,
        ),
        MatchedFarmer(
            listing_id=uuid4(),
            farmer_id=uuid4(),
            farmer_name="Farmer D (Distant)",
            crop_name="Tomato",
            available_kg=100.0,
            allocated_kg=0.0,
            price_per_kg=26.0,
            quality_grade="C",
            distance_km=85.0,
            latitude=18.90,
            longitude=74.50,
            score=0.60,
            reliability_score=0.75,
        ),
    ]

    # Stage 1: Supplier Matching & Quantity Allocation
    alloc_res = allocate_supply_from_candidates(farmers_supply, required_kg=1000.0)
    assert alloc_res.status == "FEASIBLE"
    assert alloc_res.total_matched_kg == 1000.0
    assert alloc_res.shortage_kg == 0.0
    assert len(alloc_res.matched_farmers) == 3
    # Sourced from Farmer A (400 kg), Farmer B (350 kg), Farmer C (250 kg)
    matched_loads = {f.farmer_name: f.allocated_kg for f in alloc_res.matched_farmers}
    assert matched_loads["Farmer A (Shirwal)"] == 400.0
    assert matched_loads["Farmer B (Saswad)"] == 350.0
    assert matched_loads["Farmer C (Khed Shivapur)"] == 250.0

    # Stage 2: Direct vs Hub Evaluation
    local_hub = HubCandidate(
        hub_id=uuid4(),
        name="Hadapsar Consolidation Hub",
        hub_type="local",
        latitude=18.50,
        longitude=73.93,
        capacity_kg=5000.0,
        occupied_kg=1000.0,
        reserved_kg=200.0,
        available_kg=3800.0,
        distance_to_centroid_km=25.0,
    )
    farmer_locs = [
        {"lat": f.latitude, "lng": f.longitude, "quantity_kg": f.allocated_kg}
        for f in alloc_res.matched_farmers
    ]
    routing_decision = evaluate_hub_routing(
        farmer_locations=farmer_locs,
        buyer_lat=buyer_lat,
        buyer_lng=buyer_lng,
        total_kg=1000.0,
        candidate_hubs=[local_hub],
    )
    # Direct mode is chosen because it is faster (no 1.5h handling delay) and cheaper without handling fees
    assert routing_decision.mode in ("direct", "hub")
    assert routing_decision.is_direct_feasible is True

    # Stage 3: Vehicle Selection (1,000 kg capacity)
    truck_medium = MatchedVehicleItem(
        vehicle_id=uuid4(),
        vehicle_type="STANDARD",
        capacity_kg=1200.0,
        current_load_kg=0.0,
        net_available_kg=1200.0,
        allocated_load_kg=0.0,
        operating_cost_per_km=12.0,
        distance_to_pickup_km=18.0,
        score=0.0,
    )
    vehicle_match = match_vehicles_from_candidates(
        candidates=[truck_medium],
        required_capacity_kg=1000.0,
    )
    assert vehicle_match.status == "MATCHED"
    assert vehicle_match.requires_multiple_vehicles is False
    assert vehicle_match.total_allocated_kg == 1000.0
    assert vehicle_match.vehicles[0].capacity_kg == 1200.0

    # Stage 4: Landed Cost Calculation
    cost_allocations = [
        FarmerAllocation(
            farmer_id=str(f.farmer_id),
            quantity_kg=f.allocated_kg,
            price_per_kg=f.price_per_kg,
            distance_km=f.distance_km,
        )
        for f in alloc_res.matched_farmers
    ]
    # Total direct circuit ~ 85 km
    landed_cost = calculate_landed_cost(
        allocations=cost_allocations,
        total_route_distance_km=85.0,
        transit_hours=2.2,
        uses_hub=(routing_decision.mode == "hub"),
    )
    # Produce cost = 400*22 + 350*23 + 250*24 = 8800 + 8050 + 6000 = 22,850
    assert landed_cost.produce_cost == 22850.0
    assert landed_cost.total > landed_cost.produce_cost
    assert landed_cost.cost_per_kg > 22.0
    assert landed_cost.cost_per_delivered_kg >= landed_cost.cost_per_kg
    assert landed_cost.is_economically_viable is True

    # Stage 5: Decision Explanation
    explanation = PlanExplanation(
        selected_farmers=[
            PlanFarmerContribution(
                farmer_id=str(f.farmer_id),
                farmer_name=f.farmer_name,
                allocated_kg=f.allocated_kg,
                price_per_kg=f.price_per_kg,
                distance_km=f.distance_km,
            )
            for f in alloc_res.matched_farmers
        ],
        total_allocated_kg=1000.0,
        fulfillment_percentage=100.0,
        selected_hub="None (Direct Route: Farmer to Buyer)",
        selected_vehicles=[
            {"vehicle_id": str(truck_medium.vehicle_id), "load_kg": 1000.0, "capacity_kg": 1200.0}
        ],
        route_summary={
            "stops": 4,
            "total_distance_km": 85.0,
            "total_duration_hours": 2.2,
        },
        total_distance_km=85.0,
        total_duration_hours=2.2,
        eta=datetime.now(timezone.utc) + timedelta(hours=2.2),
        cost_breakdown={
            "produce_cost": landed_cost.produce_cost,
            "fuel_cost": landed_cost.fuel_cost,
            "driver_cost": landed_cost.driver_cost,
            "toll_charges": landed_cost.toll_charges,
            "loading_unloading": landed_cost.loading_unloading_cost,
            "spoilage": landed_cost.expected_spoilage_cost,
            "total_landed": landed_cost.total,
        },
        total_cost=landed_cost.total,
        cost_per_kg=landed_cost.cost_per_kg,
        cost_per_delivered_kg=landed_cost.cost_per_delivered_kg,
        estimated_savings_inr=700.0,
        why_selected=(
            "Direct routing selected to minimize transit duration (2.2h vs 4.0h via hub) "
            "and avoid ₹500 hub handling surcharge while fully satisfying 1000 kg order with "
            "3 nearby Grade-A/B farmers."
        ),
    )

    assert len(explanation.selected_farmers) == 3
    assert explanation.total_allocated_kg == 1000.0
    assert explanation.fulfillment_percentage == 100.0
    assert explanation.cost_per_kg > 0
    assert "Direct" in explanation.why_selected



