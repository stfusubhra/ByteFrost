import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime,
    Enum, ForeignKey, JSON, UniqueConstraint, Numeric
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class UserRole(str, enum.Enum):
    FARMER = "farmer"
    FPO_MANAGER = "fpo_manager"
    BUYER_BULK = "buyer_bulk"
    BUYER_RETAILER = "buyer_retailer"
    CONSUMER = "consumer"
    LOGISTICS = "logistics"
    ADMIN = "admin"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    ALLOCATED = "allocated"
    DISPATCHED = "dispatched"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class VehicleType(str, enum.Enum):
    STANDARD = "STANDARD"
    REFRIGERATED = "REFRIGERATED"


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    ASSIGNED = "ASSIGNED"
    IN_TRANSIT = "IN_TRANSIT"
    MAINTENANCE = "MAINTENANCE"
    INACTIVE = "INACTIVE"


class HubType(str, enum.Enum):
    LOCAL = "LOCAL"
    REGIONAL = "REGIONAL"


class HubStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class RouteStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class StopType(str, enum.Enum):
    PICKUP = "PICKUP"
    HUB = "HUB"
    DROP = "DROP"


class LogisticsEventType(str, enum.Enum):
    PLANNED = "PLANNED"
    TRUCK_ASSIGNED = "TRUCK_ASSIGNED"
    PICKUP_STARTED = "PICKUP_STARTED"
    PICKUP_DONE = "PICKUP_DONE"
    HUB_ARRIVED = "HUB_ARRIVED"
    HUB_DEPARTED = "HUB_DEPARTED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    TRUCK_BREAKDOWN = "TRUCK_BREAKDOWN"
    REROUTED = "REROUTED"
    FARMER_CANCELLED = "FARMER_CANCELLED"
    CANCELLED = "CANCELLED"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # Profile
    avatar_url = Column(String(500), nullable=True)
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class FPO(Base):
    __tablename__ = "fpos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    registration_number = Column(String(100), unique=True, nullable=True)
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    contact_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ProduceListing(Base):
    __tablename__ = "produce_listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    fpo_id = Column(UUID(as_uuid=True), ForeignKey("fpos.id"), nullable=True)

    crop_name = Column(String(255), nullable=False)
    variety = Column(String(255), nullable=True)
    quantity_kg = Column(Float, nullable=False)
    quality_grade = Column(String(50), nullable=True)  # A, B, C
    price_per_kg = Column(Numeric(12, 2), nullable=True)
    harvest_date = Column(DateTime, nullable=True)
    availability_start = Column(DateTime, nullable=True)
    availability_end = Column(DateTime, nullable=True)

    pickup_location = Column(Text, nullable=True)
    pickup_latitude = Column(Float, nullable=True)
    pickup_longitude = Column(Float, nullable=True)

    images = Column(JSON, default=list)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    seller = relationship("User", backref="listings")


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)

    total_amount = Column(Numeric(12, 2), nullable=True)
    delivery_address = Column(Text, nullable=True)
    delivery_latitude = Column(Float, nullable=True)
    delivery_longitude = Column(Float, nullable=True)
    delivery_deadline = Column(DateTime, nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    buyer = relationship("User", backref="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("produce_listings.id"), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    price_per_kg = Column(Numeric(12, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    listing = relationship("ProduceListing")


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("produce_listings.id"), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    score = Column(Float, nullable=True)  # matching score
    explanation = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # allocation_id is nullable because a shipment can be linked directly to an
    # order (fulfill-order flow) without going through a single allocation.
    allocation_id = Column(UUID(as_uuid=True), ForeignKey("allocations.id"), nullable=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True)
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id"), nullable=True)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True)
    logistics_provider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    status = Column(String(50), default="pending")
    route_plan = Column(JSON, nullable=True)
    route_mode = Column(String(20), nullable=True)
    estimated_distance_km = Column(Float, nullable=True)
    estimated_duration_min = Column(Float, nullable=True)
    landed_cost = Column(Float, nullable=True)
    consolidation_savings_km = Column(Float, nullable=True)
    pickup_time = Column(DateTime(timezone=True), nullable=True)
    delivery_time = Column(DateTime(timezone=True), nullable=True)
    actual_distance_km = Column(Float, nullable=True)
    actual_duration_min = Column(Float, nullable=True)

    pickup_latitude = Column(Float, nullable=True)
    pickup_longitude = Column(Float, nullable=True)
    drop_latitude = Column(Float, nullable=True)
    drop_longitude = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    payer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    payee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(50), default="pending")  # pending, completed, failed, refunded
    payment_method = Column(String(50), nullable=True)
    transaction_id = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    capacity_kg = Column(Float, nullable=False)
    vehicle_type = Column(Enum(VehicleType, name="vehicletype"), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(Enum(VehicleStatus, name="vehiclestatus"), default=VehicleStatus.AVAILABLE)
    current_load_kg = Column(Float, nullable=False, default=0)
    operating_cost_per_km = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class Hub(Base):
    __tablename__ = "hubs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    hub_type = Column(Enum(HubType, name="hubtype"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(Text, nullable=True)
    capacity_kg = Column(Float, nullable=False)
    current_load_kg = Column(Float, nullable=False, default=0)
    status = Column(Enum(HubStatus, name="hubstatus"), default=HubStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class Route(Base):
    __tablename__ = "routes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False)
    distance_km = Column(Float, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    status = Column(Enum(RouteStatus, name="routestatus"), default=RouteStatus.PLANNED)
    route_mode = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    vehicle = relationship("Vehicle")
    stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan")


class RouteStop(Base):
    __tablename__ = "route_stops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id"), nullable=False)
    stop_type = Column(Enum(StopType, name="stoptype"), nullable=False)
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    hub_id = Column(UUID(as_uuid=True), ForeignKey("hubs.id", ondelete="SET NULL"), nullable=True)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    quantity_kg = Column(Float, nullable=False)
    sequence = Column(Integer, nullable=False)
    time_window_earliest = Column(DateTime(timezone=True), nullable=True)
    time_window_latest = Column(DateTime(timezone=True), nullable=True)
    max_transit_hours = Column(Float, nullable=True)
    eta = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    route = relationship("Route", back_populates="stops")


class LogisticsEvent(Base):
    __tablename__ = "logistics_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shipment_id = Column(UUID(as_uuid=True), ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(Enum(LogisticsEventType, name="logisticseventtype"), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class HubInventory(Base):
    __tablename__ = "hub_inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hub_id = Column(UUID(as_uuid=True), ForeignKey("hubs.id"), nullable=False)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("produce_listings.id"), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    arrived_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    quality_verified = Column(Boolean, nullable=True)
    quality_grade_verified = Column(String(50), nullable=True)
    weighed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class FarmerReliabilityScore(Base):
    __tablename__ = "farmer_reliability_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    reliability_score = Column(Float, nullable=False, default=0.7)
    total_orders_accepted = Column(Integer, nullable=False, default=0)
    orders_fulfilled_on_time = Column(Integer, nullable=False, default=0)
    orders_cancelled = Column(Integer, nullable=False, default=0)
    average_quantity_accuracy = Column(Float, nullable=True)
    last_updated = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))


class ShipmentTemperatureLog(Base):
    __tablename__ = "shipment_temperature_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shipment_id = Column(UUID(as_uuid=True), ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False)
    temperature_celsius = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
