"""
ByteFrost — Demo Dataset for Judge Scenario

Creates a deterministic demo dataset that allows judges to reproduce
the end-to-end marketplace intelligence workflow.

Canonical Demo Scenario:
  - Farmer Rahul Patil (Nashik): Tomato Cherry 500 kg @ Rs45/kg Grade A
  - Supporting farmers: Priya Shinde (Pune, Tomato Local 300 kg @ Rs30),
    Sunil Jadhav (Satara, Tomato Desi 300 kg @ Rs31)
  - Buyer FreshMart (Mumbai) needing 1000 kg tomatoes
  - Expected: AI match ~92% from the real matching service, refrigerated
    truck, Nashik → Mumbai (~165 km, ~2.5 hrs), full loop:
    farmer lists → pricing → discover → order → match → allocate →
    refrigerated shipment → tracking → earnings
  - Buyer also has seeded order history (2 delivered + 1 in-transit) so the
    history / insights / tracking pages are populated for the demo.

Canonical login credentials (phone-based, password `demo1234`):
  - Farmer:  +919876543210 / demo1234  (Rahul Patil, Nashik)
  - Buyer:   +918888888888 / demo1234  (FreshMart, Mumbai)
  - Farmers: +919876543211 / demo1234  (Priya Shinde, Pune)
            +919876543212 / demo1234  (Sunil Jadhav, Satara)

Safety:
  - Idempotent: re-running never creates duplicates (upserts by phone).
  - `--reset` deletes ONLY demo data (users with @kisansetu.demo emails /
    profile.demo flag, and vehicles/hubs/fpos marked demo=True). Real
    production data is never touched. No broad DELETEs.
  - Never runs on backend startup; it is an explicit operator command.

Usage:
    python seed_demo_data.py            # idempotent seed / upsert
    python seed_demo_data.py --reset    # wipe demo data, then reseed
"""

import argparse
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, or_, select

from app.models.models import (
    Allocation,
    FarmerReliabilityScore,
    FPO,
    Hub,
    HubInventory,
    HubType,
    LogisticsEvent,
    LogisticsEventType,
    Notification,
    Order,
    OrderItem,
    OrderStatus,
    Payment,
    ProduceListing,
    Route,
    RouteStatus,
    RouteStop,
    Shipment,
    ShipmentTemperatureLog,
    StopType,
    User,
    UserRole,
    Vehicle,
    VehicleStatus,
    VehicleType,
)

# ---------------------------------------------------------------------------
# Canonical demo dataset (single source of truth for demo credentials)
# ---------------------------------------------------------------------------

DEMO_EMAIL_DOMAIN = "@kisansetu.demo"

# Canonical demo users. Login is phone-based; emails are unique identifiers
# (schema requires them) and double as the demo-data marker.
DEMO_USERS = [
    {
        "email": "rahul.patil@kisansetu.demo",
        "password": "demo1234",
        "full_name": "Rahul Patil",
        "role": UserRole.FARMER,
        "phone": "+919876543210",
        "latitude": 19.9975,
        "longitude": 73.7900,
        "address": "Nashik Road, Maharashtra",
        "is_verified": True,
    },
    {
        "email": "priya.shinde@kisansetu.demo",
        "password": "demo1234",
        "full_name": "Priya Shinde",
        "role": UserRole.FARMER,
        "phone": "+919876543211",
        "latitude": 18.7500,
        "longitude": 73.8500,
        "address": "Pune Rural, Maharashtra",
        "is_verified": True,
    },
    {
        "email": "sunil.jadhav@kisansetu.demo",
        "password": "demo1234",
        "full_name": "Sunil Jadhav",
        "role": UserRole.FARMER,
        "phone": "+919876543212",
        "latitude": 17.6805,
        "longitude": 74.0183,
        "address": "Satara Town, Maharashtra",
        "is_verified": True,
    },
    {
        "email": "freshmart.mumbai@kisansetu.demo",
        "password": "demo1234",
        "full_name": "FreshMart Mumbai",
        "role": UserRole.BUYER_BULK,
        "phone": "+918888888888",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "address": "Linking Road, Bandra West, Mumbai, Maharashtra",
        "is_verified": True,
        "profile": {
            "business_name": "FreshMart Retail",
            "business_type": "retail_chain",
            "delivery_city": "Mumbai",
            "preferred_crops": ["Tomato", "Onion", "Potato"],
            "monthly_volume_kg": 5000.0,
            "onboarding_completed": True,
        },
    },
]

# Canonical phones — used to purge stale demo users on re-seed.
CANONICAL_PHONES = {u["phone"] for u in DEMO_USERS}

# Demo listings — the LIVE supply for the 1000kg demo scenario.
DEMO_LISTINGS = [
    {
        "seller_phone": "+919876543210",
        "crop_name": "Tomato",
        "variety": "Cherry",
        "quantity_kg": 500.0,
        "quality_grade": "A",
        "price_per_kg": 45.0,
        "pickup_location": "Nashik Road, Maharashtra",
        "pickup_latitude": 19.9975,
        "pickup_longitude": 73.7900,
        "availability_days": 3,
    },
    {
        "seller_phone": "+919876543211",
        "crop_name": "Tomato",
        "variety": "Local",
        "quantity_kg": 300.0,
        "quality_grade": "A",
        "price_per_kg": 30.0,
        "pickup_location": "Pune Rural, Maharashtra",
        "pickup_latitude": 18.7500,
        "pickup_longitude": 73.8500,
        "availability_days": 2,
    },
    {
        "seller_phone": "+919876543212",
        "crop_name": "Tomato",
        "variety": "Desi",
        "quantity_kg": 300.0,
        "quality_grade": "B",
        "price_per_kg": 31.0,
        "pickup_location": "Satara Town, Maharashtra",
        "pickup_latitude": 17.6805,
        "pickup_longitude": 74.0183,
        "availability_days": 4,
    },
]

# Mumbai delivery point for the buyer.
BUYER_LAT, BUYER_LNG = 19.0760, 72.8777
BUYER_ADDRESS = "Linking Road, Bandra West, Mumbai, Maharashtra"

# Historical orders for the buyer (populate history / insights / tracking).
# Each references its own (now inactive) listings so the live 1000kg supply
# stays pristine for the demo scenario.
HISTORY = [
    {
        "days_ago": 14,
        "status": OrderStatus.DELIVERED,
        "delivery_address": BUYER_ADDRESS,
        "items": [
            {"seller_phone": "+919876543210", "crop": "Tomato", "variety": "Cherry",
             "qty": 300.0, "price": 44.0, "grade": "A", "loc": "Nashik Road, Maharashtra", "lat": 19.9975, "lng": 73.7900},
            {"seller_phone": "+919876543211", "crop": "Tomato", "variety": "Local",
             "qty": 200.0, "price": 30.0, "grade": "A", "loc": "Pune Rural, Maharashtra", "lat": 18.7500, "lng": 73.8500},
        ],
        "shipment": {
            "status": "delivered",
            "route_mode": "direct",
            "distance_km": 165.0,
            "duration_min": 150.0,
            "landed_cost": 19200.0,
            "savings_km": 0.0,
        },
        "events": ["PLANNED", "TRUCK_ASSIGNED", "PICKUP_STARTED", "PICKUP_DONE", "IN_TRANSIT", "DELIVERED"],
        "notifications": [
            {"title": "Order delivered", "body": "Your order of 500 kg Tomato was delivered to Mumbai.",
             "category": "order", "link": None, "is_read": True},
        ],
    },
    {
        "days_ago": 7,
        "status": OrderStatus.DELIVERED,
        "delivery_address": BUYER_ADDRESS,
        "items": [
            {"seller_phone": "+919876543211", "crop": "Tomato", "variety": "Local",
             "qty": 250.0, "price": 29.0, "grade": "A", "loc": "Pune Rural, Maharashtra", "lat": 18.7500, "lng": 73.8500},
            {"seller_phone": "+919876543212", "crop": "Tomato", "variety": "Desi",
             "qty": 150.0, "price": 30.0, "grade": "B", "loc": "Satara Town, Maharashtra", "lat": 17.6805, "lng": 74.0183},
        ],
        "shipment": {
            "status": "delivered",
            "route_mode": "direct",
            "distance_km": 118.0,
            "duration_min": 165.0,
            "landed_cost": 11750.0,
            "savings_km": 0.0,
        },
        "events": ["PLANNED", "TRUCK_ASSIGNED", "PICKUP_STARTED", "PICKUP_DONE", "IN_TRANSIT", "DELIVERED"],
        "notifications": [
            {"title": "Order delivered", "body": "Your order of 400 kg Tomato was delivered to Mumbai.",
             "category": "order", "link": None, "is_read": True},
        ],
    },
    {
        "days_ago": 2,
        "status": OrderStatus.IN_TRANSIT,
        "delivery_address": BUYER_ADDRESS,
        "items": [
            {"seller_phone": "+919876543210", "crop": "Tomato", "variety": "Cherry",
             "qty": 300.0, "price": 45.0, "grade": "A", "loc": "Nashik Road, Maharashtra", "lat": 19.9975, "lng": 73.7900},
            {"seller_phone": "+919876543211", "crop": "Tomato", "variety": "Local",
             "qty": 200.0, "price": 30.0, "grade": "A", "loc": "Pune Rural, Maharashtra", "lat": 18.7500, "lng": 73.8500},
            {"seller_phone": "+919876543212", "crop": "Tomato", "variety": "Desi",
             "qty": 100.0, "price": 31.0, "grade": "B", "loc": "Satara Town, Maharashtra", "lat": 17.6805, "lng": 74.0183},
        ],
        "shipment": {
            "status": "in_transit",
            "route_mode": "direct",
            "distance_km": 165.0,
            "duration_min": 150.0,
            "landed_cost": 21610.0,
            "savings_km": 18.0,
        },
        "events": ["PLANNED", "TRUCK_ASSIGNED", "PICKUP_STARTED", "PICKUP_DONE", "IN_TRANSIT"],
        "notifications": [
            {"title": "Shipment in transit", "body": "Your 600 kg Tomato shipment is on the way and expected today.",
             "category": "shipment", "link": None, "is_read": False},
        ],
    },
]

DEMO_VEHICLES = [
    {"capacity_kg": 2000.0, "vehicle_type": VehicleType.STANDARD, "latitude": 19.0760,
     "longitude": 72.8777, "status": VehicleStatus.AVAILABLE, "operating_cost_per_km": 18.0},
    {"capacity_kg": 1500.0, "vehicle_type": VehicleType.REFRIGERATED, "latitude": 19.9975,
     "longitude": 73.7900, "status": VehicleStatus.AVAILABLE, "operating_cost_per_km": 26.0},
]

DEMO_HUBS = [
    {"name": "Mumbai Regional Hub", "hub_type": HubType.REGIONAL, "latitude": 19.0760, "longitude": 72.8777,
     "address": "Mumbai, Maharashtra", "capacity_kg": 20000.0},
    {"name": "Nashik Agri Hub", "hub_type": HubType.LOCAL, "latitude": 19.9975, "longitude": 73.7900,
     "address": "Nashik, Maharashtra", "capacity_kg": 10000.0},
]


# ---------------------------------------------------------------------------
# Demo-only reset (production safe)
# ---------------------------------------------------------------------------

async def _reset_demo(session):
    """Delete ONLY demo data. Real (non-demo) records are never touched."""
    # Identify demo users: email domain marker OR profile.demo flag.
    demo_users = (
        await session.execute(
            select(User).where(
                User.email.like(f"%{DEMO_EMAIL_DOMAIN}")
                | (func.json_extract_path_text(User.profile, "demo") == "true")
            )
        )
    ).scalars().all()
    demo_user_ids = [u.id for u in demo_users]

    demo_vehicles = (
        await session.execute(select(Vehicle).where(Vehicle.demo == True))  # noqa: E712
    ).scalars().all()
    demo_vehicle_ids = [v.id for v in demo_vehicles]

    demo_hubs = (
        await session.execute(select(Hub).where(Hub.demo == True))  # noqa: E712
    ).scalars().all()
    demo_hub_ids = [h.id for h in demo_hubs]

    demo_fpos = (
        await session.execute(select(FPO).where(FPO.demo == True))  # noqa: E712
    ).scalars().all()
    demo_fpo_ids = [f.id for f in demo_fpos]

    if not demo_user_ids and not demo_vehicle_ids and not demo_hub_ids and not demo_fpo_ids:
        print("  ✓ no demo data found — nothing to reset")
        return

    # Demo listings (seller is a demo user)
    demo_listing_ids = (
        await session.execute(
            select(ProduceListing.id).where(ProduceListing.seller_id.in_(demo_user_ids))
        )
    ).scalars().all()

    # Demo orders (buyer is a demo user)
    demo_order_ids = (
        await session.execute(select(Order.id).where(Order.buyer_id.in_(demo_user_ids)))
    ).scalars().all()

    # Demo routes (demo vehicle OR belonging to a demo order's shipment)
    demo_route_ids = (
        await session.execute(
            select(Route.id).where(
                Route.vehicle_id.in_(demo_vehicle_ids)
                | Route.id.in_(
                    select(Shipment.route_id).where(Shipment.order_id.in_(demo_order_ids))
                )
            )
        )
    ).scalars().all()
    demo_shipment_ids = (
        await session.execute(
            select(Shipment.id).where(
                Shipment.order_id.in_(demo_order_ids)
                | Shipment.vehicle_id.in_(demo_vehicle_ids)
            )
        )
    ).scalars().all()

    # Delete in FK-safe order (children before parents).
    if demo_user_ids:
        await session.execute(delete(Notification).where(Notification.user_id.in_(demo_user_ids)))
    if demo_shipment_ids:
        await session.execute(
            delete(LogisticsEvent).where(LogisticsEvent.shipment_id.in_(demo_shipment_ids))
        )
        await session.execute(
            delete(ShipmentTemperatureLog).where(ShipmentTemperatureLog.shipment_id.in_(demo_shipment_ids))
        )
    if demo_route_ids or demo_user_ids:
        conds = []
        if demo_route_ids:
            conds.append(RouteStop.route_id.in_(demo_route_ids))
        if demo_user_ids:
            conds.append(RouteStop.farmer_id.in_(demo_user_ids))
            conds.append(RouteStop.buyer_id.in_(demo_user_ids))
        await session.execute(delete(RouteStop).where(or_(*conds)))
    if demo_shipment_ids:
        await session.execute(delete(Shipment).where(Shipment.id.in_(demo_shipment_ids)))
    if demo_route_ids:
        await session.execute(delete(Route).where(Route.id.in_(demo_route_ids)))
    if demo_order_ids or demo_listing_ids:
        conds = []
        if demo_order_ids:
            conds.append(Allocation.order_id.in_(demo_order_ids))
        if demo_listing_ids:
            conds.append(Allocation.listing_id.in_(demo_listing_ids))
        await session.execute(delete(Allocation).where(or_(*conds)))
    if demo_order_ids:
        await session.execute(delete(OrderItem).where(OrderItem.order_id.in_(demo_order_ids)))
        await session.execute(delete(Order).where(Order.id.in_(demo_order_ids)))
    if demo_hub_ids or demo_listing_ids:
        conds = []
        if demo_hub_ids:
            conds.append(HubInventory.hub_id.in_(demo_hub_ids))
        if demo_listing_ids:
            conds.append(HubInventory.listing_id.in_(demo_listing_ids))
        await session.execute(delete(HubInventory).where(or_(*conds)))
    if demo_listing_ids:
        await session.execute(delete(ProduceListing).where(ProduceListing.id.in_(demo_listing_ids)))
    if demo_order_ids or demo_user_ids:
        conds = []
        if demo_order_ids:
            conds.append(Payment.order_id.in_(demo_order_ids))
        if demo_user_ids:
            conds.append(Payment.payer_id.in_(demo_user_ids) | Payment.payee_id.in_(demo_user_ids))
        await session.execute(delete(Payment).where(or_(*conds)))
    if demo_user_ids:
        await session.execute(
            delete(FarmerReliabilityScore).where(FarmerReliabilityScore.farmer_id.in_(demo_user_ids))
        )
    if demo_vehicle_ids:
        await session.execute(delete(Vehicle).where(Vehicle.id.in_(demo_vehicle_ids)))
    if demo_hub_ids:
        await session.execute(delete(Hub).where(Hub.id.in_(demo_hub_ids)))
    if demo_fpo_ids:
        await session.execute(delete(FPO).where(FPO.id.in_(demo_fpo_ids)))
    if demo_user_ids:
        await session.execute(delete(User).where(User.id.in_(demo_user_ids)))

    # One-time migration: legacy demo vehicles/hubs created by pre-marker seed
    # versions (no demo flag). Only removed when unreferenced by any remaining
    # route / shipment / hub inventory, so real data is never touched.
    legacy_hub_ids = (
        await session.execute(
            select(Hub.id).where(
                Hub.demo == False,  # noqa: E712
                Hub.name.in_(["Pune Central Hub", "Nashik Agri Hub"]),
                ~Hub.id.in_(select(HubInventory.hub_id)),
            )
        )
    ).scalars().all()
    if legacy_hub_ids:
        await session.execute(delete(Hub).where(Hub.id.in_(legacy_hub_ids)))
        print(f"  ✓ removed {len(legacy_hub_ids)} legacy demo hub(s)")

    legacy_vehicle_ids = (
        await session.execute(
            select(Vehicle.id).where(
                Vehicle.demo == False,  # noqa: E712
                or_(
                    (Vehicle.vehicle_type == VehicleType.STANDARD)
                    & (Vehicle.capacity_kg == 2000.0)
                    & (Vehicle.operating_cost_per_km == 18.0),
                    (Vehicle.vehicle_type == VehicleType.REFRIGERATED)
                    & (Vehicle.capacity_kg == 1500.0)
                    & (Vehicle.operating_cost_per_km == 26.0),
                ),
                ~Vehicle.id.in_(select(Route.vehicle_id)),
                ~Vehicle.id.in_(select(Shipment.vehicle_id)),
            )
        )
    ).scalars().all()
    if legacy_vehicle_ids:
        await session.execute(delete(Vehicle).where(Vehicle.id.in_(legacy_vehicle_ids)))
        print(f"  ✓ removed {len(legacy_vehicle_ids)} legacy demo vehicle(s)")

    print(
        f"  ✓ reset {len(demo_user_ids)} demo users, {len(demo_listing_ids)} listings, "
        f"{len(demo_order_ids)} orders, {len(demo_vehicle_ids)} vehicles, "
        f"{len(demo_hub_ids)} hubs, {len(demo_fpo_ids)} fpos"
    )


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------

async def _upsert_user(session, data):
    """Upsert a demo user by phone. Returns the User row."""
    from app.core.security import hash_password

    result = await session.execute(select(User).where(User.phone == data["phone"]))
    user = result.scalar_one_or_none()
    if user is None:
        result = await session.execute(select(User).where(User.email == data["email"]))
        user = result.scalar_one_or_none()

    profile = dict(data.get("profile") or {})
    profile["demo"] = True

    if user is None:
        user = User(
            email=data["email"],
            phone=data["phone"],
            full_name=data["full_name"],
            hashed_password=hash_password(data["password"]),
            role=data["role"],
            latitude=data["latitude"],
            longitude=data["longitude"],
            address=data["address"],
            is_verified=data.get("is_verified", False),
            profile=profile,
        )
        session.add(user)
        await session.flush()
        print(f"  ✓ {data['phone']} ({data['full_name']}) created")
    else:
        user.email = data["email"]
        user.phone = data["phone"]
        user.full_name = data["full_name"]
        user.hashed_password = hash_password(data["password"])
        user.role = data["role"]
        user.latitude = data["latitude"]
        user.longitude = data["longitude"]
        user.address = data["address"]
        user.is_verified = data.get("is_verified", False)
        user.profile = profile
        await session.flush()
        print(f"  ✓ {data['phone']} ({data['full_name']}) updated")
    return user


async def _purge_stale_demo_users(session):
    """Delete demo users that are no longer part of the canonical set.

    Migrates away from legacy seed versions (e.g. rahul.farmer@kisansetu.demo,
    freshmart@kisansetu.demo with password demo123) so the demo dataset stays
    deterministic even without an explicit --reset.
    """
    demo_users = (
        await session.execute(
            select(User).where(User.email.like(f"%{DEMO_EMAIL_DOMAIN}"))
        )
    ).scalars().all()
    stale = [u for u in demo_users if u.phone not in CANONICAL_PHONES]
    if not stale:
        return
    stale_ids = [u.id for u in stale]

    listing_ids = (
        await session.execute(select(ProduceListing.id).where(ProduceListing.seller_id.in_(stale_ids)))
    ).scalars().all()
    order_ids = (
        await session.execute(select(Order.id).where(Order.buyer_id.in_(stale_ids)))
    ).scalars().all()
    shipment_ids = (
        await session.execute(select(Shipment.id).where(Shipment.order_id.in_(order_ids)))
    ).scalars().all()
    route_ids = (
        await session.execute(
            select(Route.id).where(
                Route.id.in_(select(Shipment.route_id).where(Shipment.id.in_(shipment_ids)))
            )
        )
    ).scalars().all()

    if stale_ids:
        await session.execute(delete(Notification).where(Notification.user_id.in_(stale_ids)))
    if shipment_ids:
        await session.execute(delete(LogisticsEvent).where(LogisticsEvent.shipment_id.in_(shipment_ids)))
        await session.execute(delete(ShipmentTemperatureLog).where(ShipmentTemperatureLog.shipment_id.in_(shipment_ids)))
    if route_ids:
        await session.execute(delete(RouteStop).where(RouteStop.route_id.in_(route_ids)))
    if stale_ids:
        await session.execute(
            delete(RouteStop).where(RouteStop.farmer_id.in_(stale_ids) | RouteStop.buyer_id.in_(stale_ids))
        )
    if shipment_ids:
        await session.execute(delete(Shipment).where(Shipment.id.in_(shipment_ids)))
    if route_ids:
        await session.execute(delete(Route).where(Route.id.in_(route_ids)))
    if order_ids or listing_ids:
        conds = []
        if order_ids:
            conds.append(Allocation.order_id.in_(order_ids))
        if listing_ids:
            conds.append(Allocation.listing_id.in_(listing_ids))
        await session.execute(delete(Allocation).where(or_(*conds)))
    if order_ids:
        await session.execute(delete(OrderItem).where(OrderItem.order_id.in_(order_ids)))
        await session.execute(delete(Order).where(Order.id.in_(order_ids)))
    if listing_ids:
        await session.execute(delete(ProduceListing).where(ProduceListing.id.in_(listing_ids)))
    if order_ids or stale_ids:
        conds = []
        if order_ids:
            conds.append(Payment.order_id.in_(order_ids))
        if stale_ids:
            conds.append(Payment.payer_id.in_(stale_ids) | Payment.payee_id.in_(stale_ids))
        await session.execute(delete(Payment).where(or_(*conds)))
    if stale_ids:
        await session.execute(
            delete(FarmerReliabilityScore).where(FarmerReliabilityScore.farmer_id.in_(stale_ids))
        )
        await session.execute(delete(User).where(User.id.in_(stale_ids)))
    print(f"  ✓ purged {len(stale)} stale demo user(s): {', '.join(u.email for u in stale)}")


async def seed_demo_data(reset: bool = False):
    """Create or reset demo dataset."""
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        if reset:
            print("Resetting demo data...")
            await _reset_demo(session)
            await session.commit()

        # --- Users ---
        print("\nCreating demo users...")
        users_by_phone = {}
        for user_data in DEMO_USERS:
            user = await _upsert_user(session, user_data)
            users_by_phone[user.phone] = user

        # Purge stale demo users from previous seed versions (e.g. legacy
        # rahul.farmer@kisansetu.demo / freshmart@kisansetu.demo accounts).
        await _purge_stale_demo_users(session)
        await session.flush()

        # --- Listings (live demo supply) ---
        print("\nCreating demo listings...")
        listings = {}
        for listing_data in DEMO_LISTINGS:
            seller = users_by_phone[listing_data["seller_phone"]]
            result = await session.execute(
                select(ProduceListing).where(
                    ProduceListing.seller_id == seller.id,
                    ProduceListing.crop_name == listing_data["crop_name"],
                    ProduceListing.variety == listing_data["variety"],
                    ProduceListing.is_active == True,  # noqa: E712
                )
            )
            existing = result.scalar_one_or_none()
            if existing:
                existing.quantity_kg = listing_data["quantity_kg"]
                existing.quality_grade = listing_data["quality_grade"]
                existing.price_per_kg = listing_data["price_per_kg"]
                existing.pickup_location = listing_data["pickup_location"]
                existing.pickup_latitude = listing_data["pickup_latitude"]
                existing.pickup_longitude = listing_data["pickup_longitude"]
                existing.availability_start = datetime.now(timezone.utc).replace(tzinfo=None)
                existing.availability_end = (
                    datetime.now(timezone.utc) + timedelta(days=listing_data["availability_days"])
                ).replace(tzinfo=None)
                existing.is_active = True
                await session.flush()
                print(f"  ✓ {listing_data['crop_name']} {listing_data['variety']} {listing_data['quantity_kg']}kg @ Rs{listing_data['price_per_kg']} (updated)")
                listings[seller.phone] = existing
                continue
            listing = ProduceListing(
                seller_id=seller.id,
                crop_name=listing_data["crop_name"],
                variety=listing_data["variety"],
                quantity_kg=listing_data["quantity_kg"],
                quality_grade=listing_data["quality_grade"],
                price_per_kg=listing_data["price_per_kg"],
                harvest_date=datetime.now(timezone.utc).date(),
                pickup_location=listing_data["pickup_location"],
                pickup_latitude=listing_data["pickup_latitude"],
                pickup_longitude=listing_data["pickup_longitude"],
                availability_start=datetime.now(timezone.utc).replace(tzinfo=None),
                availability_end=(datetime.now(timezone.utc) + timedelta(days=listing_data["availability_days"])).replace(tzinfo=None),
                is_active=True,
            )
            session.add(listing)
            await session.flush()
            listings[seller.phone] = listing
            print(f"  ✓ {listing_data['crop_name']} {listing_data['variety']} {listing_data['quantity_kg']}kg @ Rs{listing_data['price_per_kg']} created")

        # --- Vehicles & hubs (idempotent by demo flag + identity) ---
        print("\nCreating vehicles & hubs...")
        vehicles = []
        for v in DEMO_VEHICLES:
            result = await session.execute(
                select(Vehicle).where(
                    Vehicle.demo == True,  # noqa: E712
                    Vehicle.vehicle_type == v["vehicle_type"],
                )
            )
            vehicle = result.scalar_one_or_none()
            if vehicle:
                vehicle.capacity_kg = v["capacity_kg"]
                vehicle.latitude = v["latitude"]
                vehicle.longitude = v["longitude"]
                vehicle.status = v["status"]
                vehicle.operating_cost_per_km = v["operating_cost_per_km"]
                await session.flush()
            else:
                vehicle = Vehicle(**v, demo=True)
                session.add(vehicle)
                await session.flush()
            vehicles.append(vehicle)
        hubs = []
        for h in DEMO_HUBS:
            result = await session.execute(
                select(Hub).where(Hub.demo == True, Hub.name == h["name"])  # noqa: E712
            )
            hub = result.scalar_one_or_none()
            if hub:
                hub.hub_type = h["hub_type"]
                hub.latitude = h["latitude"]
                hub.longitude = h["longitude"]
                hub.address = h["address"]
                hub.capacity_kg = h["capacity_kg"]
                await session.flush()
            else:
                hub = Hub(**h, demo=True)
                session.add(hub)
                await session.flush()
            hubs.append(hub)
        print(f"  ✓ {len(vehicles)} vehicles, {len(hubs)} hubs")

        # --- Historical orders (buyer history / insights / tracking) ---
        buyer = users_by_phone["+918888888888"]
        existing_orders = (
            await session.execute(select(Order.id).where(Order.buyer_id == buyer.id).limit(1))
        ).scalar_one_or_none()
        if existing_orders:
            print("\n  ✓ demo order history already present — skipping")
        else:
            print("\nCreating demo order history...")
            for hist in HISTORY:
                created = datetime.now(timezone.utc) - timedelta(days=hist["days_ago"])
                order = Order(
                    buyer_id=buyer.id,
                    status=hist["status"],
                    delivery_address=hist["delivery_address"],
                    delivery_latitude=BUYER_LAT,
                    delivery_longitude=BUYER_LNG,
                    delivery_deadline=created.replace(tzinfo=None) + timedelta(days=1),
                    created_at=created,
                    updated_at=created,
                )
                session.add(order)
                await session.flush()

                total = 0.0
                for item in hist["items"]:
                    seller = users_by_phone[item["seller_phone"]]
                    # Historical listing (inactive, consumed)
                    listing = ProduceListing(
                        seller_id=seller.id,
                        crop_name=item["crop"],
                        variety=item["variety"],
                        quantity_kg=0.0,
                        quality_grade=item.get("grade", "A"),
                        price_per_kg=item["price"],
                        harvest_date=created.date(),
                        pickup_location=item["loc"],
                        pickup_latitude=item["lat"],
                        pickup_longitude=item["lng"],
                        availability_start=created.replace(tzinfo=None) - timedelta(days=1),
                        availability_end=created.replace(tzinfo=None) + timedelta(days=2),
                        is_active=False,
                    )
                    session.add(listing)
                    await session.flush()

                    order_item = OrderItem(
                        order_id=order.id,
                        listing_id=listing.id,
                        quantity_kg=item["qty"],
                        price_per_kg=item["price"],
                    )
                    session.add(order_item)
                    total += item["qty"] * item["price"]

                    allocation = Allocation(
                        order_id=order.id,
                        listing_id=listing.id,
                        quantity_kg=item["qty"],
                        score=round(0.72 + (item["qty"] / 1000), 3),
                    )
                    session.add(allocation)

                order.total_amount = round(total, 2)

                # Shipment + route + stops + events
                ship = hist["shipment"]
                vehicle = vehicles[0]
                route = Route(
                    vehicle_id=vehicle.id,
                    distance_km=ship["distance_km"],
                    duration_minutes=int(ship["duration_min"]),
                    status=RouteStatus.COMPLETED if ship["status"] == "delivered" else RouteStatus.ACTIVE,
                    route_mode=ship["route_mode"],
                    created_at=created,
                    updated_at=created,
                )
                session.add(route)
                await session.flush()

                shipment = Shipment(
                    order_id=order.id,
                    route_id=route.id,
                    vehicle_id=vehicle.id,
                    logistics_provider_id=None,
                    status=ship["status"],
                    route_mode=ship["route_mode"],
                    estimated_distance_km=ship["distance_km"],
                    estimated_duration_min=ship["duration_min"],
                    landed_cost=ship["landed_cost"],
                    consolidation_savings_km=ship["savings_km"],
                    pickup_latitude=hist["items"][0]["lat"],
                    pickup_longitude=hist["items"][0]["lng"],
                    drop_latitude=BUYER_LAT,
                    drop_longitude=BUYER_LNG,
                    delivery_time=created + timedelta(hours=6) if ship["status"] == "delivered" else None,
                    created_at=created,
                    updated_at=created,
                )
                session.add(shipment)
                await session.flush()

                # Route stops: pickups then drop
                for seq, item in enumerate(hist["items"]):
                    stop = RouteStop(
                        route_id=route.id,
                        stop_type=StopType.PICKUP,
                        farmer_id=users_by_phone[item["seller_phone"]].id,
                        latitude=item["lat"],
                        longitude=item["lng"],
                        quantity_kg=item["qty"],
                        sequence=seq + 1,
                        eta=created + timedelta(hours=1 + seq),
                        created_at=created,
                    )
                    session.add(stop)
                drop_stop = RouteStop(
                    route_id=route.id,
                    stop_type=StopType.DROP,
                    buyer_id=buyer.id,
                    latitude=BUYER_LAT,
                    longitude=BUYER_LNG,
                    quantity_kg=sum(i["qty"] for i in hist["items"]),
                    sequence=len(hist["items"]) + 1,
                    eta=created + timedelta(hours=6),
                    created_at=created,
                )
                session.add(drop_stop)

                # Logistics events with timestamps spread over the journey
                event_times = {
                    "PLANNED": created + timedelta(minutes=10),
                    "TRUCK_ASSIGNED": created + timedelta(minutes=45),
                    "PICKUP_STARTED": created + timedelta(hours=1, minutes=30),
                    "PICKUP_DONE": created + timedelta(hours=2, minutes=45),
                    "IN_TRANSIT": created + timedelta(hours=3, minutes=30),
                    "DELIVERED": created + timedelta(hours=6),
                }
                for ev_type in hist["events"]:
                    ev = LogisticsEvent(
                        shipment_id=shipment.id,
                        event_type=LogisticsEventType(ev_type),
                        latitude=BUYER_LAT if ev_type in ("IN_TRANSIT", "DELIVERED") else hist["items"][0]["lat"],
                        longitude=BUYER_LNG if ev_type in ("IN_TRANSIT", "DELIVERED") else hist["items"][0]["lng"],
                        notes={
                            "PLANNED": "Route planned",
                            "TRUCK_ASSIGNED": "Truck assigned",
                            "PICKUP_STARTED": "Pickup started",
                            "PICKUP_DONE": "Pickup completed",
                            "IN_TRANSIT": "In transit to Mumbai",
                            "DELIVERED": "Delivered to buyer",
                        }[ev_type],
                        timestamp=event_times[ev_type],
                    )
                    session.add(ev)

                # Notifications for this order
                for notif in hist["notifications"]:
                    notification = Notification(
                        user_id=buyer.id,
                        title=notif["title"],
                        body=notif["body"],
                        category=notif["category"],
                        link=f"/buyer/orders/{order.id}",
                        is_read=notif["is_read"],
                        created_at=created + timedelta(hours=7),
                    )
                    session.add(notification)

                print(f"  ✓ order {hist['status'].value} ({sum(i['qty'] for i in hist['items'])}kg, Rs{total:,.2f})")

        await session.commit()

    print("\n✓ Demo data seeded successfully!")
    print("\nDemo Scenario:")
    print("  Farmer: Rahul Patil (Nashik) — Tomato Cherry 500 kg @ Rs45/kg Grade A")
    print("  Supporting: Priya Shinde (Pune 300 kg @ Rs30), Sunil Jadhav (Satara 300 kg @ Rs31)")
    print("  Buyer: FreshMart Mumbai needs 1000 kg tomatoes")
    print("  Expected: AI match ~92%, refrigerated truck, Nashik → Mumbai (~165 km, ~2.5 hrs)")
    print("\nLogin credentials (password: demo1234):")
    for phone, user in users_by_phone.items():
        print(f"  {phone}  ({user.full_name}, {user.role.value})")


def main():
    parser = argparse.ArgumentParser(description="Seed demo data for KisanSetu")
    parser.add_argument("--reset", action="store_true", help="Reset demo data (demo records only) then reseed")
    args = parser.parse_args()

    import asyncio
    asyncio.run(seed_demo_data(args.reset))


if __name__ == "__main__":
    main()