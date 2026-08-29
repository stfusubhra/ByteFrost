from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# --- Auth ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: str  # UserRole value


class UserLogin(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str

    @model_validator(mode='after')
    def check_email_or_phone(self):
        if not self.email and not self.phone:
            raise ValueError('Either email or phone must be provided')
        return self
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    role: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


# --- Listings ---
class ListingCreate(BaseModel):
    crop_name: str
    variety: Optional[str] = None
    quantity_kg: float
    quality_grade: Optional[str] = None
    price_per_kg: Optional[float] = None
    harvest_date: Optional[datetime] = None
    availability_start: Optional[datetime] = None
    availability_end: Optional[datetime] = None
    pickup_location: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    description: Optional[str] = None


class ListingResponse(BaseModel):
    id: UUID
    seller_id: UUID
    crop_name: str
    variety: Optional[str]
    quantity_kg: float
    quality_grade: Optional[str]
    price_per_kg: Optional[float]
    harvest_date: Optional[datetime]
    pickup_location: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Orders ---
class OrderItemCreate(BaseModel):
    listing_id: UUID
    quantity_kg: float = Field(gt=0, description="Quantity in kg, must be positive")


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(min_length=1, description="At least one item is required")
    delivery_address: Optional[str] = None
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    delivery_deadline: Optional[datetime] = None
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: UUID
    listing_id: UUID
    quantity_kg: float
    price_per_kg: float

    class Config:
        from_attributes = True


class AllocationItem(BaseModel):
    listing_id: UUID
    quantity_kg: float = Field(gt=0, description="Quantity in kg, must be positive")


class AllocationRequest(BaseModel):
    items: List[AllocationItem] = Field(min_length=1, description="At least one item is required")


class OrderResponse(BaseModel):
    id: UUID
    buyer_id: UUID
    status: str
    total_amount: Optional[float]
    delivery_address: Optional[str]
    delivery_deadline: Optional[datetime]
    created_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


# --- AI / Matching ---
class MatchRequest(BaseModel):
    listing_id: UUID
    max_results: int = 5


class MatchResult(BaseModel):
    buyer_id: UUID
    score: float
    explanation: dict


# --- Logistics ---

# == Vehicle ==
class VehicleCreate(BaseModel):
    capacity_kg: float
    vehicle_type: str  # standard / refrigerated
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    operating_cost_per_km: float


class VehicleUpdate(BaseModel):
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    current_load_kg: Optional[float] = None


class VehicleResponse(BaseModel):
    id: UUID
    capacity_kg: float
    vehicle_type: str
    latitude: Optional[float]
    longitude: Optional[float]
    status: str
    current_load_kg: float
    operating_cost_per_km: float
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# == Hub ==
class HubCreate(BaseModel):
    name: str
    hub_type: str  # local / regional
    latitude: float
    longitude: float
    address: Optional[str] = None
    capacity_kg: float


class HubUpdate(BaseModel):
    status: Optional[str] = None
    capacity_kg: Optional[float] = None
    current_load_kg: Optional[float] = None


class HubResponse(BaseModel):
    id: UUID
    name: str
    hub_type: str
    latitude: float
    longitude: float
    address: Optional[str]
    capacity_kg: float
    current_load_kg: float
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# == Hub Inventory ==
class HubInventoryResponse(BaseModel):
    id: UUID
    hub_id: UUID
    listing_id: UUID
    quantity_kg: float
    arrived_at: datetime
    quality_verified: bool
    quality_grade_verified: Optional[str]

    class Config:
        from_attributes = True


# == Time Window ==
class TimeWindow(BaseModel):
    earliest: datetime
    latest: datetime


# == Route Stop ==
class RouteStopCreate(BaseModel):
    stop_type: str  # pickup / hub / drop
    farmer_id: Optional[UUID] = None
    hub_id: Optional[UUID] = None
    buyer_id: Optional[UUID] = None
    latitude: float
    longitude: float
    quantity_kg: float
    sequence: int
    time_window_earliest: Optional[datetime] = None
    time_window_latest: Optional[datetime] = None
    max_transit_hours: Optional[float] = None
    eta: Optional[datetime] = None


class RouteStopResponse(BaseModel):
    id: UUID
    stop_type: str
    farmer_id: Optional[UUID]
    hub_id: Optional[UUID]
    buyer_id: Optional[UUID]
    latitude: float
    longitude: float
    quantity_kg: float
    sequence: int
    time_window_earliest: Optional[datetime]
    time_window_latest: Optional[datetime]
    max_transit_hours: Optional[float]
    eta: Optional[datetime]

    class Config:
        from_attributes = True


# == Route ==
class RouteResponse(BaseModel):
    id: UUID
    vehicle_id: UUID
    distance_km: Optional[float]
    duration_minutes: Optional[int]
    status: str
    route_mode: Optional[str]
    stops: List[RouteStopResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


# == Buyer Requirement (fulfill-order input) ==
class BuyerRequirement(BaseModel):
    crop_name: str
    required_quantity_kg: float
    min_quality_grade: str = "B"
    delivery_latitude: float
    delivery_longitude: float
    delivery_address: str
    delivery_deadline: Optional[datetime] = None
    max_price_per_kg: Optional[float] = None


# == Landed Cost Breakdown ==
class LandedCostBreakdown(BaseModel):
    produce_cost: float
    transport_cost: float
    handling_cost: float
    expected_loss: float
    total: float

    model_config = {"from_attributes": True}


# == Vehicle Route (for fulfillment response) ==
class VehicleRouteResponse(BaseModel):
    vehicle_id: UUID
    stops: List[RouteStopResponse]
    distance_km: float
    duration_min: float
    load_kg: float
    operating_cost: float


# == Fulfillment Plan Response ==
class FulfillmentPlanResponse(BaseModel):
    status: str  # FEASIBLE / PARTIAL / INFEASIBLE
    infeasibility_reason: Optional[str] = None
    routing_mode: Optional[str] = None  # direct / hub / multi_hub
    vehicle_routes: List[VehicleRouteResponse] = []
    landed_cost: Optional[LandedCostBreakdown] = None
    consolidation_savings_km: Optional[float] = None
    estimated_delivery: Optional[datetime] = None
    shipment_ids: List[UUID] = []


# == Shipment ==
class ShipmentResponse(BaseModel):
    id: UUID
    allocation_id: UUID
    order_id: Optional[UUID]
    route_id: Optional[UUID]
    vehicle_id: Optional[UUID]
    status: str
    landed_cost: Optional[float]
    route_mode: Optional[str]
    pickup_time: Optional[datetime]
    delivery_time: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# == Tracking ==
class TrackingEventCreate(BaseModel):
    event_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None


class TrackingEventResponse(BaseModel):
    id: UUID
    event_type: str
    latitude: Optional[float]
    longitude: Optional[float]
    notes: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class TrackingStatus(BaseModel):
    shipment_id: UUID
    current_status: str
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    estimated_arrival: Optional[datetime] = None
    events: List[TrackingEventResponse] = []
    maps_url: Optional[str] = None


# == Temperature Log ==
class TemperatureLogCreate(BaseModel):
    temperature_celsius: float


class TemperatureLogResponse(BaseModel):
    id: UUID
    shipment_id: UUID
    temperature_celsius: float
    recorded_at: datetime

    class Config:
        from_attributes = True


# == Farmer Reliability ==
class FarmerReliabilityResponse(BaseModel):
    id: UUID
    farmer_id: UUID
    reliability_score: float
    total_orders_accepted: int
    orders_fulfilled_on_time: int
    orders_cancelled: int
    average_quantity_accuracy: Optional[float]
    last_updated: datetime

    class Config:
        from_attributes = True


# == Route Request (direct VRP-only call, backward compatible) ==
class RouteRequest(BaseModel):
    pickup_locations: List[dict]  # [{lat, lng, quantity}]
    drop_locations: List[dict]    # [{lat, lng, quantity}]
    vehicle_capacity_kg: float
    deadline: Optional[datetime] = None


# == Route Optimization (OR-Tools VRP response) ==
class RouteStopOptimization(BaseModel):
    type: str  # pickup / drop
    lat: float
    lng: float
    order: int
    quantity_kg: float


class VehicleRouteOptimization(BaseModel):
    vehicle_id: int
    stops: List[RouteStopOptimization]
    distance_km: float
    duration_min: float
    load_kg: float


class RouteOptimizationResponse(BaseModel):
    routes: List[VehicleRouteOptimization]
    total_distance_km: float
    total_duration_min: float
    vehicle_count: int

