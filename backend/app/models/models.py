import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime,
    Enum, ForeignKey, JSON, UniqueConstraint, CheckConstraint
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
    price_per_kg = Column(Float, nullable=True)
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

    total_amount = Column(Float, nullable=True)
    delivery_address = Column(Text, nullable=True)
    delivery_latitude = Column(Float, nullable=True)
    delivery_longitude = Column(Float, nullable=True)
    delivery_deadline = Column(DateTime, nullable=True)

    # Logistics fields (for fulfill-order pipeline)
    produce_type = Column(String(255), nullable=True)  # tomato, potato, onion
    quantity_kg = Column(Float, nullable=True)  # total quantity buyer needs

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    buyer = relationship("User", backref="orders")
    items = relationship("OrderItem", back_populates="order")
    shipments = relationship("Shipment", back_populates="order", foreign_keys="Shipment.order_id")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("produce_listings.id"), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    price_per_kg = Column(Float, nullable=False)

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

    # Logistics extensions
    farmer_reliability_score = Column(Float, nullable=True)  # snapshot at allocation time
    hub_id = Column(UUID(as_uuid=True), ForeignKey("hubs.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    allocation_id = Column(UUID(as_uuid=True), ForeignKey("allocations.id"), nullable=False)
    logistics_provider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    status = Column(String(50), default="pending")
    route_plan = Column(JSON, nullable=True)
    estimated_distance_km = Column(Float, nullable=True)
    estimated_duration_min = Column(Float, nullable=True)
    actual_distance_km = Column(Float, nullable=True)
    actual_duration_min = Column(Float, nullable=True)

    pickup_latitude = Column(Float, nullable=True)
    pickup_longitude = Column(Float, nullable=True)
    drop_latitude = Column(Float, nullable=True)
    drop_longitude = Column(Float, nullable=True)

    # Logistics extensions
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True, index=True)
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id"), nullable=True, index=True)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True)
    pickup_time = Column(DateTime(timezone=True), nullable=True)
    delivery_time = Column(DateTime(timezone=True), nullable=True)
    landed_cost = Column(Float, nullable=True)
    consolidation_savings_km = Column(Float, nullable=True)
    route_mode = Column(String(20), nullable=True)  # direct / hub / multi_hub

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    order = relationship("Order", back_populates="shipments", foreign_keys=[order_id])
    route = relationship("Route", back_populates="shipments")
    vehicle = relationship("Vehicle", foreign_keys=[vehicle_id])
    temperature_logs = relationship("ShipmentTemperatureLog", back_populates="shipment",
                                    cascade="all, delete-orphan")
    logistics_events = relationship("LogisticsEvent", back_populates="shipment",
                                    cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    payer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    payee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    amount = Column(Float, nullable=False)
    status = Column(String(50), default="pending")  # pending, completed, failed, refunded
    payment_method = Column(String(50), nullable=True)
    transaction_id = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ==============================================================================
# LOGISTICS MODELS
# ==============================================================================

class VehicleType(str, enum.Enum):
    STANDARD = "standard"
    REFRIGERATED = "refrigerated"


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    IN_TRANSIT = "in_transit"
    MAINTENANCE = "maintenance"
    INACTIVE = "inactive"


class HubType(str, enum.Enum):
    LOCAL = "local"
    REGIONAL = "regional"


class HubStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class RouteStatus(str, enum.Enum):
    PLANNED = "planned"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class StopType(str, enum.Enum):
    PICKUP = "pickup"
    HUB = "hub"
    DROP = "drop"


class LogisticsEventType(str, enum.Enum):
    PLANNED = "planned"
    TRUCK_ASSIGNED = "truck_assigned"
    PICKUP_STARTED = "pickup_started"
    PICKUP_DONE = "pickup_done"
    HUB_ARRIVED = "hub_arrived"
    HUB_DEPARTED = "hub_departed"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    TRUCK_BREAKDOWN = "truck_breakdown"
    REROUTED = "rerouted"
    FARMER_CANCELLED = "farmer_cancelled"
    CANCELLED = "cancelled"


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

    __table_args__ = (
        CheckConstraint("capacity_kg > 0", name="ck_vehicles_capacity"),
        CheckConstraint("current_load_kg >= 0", name="ck_vehicles_current_load"),
        CheckConstraint("operating_cost_per_km > 0", name="ck_vehicles_operating_cost"),
    )

    routes = relationship("Route", back_populates="vehicle")


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

    __table_args__ = (
        CheckConstraint("capacity_kg > 0", name="ck_hubs_capacity"),
        CheckConstraint("current_load_kg >= 0", name="ck_hubs_current_load"),
    )

    inventory = relationship("HubInventory", back_populates="hub")


class Route(Base):
    __tablename__ = "routes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False, index=True)
    distance_km = Column(Float, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    status = Column(Enum(RouteStatus, name="routestatus"), default=RouteStatus.PLANNED)
    route_mode = Column(String(20), nullable=True)  # direct / hub / multi_hub

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("distance_km >= 0", name="ck_routes_distance"),
        CheckConstraint("duration_minutes >= 0", name="ck_routes_duration"),
    )

    vehicle = relationship("Vehicle", back_populates="routes")
    stops = relationship("RouteStop", back_populates="route", order_by="RouteStop.sequence")
    shipments = relationship("Shipment", back_populates="route")


class RouteStop(Base):
    __tablename__ = "route_stops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id"), nullable=False, index=True)
    stop_type = Column(Enum(StopType, name="stoptype"), nullable=False)

    # Polymorphic FK — only one populated per stop_type
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    hub_id = Column(UUID(as_uuid=True), ForeignKey("hubs.id", ondelete="SET NULL"), nullable=True, index=True)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    quantity_kg = Column(Float, nullable=False)
    sequence = Column(Integer, nullable=False)

    # Time windows and perishability
    time_window_earliest = Column(DateTime(timezone=True), nullable=True)
    time_window_latest = Column(DateTime(timezone=True), nullable=True)
    max_transit_hours = Column(Float, nullable=True)

    eta = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("route_id", "sequence", name="uq_route_stops_route_sequence"),
        CheckConstraint("quantity_kg >= 0", name="ck_route_stops_quantity"),
        CheckConstraint("sequence >= 1", name="ck_route_stops_sequence"),
    )

    route = relationship("Route", back_populates="stops")
    farmer = relationship("User", foreign_keys=[farmer_id])
    hub = relationship("Hub", foreign_keys=[hub_id])
    buyer = relationship("User", foreign_keys=[buyer_id])


class HubInventory(Base):
    __tablename__ = "hub_inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hub_id = Column(UUID(as_uuid=True), ForeignKey("hubs.id"), nullable=False, index=True)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("produce_listings.id"), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    arrived_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    quality_verified = Column(Boolean, default=False)
    quality_grade_verified = Column(String(50), nullable=True)
    weighed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    __table_args__ = (
        CheckConstraint("quantity_kg > 0", name="ck_hub_inventory_quantity"),
    )

    hub = relationship("Hub", back_populates="inventory")
    listing = relationship("ProduceListing")


class FarmerReliabilityScore(Base):
    __tablename__ = "farmer_reliability_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    reliability_score = Column(Float, nullable=False, default=0.7)
    total_orders_accepted = Column(Integer, nullable=False, default=0)
    orders_fulfilled_on_time = Column(Integer, nullable=False, default=0)
    orders_cancelled = Column(Integer, nullable=False, default=0)
    average_quantity_accuracy = Column(Float, nullable=True)
    last_updated = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("reliability_score >= 0.0 AND reliability_score <= 1.0",
                        name="ck_farmer_reliability_score_range"),
    )

    farmer = relationship("User")


class LogisticsEvent(Base):
    __tablename__ = "logistics_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shipment_id = Column(UUID(as_uuid=True), ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(Enum(LogisticsEventType, name="logisticseventtype"), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    shipment = relationship("Shipment", back_populates="logistics_events")


class ShipmentTemperatureLog(Base):
    __tablename__ = "shipment_temperature_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shipment_id = Column(UUID(as_uuid=True), ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False, index=True)
    temperature_celsius = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    shipment = relationship("Shipment", back_populates="temperature_logs")
