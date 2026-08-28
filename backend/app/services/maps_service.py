"""
Maps & Distance Service
- Google Maps Distance Matrix API (if key present)
- Haversine fallback (40 km/h average speed)
- Google Maps deep-link URL builder for drivers
"""
import math
import os
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple

logger = logging.getLogger(__name__)

# Try to import googlemaps; fail gracefully if not installed
try:
    import googlemaps
    _GMAPS_AVAILABLE = True
except ImportError:
    _GMAPS_AVAILABLE = False
    logger.info("googlemaps package not installed — using Haversine fallback only")

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
AVERAGE_SPEED_KMH = 40.0  # rural India average
EARTH_RADIUS_KM = 6371.0


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two points in km."""
    lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def _get_gmaps_client():
    """Create Google Maps client if key is available."""
    if not GOOGLE_MAPS_API_KEY or not _GMAPS_AVAILABLE:
        return None
    try:
        return googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
    except Exception as e:
        logger.warning(f"Failed to create Google Maps client: {e}")
        return None


async def get_distance_matrix(
    origins: List[Tuple[float, float]],
    destinations: List[Tuple[float, float]],
) -> dict:
    """
    Get distance matrix between origins and destinations.

    Returns:
        {
            "distances_km": [[float]],   # origin x destination matrix
            "durations_min": [[float]],  # origin x destination matrix
            "source": "google_maps" | "haversine"
        }
    """
    client = _get_gmaps_client()
    if client:
        try:
            result = client.distance_matrix(
                origins=[(lat, lng) for lat, lng in origins],
                destinations=[(lat, lng) for lat, lng in destinations],
                mode="driving",
                units="metric",
            )
            distances_km = []
            durations_min = []
            for row in result["rows"]:
                d_row = []
                t_row = []
                for element in row["elements"]:
                    if element["status"] == "OK":
                        d_row.append(element["distance"]["value"] / 1000.0)
                        t_row.append(element["duration"]["value"] / 60.0)
                    else:
                        # Fall back to haversine for this pair
                        idx_o = result["rows"].index(row)
                        idx_d = row["elements"].index(element)
                        d = haversine(*origins[idx_o], *destinations[idx_d])
                        d_row.append(d)
                        t_row.append(d / AVERAGE_SPEED_KMH * 60)
                distances_km.append(d_row)
                durations_min.append(t_row)
            return {
                "distances_km": distances_km,
                "durations_min": durations_min,
                "source": "google_maps",
            }
        except Exception as e:
            logger.warning(f"Google Maps API error, falling back to Haversine: {e}")

    # Haversine fallback
    distances_km = []
    durations_min = []
    for o_lat, o_lng in origins:
        d_row = []
        t_row = []
        for d_lat, d_lng in destinations:
            d = haversine(o_lat, o_lng, d_lat, d_lng)
            d_row.append(round(d, 2))
            t_row.append(round(d / AVERAGE_SPEED_KMH * 60, 1))
        distances_km.append(d_row)
        durations_min.append(t_row)
    return {
        "distances_km": distances_km,
        "durations_min": durations_min,
        "source": "haversine",
    }


def estimate_eta(
    departure_time: datetime,
    distance_km: float,
    speed_kmh: float = AVERAGE_SPEED_KMH,
) -> datetime:
    """Estimate arrival time given departure + distance."""
    hours = distance_km / speed_kmh
    return departure_time + timedelta(hours=hours)


async def enrich_stops_with_eta(
    stops: list,
    departure_time: Optional[datetime] = None,
) -> list:
    """
    Given an ordered list of stops (dicts with lat/lng), compute cumulative ETA.
    Mutates each stop dict to add 'eta' and 'distance_from_prev_km'.
    """
    if not stops:
        return stops

    if departure_time is None:
        departure_time = datetime.now(timezone.utc)

    current_time = departure_time
    for i, stop in enumerate(stops):
        if i == 0:
            stop["distance_from_prev_km"] = 0.0
            stop["eta"] = current_time
            continue

        prev = stops[i - 1]
        d = haversine(prev["latitude"], prev["longitude"],
                      stop["latitude"], stop["longitude"])
        stop["distance_from_prev_km"] = round(d, 2)

        # 15 min loading/unloading per stop
        loading_minutes = 15
        travel_minutes = d / AVERAGE_SPEED_KMH * 60
        current_time = current_time + timedelta(minutes=travel_minutes + loading_minutes)
        stop["eta"] = current_time

    return stops


def build_google_maps_url(stops: List[Tuple[float, float]]) -> str:
    """
    Build a Google Maps directions deep-link for the driver.
    First stop is origin, last is destination, middle stops are waypoints.
    """
    if len(stops) < 2:
        return ""
    origin = f"{stops[0][0]},{stops[0][1]}"
    destination = f"{stops[-1][0]},{stops[-1][1]}"
    waypoints = "|".join(f"{lat},{lng}" for lat, lng in stops[1:-1])
    url = f"https://www.google.com/maps/dir/?api=1&origin={origin}&destination={destination}"
    if waypoints:
        url += f"&waypoints={waypoints}"
    return url
