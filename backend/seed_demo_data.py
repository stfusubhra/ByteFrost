"""
ByteFrost — Demo Dataset for Judge Scenario

Creates a deterministic demo dataset that allows judges to reproduce
the end-to-end marketplace intelligence workflow.

Demo Scenario:
  - 3 farmers with tomato listings (400kg Nashik @ Rs31, 300kg Pune @ Rs30,
    300kg Satara @ Rs31)
  - 1 buyer (FreshMart Pune) needing 1000kg tomatoes by Friday
  - Expected: System identifies 1000kg available, proposes fulfillment plan
  - Buyer also has seeded order history (2 delivered + 1 in-transit) so the
    history / insights / tracking pages are populated for the demo.

Usage:
    python seed_demo_data.py [--reset]
"""

import argparse
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select, text

from app.models.models import (
    Allocation,
    Hub,
    HubStatus,
    HubType,
    LogisticsEvent,
    LogisticsEventType,
    Notification,
    Order,
    OrderItem,
    OrderStatus,
    ProduceListing,
    Route,
    RouteStatus,
    RouteStop,
    Shipment,
    StopType,
    User,
    UserRole,
    Vehicle,
    VehicleStatus,
    VehicleType,
)

# Demo users
DEMO_USERS = [
    {
        "email": "rahul.farmer@kisansetu.demo",
        "password": "demo123",
        "full_name": "Rahul Patil",
        "role": UserRole.FARMER,
        "phone": "+919876543210",
        "latitude": 19.9975,
        "longitude": 73.7900,
        "address": "Nashik Road, Maharashtra",
        "is_verified": True,
    },
    {
        "email": "priya.farmer@kisansetu.demo",
        "password": "demo123",
        "full_name": "Priya Shinde",
        "role": UserRole.FARMER,
        "phone": "+919876543211",
        "latitude": 18.7500,
        "longitude": 73.8500,
        "address": "Pune Rural, Maharashtra",
        "is_verified": True,
    },
    {
        "email": "sunil.farmer@kisansetu.demo",
        "password": "demo123",
        "full_name": "Sunil Jadhav",
        "role": UserRole.FARMER,
        "phone": "+919876543212",
        "latitude": 17.6805,
        "longitude": 74.0183,
        "address": "Satara Town, Maharashtra",
        "is_verified": True,
    },
    {
        "email": "freshmart@kisansetu.demo",
        "password": "demo123",
        "full_name": "FreshMart Pune",
        "role": UserRole.BUYER_BULK,
        "phone": "+919876543220",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "address": "FC Road, Pune, Maharashtra",
        "is_verified": True,
        "profile": {
            "business_name": "FreshMart Retail",
            "business_type": "retail_chain",
            "delivery_city": "Pune",
            "preferred_crops": ["Tomato", "Onion", "Potato"],
            "monthly_volume_kg": 5000.0,
            "onboarding_completed": True,
        },
    },
]

# Demo listings — the LIVE supply for the 1000kg demo scenario (spec prices)
DEMO_LISTINGS = [
    {
        "seller_email": "rahul.farmer@kisansetu.demo",
        "crop_name": "Tomato",
        "variety": "Hybrid",
        "quantity_kg": 400.0,
        "quality_grade": "A",
        "price_per_kg": 31.0,
        "pickup_location": "Nashik Road, Maharashtra",
        "pickup_latitude": 19.9975,
        "pickup_longitude": 73.7900,
        "availability_days": 3,
    },
    {
        "seller_email": "priya.farmer@kisansetu.demo",
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
        "seller_email": "sunil.farmer@kisansetu.demo",
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

# Historical orders for the buyer (populate history / insights / tracking)
# Each references its own (now inactive) listings so the live 1000kg supply
# stays pristine for the demo scenario.
HISTORY = [
    {
        "days_ago": 14,
        "status": OrderStatus.DELIVERED,
        "delivery_address": "FC Road, Pune, Maharashtra",
        "items": [
            {"seller_email": "rahul.farmer@kisansetu.demo", "crop": "Tomato", "variety": "Hybrid",
             "qty": 300.0, "price": 30.0, "loc": "Nashik Road, Maharashtra", "lat": 19.9975, "lng": 73.7900},
            {"seller_email": "priya.farmer@kisansetu.demo", "crop": "Tomato", "variety": "Local",
             "qty": 200.0, "price": 31.0, "loc": "Pune Rural, Maharashtra", "lat": 18.7500, "lng": 73.8500},
        ],
        "shipment": {
            "status": "delivered",
            "route_mode": "direct",
            "distance_km": 42.0,
            "duration_min": 78.0,
            "landed_cost": 16780.0,
            "savings_km": 0.0,
        },
        "events": ["PLANNED", "TRUCK_ASSIGNED", "PICKUP_STARTED", "PICKUP_DONE", "IN_TRANSIT", "DELIVERED"],
        "notifications": [
            {"title": "Order delivered", "body": "Your order of 500 kg Tomato was delivered to FC Road, Pune.",
             "category": "order", "link": None, "is_read": True},
        ],
    },
    {
        "days_ago": 7,
        "status": OrderStatus.DELIVERED,
        "delivery_address": "FC Road, Pune, Maharashtra",
        "items": [
            {"seller_email": "priya.farmer@kisansetu.demo", "crop": "Tomato", "variety": "Local",
             "qty": 250.0, "price": 29.0, "loc": "Pune Rural, Maharashtra", "lat": 18.7500, "lng": 73.8500},
            {"seller_email": "sunil.farmer@kisansetu.demo", "crop": "Tomato", "variety": "Desi",
             "qty": 150.0, "price": 30.0, "loc": "Satara Town, Maharashtra", "lat": 17.6805, "lng": 74.0183},
        ],
        "shipment": {
            "status": "delivered",
            "route_mode": "direct",
            "distance_km": 118.0,
            "duration_min": 165.0,
            "landed_cost": 13890.0,
            "savings_km": 0.0,
        },
        "events": ["PLANNED", "TRUCK_ASSIGNED", "PICKUP_STARTED", "PICKUP_DONE", "IN_TRANSIT", "DELIVERED"],
        "notifications": [
            {"title": "Order delivered", "body": "Your order of 400 kg Tomato was delivered to FC Road, Pune.",
             "category": "order", "link": None, "is_read": True},
        ],
    },
    {
        "days_ago": 2,
        "status": OrderStatus.IN_TRANSIT,
        "delivery_address": "FC Road, Pune, Maharashtra",
        "items": [
            {"seller_email": "rahul.farmer@kisansetu.demo", "crop": "Tomato", "variety": "Hybrid",
             "qty": 300.0, "price": 31.0, "loc": "Nashik Road, Maharashtra", "lat": 19.9975, "lng": 73.7900},
            {"seller_email": "priya.farmer@kisansetu.demo", "crop": "Tomato", "variety": "Local",
             "qty": 200.0, "price": 30.0, "loc": "Pune Rural, Maharashtra", "lat": 18.7500, "lng": 73.8500},
            {"seller_email": "sunil.farmer@kisansetu.demo", "crop": "Tomato", "variety": "Desi",
             "qty": 100.0, "price": 31.0, "loc": "Satara Town, Maharashtra", "lat": 17.6805, "lng": 74.0183},
        ],
        "shipment": {
            "status": "in_transit",
            "route_mode": "direct",
            "distance_km": 96.0,
            "duration_min": 140.0,
            "landed_cost": 21520.0,
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
    {"capacity_kg": 2000.0, "vehicle_type": VehicleType.STANDARD, "latitude": 18.5204,
     "longitude": 73.8567, "status": VehicleStatus.AVAILABLE, "operating_cost_per_km": 18.0},
    {"capacity_kg": 1500.0, "vehicle_type": VehicleType.REFRIGERATED, "latitude": 19.9975,
     "longitude": 73.7900, "status": VehicleStatus.AVAILABLE, "operating_cost_per_km": 26.0},
]

DEMO_HUBS = [
    {"name": "Pune Central Hub", "hub_type": HubType.LOCAL, "latitude": 18.5204, "longitude": 73.8567,
     "address": "Pune, Maharashtra", "capacity_kg": 10000.0},
    {"name": "Nashik Agri Hub", "hub_type": HubType.REGIONAL, "latitude": 19.9975, "longitude": 73.7900,
     "address": "Nashik, Maharashtra", "capacity_kg": 20000.0},
]


async def _reset(session):
    """Delete all rows in FK-safe order."""
    tables = [
        "notifications",
        "shipment_temperature_logs",
        "logistics_events",
        "route_stops",
        "shipments",
        "routes",
        "allocations",
        "order_items",
        "orders",
        "hub_inventory",
        "produce_listings",
        "payments",
        "farmer_reliability_scores",
        "vehicles",
        "hubs",
        "fpos",
        "users",
    ]
    for table in tables:
        await session.execute(text(f"DELETE FROM {table}"))
    print("  ✓ cleared all tables")


async def seed_demo_data(reset: bool = False):
    """Create or reset demo dataset."""
    from app.core.database import AsyncSessionLocal
    from app.core.security import hash_password

    async with AsyncSessionLocal() as session:
        if reset:
            print("Resetting demo data...")
            await _reset(session)
            await session.commit()

        # --- Users ---
        print("\nCreating demo users...")
        users = {}
        for user_data in DEMO_USERS:
            result = await session.execute(select(User).where(User.email == user_data["email"]))
            existing = result.scalar_one_or_none()
            if existing:
                print(f"  ✓ {user_data['email']} (existing)")
                users[user_data["email"]] = existing
                continue
            data = dict(user_data)
            data["hashed_password"] = hash_password(data.pop("password"))
            user = User(**data)
            session.add(user)
            await session.flush()
            users[user_data["email"]] = user
            print(f"  ✓ {user_data['email']} created")

        # --- Listings (live demo supply) ---
        print("\nCreating demo listings...")
        listings = {}
        for listing_data in DEMO_LISTINGS:
            seller = users[listing_data["seller_email"]]
            result = await session.execute(
                select(ProduceListing).where(
                    ProduceListing.seller_id == seller.id,
                    ProduceListing.crop_name == listing_data["crop_name"],
                    ProduceListing.is_active == True,  # noqa: E712
                )
            )
            existing = result.scalar_one_or_none()
            if existing:
                print(f"  ✓ {listing_data['crop_name']} {listing_data['quantity_kg']}kg at {listing_data['pickup_location']} (existing)")
                listings[listing_data["seller_email"]] = existing
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
            listings[listing_data["seller_email"]] = listing
            print(f"  ✓ {listing_data['crop_name']} {listing_data['quantity_kg']}kg at {listing_data['pickup_location']} created")

        # --- Vehicles & hubs ---
        print("\nCreating vehicles & hubs...")
        vehicles = []
        for v in DEMO_VEHICLES:
            vehicle = Vehicle(**v)
            session.add(vehicle)
            await session.flush()
            vehicles.append(vehicle)
        hubs = []
        for h in DEMO_HUBS:
            hub = Hub(**h)
            session.add(hub)
            await session.flush()
            hubs.append(hub)
        print(f"  ✓ {len(vehicles)} vehicles, {len(hubs)} hubs")

        # --- Historical orders (buyer history / insights / tracking) ---
        print("\nCreating demo order history...")
        buyer = users["freshmart@kisansetu.demo"]
        for hist in HISTORY:
            created = datetime.now(timezone.utc) - timedelta(days=hist["days_ago"])
            order = Order(
                buyer_id=buyer.id,
                status=hist["status"],
                delivery_address=hist["delivery_address"],
                delivery_latitude=18.5204,
                delivery_longitude=73.8567,
                delivery_deadline=created.replace(tzinfo=None) + timedelta(days=1),
                created_at=created,
                updated_at=created,
            )
            session.add(order)
            await session.flush()

            total = 0.0
            for item in hist["items"]:
                seller = users[item["seller_email"]]
                # Historical listing (inactive, consumed)
                listing = ProduceListing(
                    seller_id=seller.id,
                    crop_name=item["crop"],
                    variety=item["variety"],
                    quantity_kg=0.0,
                    quality_grade="A",
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
                drop_latitude=18.5204,
                drop_longitude=73.8567,
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
                    farmer_id=users[item["seller_email"]].id,
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
                latitude=18.5204,
                longitude=73.8567,
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
                    latitude=18.5204 if ev_type in ("IN_TRANSIT", "DELIVERED") else hist["items"][0]["lat"],
                    longitude=73.8567 if ev_type in ("IN_TRANSIT", "DELIVERED") else hist["items"][0]["lng"],
                    notes={
                        "PLANNED": "Route planned",
                        "TRUCK_ASSIGNED": "Truck assigned",
                        "PICKUP_STARTED": "Pickup started",
                        "PICKUP_DONE": "Pickup completed",
                        "IN_TRANSIT": "In transit to Pune",
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
    print("  Farmers: Rahul (Nashik 400kg @ Rs31), Priya (Pune 300kg @ Rs30), Sunil (Satara 300kg @ Rs31)")
    print("  Buyer: FreshMart Pune needs 1000kg tomatoes")
    print("  Expected: System identifies 1000kg available from 3 farms")
    print("\nLogin credentials (all password: demo123):")
    for email, user in users.items():
        print(f"  {email} ({user.role.value})")


def main():
    parser = argparse.ArgumentParser(description="Seed demo data for KisanSetu")
    parser.add_argument("--reset", action="store_true", help="Reset existing demo data")
    args = parser.parse_args()

    import asyncio
    asyncio.run(seed_demo_data(args.reset))


if __name__ == "__main__":
    main()