from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# --- Auth ---
class UserCreate(BaseModel):
    email: Optional[EmailStr] = None
    password: str
    full_name: str
    phone: Optional[str] = None
    role: str  # UserRole value

    @model_validator(mode="after")
    def _require_email_or_phone(self):
        if not self.email and not self.phone:
            raise ValueError("Provide at least an email or a mobile number")
        return self


class UserLogin(BaseModel):
    # Accept either an email or a mobile number
    email: str
    password: str


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
    category: Optional[str] = None
    unit: Optional[str] = "kg"
    quantity_kg: float
    min_order_quantity: Optional[float] = 1.0
    quality_grade: Optional[str] = None
    price_per_kg: Optional[float] = None
    harvest_date: Optional[datetime] = None
    availability_start: Optional[datetime] = None
    availability_end: Optional[datetime] = None
    pickup_location: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None


class ListingUpdate(BaseModel):
    crop_name: Optional[str] = None
    variety: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    quantity_kg: Optional[float] = None
    min_order_quantity: Optional[float] = None
    quality_grade: Optional[str] = None
    price_per_kg: Optional[float] = None
    availability_start: Optional[datetime] = None
    availability_end: Optional[datetime] = None
    pickup_location: Optional[str] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ListingResponse(BaseModel):
    id: UUID
    seller_id: UUID
    crop_name: str
    variety: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = "kg"
    quantity_kg: float
    min_order_quantity: Optional[float] = 1.0
    quality_grade: Optional[str] = None
    price_per_kg: Optional[float] = None
    harvest_date: Optional[datetime] = None
    pickup_location: Optional[str] = None
    is_active: bool
    description: Optional[str] = None
    images: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Orders ---
class OrderItemCreate(BaseModel):
    listing_id: UUID
    quantity_kg: float
    price_per_kg: float


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
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


class OrderResponse(BaseModel):
    id: UUID
    buyer_id: UUID
    status: str
    total_amount: Optional[float]
    delivery_address: Optional[str]
    delivery_deadline: Optional[datetime]
    notes: Optional[str] = None
    items: Optional[List[OrderItemResponse]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str


# --- AI / Matching ---
class MatchRequest(BaseModel):
    listing_id: UUID
    max_results: int = 5


class MatchResult(BaseModel):
    buyer_id: UUID
    score: float
    explanation: dict


# --- Logistics ---
class RouteRequest(BaseModel):
    pickup_locations: List[dict]  # [{lat, lng, quantity}]
    drop_locations: List[dict]    # [{lat, lng, quantity}]
    vehicle_capacity_kg: float
    deadline: Optional[datetime] = None


class RouteResponse(BaseModel):
    routes: List[dict]
    total_distance_km: float
    total_duration_min: float
    vehicle_count: int
