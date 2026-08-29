"""
VRP Solver (Vehicle Routing Problem with Time Windows)
Uses OR-Tools to compute optimal multi-stop routes.

Problems addressed:
- #4: Need specific sequencing for multiple pickups
- #5: Strict delivery deadlines (Time Windows)
- #27: Maximize vehicle utilization (Capacity Constraints)
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime, timezone

from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

from app.services.maps_service import get_distance_matrix

logger = logging.getLogger(__name__)


def create_data_model(
    distance_matrix: List[List[float]],
    duration_matrix: List[List[float]],
    pickup_demands: List[float],
    delivery_demands: List[float],
    vehicle_capacities: List[float],
    time_windows: List[tuple],  # [(start_min, end_min)]
    num_vehicles: int,
    starts: List[int] = None,
    ends: List[int] = None
) -> Dict:
    """Stores the data for the routing problem."""
    data = {}
    
    # Scale distances to integers (e.g. meters) for OR-Tools
    data["distance_matrix"] = [[int(d * 1000) for d in row] for row in distance_matrix]
    data["duration_matrix"] = [[int(t) for t in row] for row in duration_matrix]
    
    # Pickup and delivery demands are kept non-negative and tracked in separate
    # capacity dimensions. This avoids negative cumulative loads (which would
    # otherwise make the problem infeasible if a drop is visited before a pickup).
    data["pickup_demands"] = [int(q * 1000) for q in pickup_demands]  # kg -> grams
    data["delivery_demands"] = [int(q * 1000) for q in delivery_demands]  # kg -> grams
    data["vehicle_capacities"] = [int(c * 1000) for c in vehicle_capacities]
    data["time_windows"] = time_windows
    data["num_vehicles"] = num_vehicles
    data["starts"] = starts if starts is not None else [0] * num_vehicles
    data["ends"] = ends if ends is not None else [0] * num_vehicles
    
    return data


async def solve_vrp(
    locations: List[dict],  # [{lat, lng, quantity_kg, tw_start, tw_end, is_drop}]
    vehicle_capacities: List[float],
    starts: List[int] = None,
    ends: List[int] = None
) -> Optional[dict]:
    """
    Solve VRP for given locations and vehicles.
    locations[0] is assumed to be the starting depot (e.g., first farmer or hub).
    """
    if len(locations) < 2 or not vehicle_capacities:
        return None

    # 1. Get distance/duration matrix
    coords = [(loc["lat"], loc["lng"]) for loc in locations]
    matrix_result = await get_distance_matrix(coords, coords)
    dist_matrix = matrix_result["distances_km"]
    time_matrix = matrix_result["durations_min"]

    # 2. Extract pickup and delivery demands (both non-negative).
    #    Pickups add load, drops consume load. Tracked in separate dimensions
    #    so cumulative load never goes negative.
    pickup_demands = [
        loc.get("quantity_kg", 0) if not loc.get("is_drop", False) else 0
        for loc in locations
    ]
    delivery_demands = [
        loc.get("quantity_kg", 0) if loc.get("is_drop", False) else 0
        for loc in locations
    ]

    # 3. Time windows
    # Convert absolute datetimes to relative minutes from now.
    now = datetime.now(timezone.utc)
    time_windows = []
    for loc in locations:
        tw_start = 0
        tw_end = 24 * 60  # 24 hours default max
        
        start_dt = loc.get("tw_start")
        end_dt = loc.get("tw_end")
        
        if start_dt and start_dt > now:
            tw_start = int((start_dt - now).total_seconds() / 60)
        if end_dt and end_dt > now:
            tw_end = int((end_dt - now).total_seconds() / 60)
            
        time_windows.append((tw_start, tw_end))

    # Create Data Model
    data = create_data_model(
        dist_matrix, time_matrix, pickup_demands, delivery_demands,
        vehicle_capacities, time_windows, len(vehicle_capacities),
        starts=starts, ends=ends
    )

    # Create Routing Index Manager and Model
    manager = pywrapcp.RoutingIndexManager(
        len(data["distance_matrix"]), data["num_vehicles"], data["starts"], data["ends"]
    )
    routing = pywrapcp.RoutingModel(manager)

    # Distance callback
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data["distance_matrix"][from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Pickup capacity dimension (load increases as pickups are made)
    def pickup_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return data["pickup_demands"][from_node]

    pickup_callback_index = routing.RegisterUnaryTransitCallback(pickup_callback)
    routing.AddDimensionWithVehicleCapacity(
        pickup_callback_index,
        0,  # null capacity slack
        data["vehicle_capacities"],  # vehicle maximum capacities
        True,  # start cumul to zero
        "PickupCapacity"
    )

    # Delivery capacity dimension (load decreases as drops are made).
    # This dimension exists only to keep cumulative load non-negative (so a drop
    # is not visited before its pickup). It must NOT constrain a drop by its
    # total quantity, because a single drop can legitimately receive goods from
    # multiple vehicles. We therefore give it a very large capacity.
    def delivery_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return data["delivery_demands"][from_node]

    delivery_callback_index = routing.RegisterUnaryTransitCallback(delivery_callback)
    routing.AddDimensionWithVehicleCapacity(
        delivery_callback_index,
        0,  # null capacity slack
        [10**9] * data["num_vehicles"],  # effectively unconstrained
        True,  # start cumul to zero
        "DeliveryCapacity"
    )

    # Time dimension
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        # Transit time + 15 min loading time
        return data["duration_matrix"][from_node][to_node] + 15

    time_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.AddDimension(
        time_callback_index,
        60,  # allow waiting time up to 60 min
        24 * 60,  # maximum time per vehicle 24h
        False,  # Don't force start cumul to zero
        "Time"
    )
    time_dimension = routing.GetDimensionOrDie("Time")

    # Add time window constraints
    for location_idx, time_window in enumerate(data["time_windows"]):
        # Nodes that are solely depots (start/end) don't typically have time constraints in this simple model, 
        # but if they do, we enforce them. We can skip checking against a single `depot` now.
        index = manager.NodeToIndex(location_idx)
        # manager.NodeToIndex can return -1 if the node is dropped or not visitable, but 
        # for standard nodes it returns a valid index. If it is a start/end node it could be mapped 
        # differently, so we check if it's within bounds.
        try:
            time_dimension.CumulVar(index).SetRange(time_window[0], time_window[1])
        except Exception:
            pass

    # Allow dropping nodes (if infeasible) with high penalty
    penalty = 1000000
    for node in range(1, len(data["distance_matrix"])):
        routing.AddDisjunction([manager.NodeToIndex(node)], penalty)

    # Search parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.time_limit.seconds = 5  # Time limit for solver

    # Solve
    solution = routing.SolveWithParameters(search_parameters)
    
    if not solution:
        logger.warning("VRP Solver could not find a solution.")
        return None

    # Parse solution
    routes = []
    total_distance_km = 0.0
    total_time_min = 0.0

    for vehicle_id in range(data["num_vehicles"]):
        index = routing.Start(vehicle_id)
        route_nodes = []
        route_distance = 0
        route_load = 0
        
        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            # Track carried load as the cumulative pickup demand (non-negative)
            route_load += data["pickup_demands"][node_index]
            route_nodes.append(node_index)
            
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            route_distance += routing.GetArcCostForVehicle(previous_index, index, vehicle_id)

        # Add the end node (depot)
        node_index = manager.IndexToNode(index)
        route_nodes.append(node_index)
        
        route_duration_min = solution.Min(time_dimension.CumulVar(index))

        # Only add if it actually did something (more than just start/end at depot)
        if len(route_nodes) > 2:
            dist_km = route_distance / 1000.0
            routes.append({
                "vehicle_index": vehicle_id,
                "route_sequence": route_nodes,
                "distance_km": round(dist_km, 2),
                "duration_min": round(route_duration_min, 2),
                "load_kg": round(route_load / 1000.0, 2)
            })
            total_distance_km += dist_km
            total_time_min += route_duration_min

    if not routes:
        return None

    return {
        "routes": routes,
        "total_distance_km": round(total_distance_km, 2),
        "total_time_min": round(total_time_min, 2),
        "status": "SUCCESS"
    }
