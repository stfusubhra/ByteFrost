"""
Consolidation Service
Groups nearby farmers into batches to save on transport costs.

Problems addressed:
- #6: Farmers geographically scattered → clustering
- #19: Multiple buyers, same produce → multi-drop capability (handled in routing)
"""
import logging
from dataclasses import dataclass
from typing import List
from uuid import UUID

from app.services.maps_service import haversine

logger = logging.getLogger(__name__)

CONSOLIDATION_MAX_GAP_KM = 50.0  # Max distance between farmers to consider batching


@dataclass
class PickupStop:
    farmer_id: UUID
    latitude: float
    longitude: float
    quantity_kg: float


@dataclass
class ConsolidatedBatch:
    stops: List[PickupStop]
    total_quantity_kg: float
    centroid_lat: float
    centroid_lng: float


def consolidate_pickups(farmers: List[PickupStop], max_gap_km: float = CONSOLIDATION_MAX_GAP_KM) -> List[ConsolidatedBatch]:
    """
    Cluster farmers based on proximity (greedy clustering).
    """
    if not farmers:
        return []

    batches = []
    unassigned = list(farmers)

    while unassigned:
        # Start a new batch with the first unassigned farmer
        current = unassigned.pop(0)
        current_batch = [current]
        
        # Try to find other farmers near this batch
        i = 0
        while i < len(unassigned):
            candidate = unassigned[i]
            # Check distance to all existing stops in this batch
            is_near = any(
                haversine(stop.latitude, stop.longitude, candidate.latitude, candidate.longitude) <= max_gap_km
                for stop in current_batch
            )
            
            if is_near:
                current_batch.append(candidate)
                unassigned.pop(i)
            else:
                i += 1

        # Calculate centroid for the batch
        c_lat = sum(s.latitude for s in current_batch) / len(current_batch)
        c_lng = sum(s.longitude for s in current_batch) / len(current_batch)
        t_qty = sum(s.quantity_kg for s in current_batch)

        batches.append(ConsolidatedBatch(
            stops=current_batch,
            total_quantity_kg=t_qty,
            centroid_lat=c_lat,
            centroid_lng=c_lng
        ))

    return batches
