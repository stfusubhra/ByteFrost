#!/usr/bin/env python3
"""
Enhanced seed script to create comprehensive demo data for hackathon.
Run this script to populate the database with demo users, listings, vehicles, 
hubs, orders, and shipments to demonstrate the full ByteFrost/KisanSetu flow.
"""

import asyncio
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.models.models import (
    User, UserRole, ProduceListing, FPO,
    Vehicle, VehicleType, VehicleStatus,
    Hub, HubType, HubStatus,
    Route, RouteStatus, RouteStop, StopType,
    Order, OrderStatus, OrderItem,
    Allocation, Shipment
)

# Use the same database URL as the app, but convert to asyncpg
DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

async def get_async_session() -> AsyncSession:
    engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        return session

async def seed_demo_data():
    print("Seeding comprehensive demo data for hackathon...")
    session = await get_async_session()

    # Check if demo users already exist
    farmer_phone = "+919999999999"
    buyer_phone = "+918888888888"
    logistics_phone = "+917777777777"

    # Create or get demo farmer (Nashik, Maharashtra)
    result = await session.execute(select(User).where(User.phone == farmer_phone))
    farmer = result.scalar_one_or_none()
    if not farmer:
        print("Creating demo farmer...")
        farmer = User(
            id=uuid4(),
            email="farmer.demo@example.com",
            phone=farmer_phone,
            full_name="Ramesh Patel - Demo Farmer",
            hashed_password=hash_password("demo1234"),
            role=UserRole.FARMER,
            is_active=True,
            is_verified=True,
            address="Village Vinchur, Nashik, Maharashtra 422210",
            latitude=20.0037,
            longitude=73.7896,
            avatar_url="https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?w=150&h=150&fit=crop&facearea=face"
        )
        session.add(farmer)
        await session.flush()
    else:
        print("Demo farmer already exists.")

    # Create or get demo buyer (Mumbai, Maharashtra)
    result = await session.execute(select(User).where(User.phone == buyer_phone))
    buyer = result.scalar_one_or_none()
    if not buyer:
        print("Creating demo buyer...")
        buyer = User(
            id=uuid4(),
            email="buyer.demo@example.com",
            phone=buyer_phone,
            full_name="Priya Mehta - Retail Chain Buyer",
            hashed_password=hash_password("demo1234"),
            role=UserRole.BUYER_RETAILER,
            is_active=True,
            is_verified=True,
            address="APMC Market, Navi Mumbai, Maharashtra 400705",
            latitude=19.0330,
            longitude=73.0297,
            avatar_url="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&facearea=face"
        )
        session.add(buyer)
        await session.flush()
    else:
        print("Demo buyer already exists.")

    # Create or get demo logistics provider
    result = await session.execute(select(User).where(User.phone == logistics_phone))
    logistics_user = result.scalar_one_or_none()
    if not logistics_user:
        print("Creating demo logistics provider...")
        logistics_user = User(
            id=uuid4(),
            email="logistics.demo@example.com",
            phone=logistics_phone,
            full_name="Suresh Kumar - Logistics Partner",
            hashed_password=hash_password("demo1234"),
            role=UserRole.LOGISTICS,
            is_active=True,
            is_verified=True,
            address="Logistics Hub, Pune, Maharashtra 411001",
            latitude=18.5204,
            longitude=73.8567,
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&facearea=face"
        )
        session.add(logistics_user)
        await session.flush()
    else:
        print("Demo logistics user already exists.")

    # Create demo FPO and link farmer to it
    fpo = FPO(
        id=uuid4(),
        name="Nashik Agro Producer Company Ltd",
        registration_number="FPO/MH/NASHIK/001/2024",
        address="APMC Yard, Nashik Road, Nashik, Maharashtra 422101",
        latitude=20.0037,
        longitude=73.7896,
        contact_user_id=farmer.id
    )
    session.add(fpo)
    await session.flush()

    # Link farmer to FPO
    farmer.fpo_id = fpo.id
    await session.flush()

    # Create demo vehicles
    vehicles_data = [
        {
            "capacity_kg": 1000.0,
            "vehicle_type": VehicleType.REFRIGERATED,
            "latitude": 19.0330,
            "longitude": 73.0297,
            "status": VehicleStatus.AVAILABLE,
            "current_load_kg": 0.0,
            "operating_cost_per_km": 25.0,
            "description": "Refrigerated truck for perishable goods"
        },
        {
            "capacity_kg": 1500.0,
            "vehicle_type": VehicleType.STANDARD,
            "latitude": 20.0037,
            "longitude": 73.7896,
            "status": VehicleStatus.AVAILABLE,
            "current_load_kg": 0.0,
            "operating_cost_per_km": 20.0,
            "description": "Standard dry goods truck"
        }
    ]

    vehicles = []
    for i, vdata in enumerate(vehicles_data):
        # Check if vehicle already exists (simple check by capacity and type)
        result = await session.execute(
            select(Vehicle).where(
                Vehicle.capacity_kg == vdata["capacity_kg"],
                Vehicle.vehicle_type == vdata["vehicle_type"]
            )
        )
        existing_vehicle = result.scalar_one_or_none()
        
        if not existing_vehicle:
            print(f"Creating demo vehicle {i+1}...")
            vehicle = Vehicle(
                id=uuid4(),
                **{k: v for k, v in vdata.items() if k != "description"}
            )
            session.add(vehicle)
            vehicles.append(vehicle)
        else:
            print(f"Demo vehicle {i+1} already exists.")
            vehicles.append(existing_vehicle)
    
    await session.flush()

    # Create demo hubs
    hubs_data = [
        {
            "name": "Nashik Collection Hub",
            "hub_type": HubType.LOCAL,
            "latitude": 20.0037,
            "longitude": 73.7896,
            "address": "APMC Yard, Nashik Road, Nashik, Maharashtra 422101",
            "capacity_kg": 5000.0,
            "current_load_kg": 0.0,
            "status": HubStatus.ACTIVE
        },
        {
            "name": "Mumbai Distribution Hub",
            "hub_type": HubType.REGIONAL,
            "latitude": 19.0330,
            "longitude": 73.0297,
            "address": "APMC Market, Navi Mumbai, Maharashtra 400705",
            "capacity_kg": 10000.0,
            "current_load_kg": 0.0,
            "status": HubStatus.ACTIVE
        }
    ]

    hubs = []
    for i, hdata in enumerate(hubs_data):
        # Check if hub already exists
        result = await session.execute(
            select(Hub).where(
                Hub.name == hdata["name"]
            )
        )
        existing_hub = result.scalar_one_or_none()
        
        if not existing_hub:
            print(f"Creating demo hub {i+1}...")
            hub = Hub(**hdata)
            session.add(hub)
            hubs.append(hub)
        else:
            print(f"Demo hub {i+1} already exists.")
            hubs.append(existing_hub)
    
    await session.flush()

    # Create comprehensive demo produce listings
    listings_data = [
        {
            "seller_id": farmer.id,
            "fpo_id": fpo.id,
            "crop_name": "Tomato",
            "variety": "Cherry",
            "quantity_kg": 500.0,  # As requested: 500kg tomato listing
            "quality_grade": "A",
            "price_per_kg": 45.0,
            "harvest_date": datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=1),
            "availability_start": datetime.now(timezone.utc).replace(tzinfo=None),
            "availability_end": datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=5),
            "pickup_location": "Village Vinchur Farm Gate, Nashik",
            "pickup_latitude": 20.0037,
            "pickup_longitude": 73.7896,
            "description": "Premium grade cherry tomatoes, freshly harvested, organic farming, uniform size and color, ideal for retail and processing",
            "images": [
                "https://images.unsplash.com/photo-1592910283175-6dd05ac471ec?w=800&h=600&fit=crop",
                "https://images.unsplash.com/photo-1546473389-8977b6a9a67d?w=800&h=600&fit=crop"
            ],
            "is_active": True
        },
        {
            "seller_id": farmer.id,
            "fpo_id": fpo.id,
            "crop_name": "Onion",
            "variety": "Red",
            "quantity_kg": 300.0,
            "quality_grade": "A",
            "price_per_kg": 25.0,
            "harvest_date": datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=2),
            "availability_start": datetime.now(timezone.utc).replace(tzinfo=None),
            "availability_end": datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=10),
            "pickup_location": "Village Vinchur Farm Gate, Nashik",
            "pickup_latitude": 20.0037,
            "pickup_longitude": 73.7896,
            "description": "Fresh red onions, firm texture, long shelf life, ideal for wholesale and retail markets",
            "images": [
                "https://images.unsplash.com/photo-1519092728839-1a4704c77cd1?w=800&h=600&fit=crop",
                "https://images.unsplash.com/photo-1576107183414-04f3b659efa5?w=800&h=600&fit=crop"
            ],
            "is_active": True
        },
        {
            "seller_id": farmer.id,
            "fpo_id": fpo.id,
            "crop_name": "Potato",
            "variety": "White",
            "quantity_kg": 400.0,
            "quality_grade": "B",
            "price_per_kg": 18.0,
            "harvest_date": datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=3),
            "availability_start": datetime.now(timezone.utc).replace(tzinfo=None),
            "availability_end": datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=15),
            "pickup_location": "Village Vinchur Farm Gate, Nashik",
            "pickup_latitude": 20.0037,
            "pickup_longitude": 73.7896,
            "description": "Medium-sized white potatoes, good for chips and table use, cured for storage",
            "images": [
                "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&h=600&fit=crop",
                "https://images.unsplash.com/photo-1523051102071-dac4d834e5a5?w=800&h=600&fit=crop"
            ],
            "is_active": True
        }
    ]

    listings = []
    for i, ldata in enumerate(listings_data):
        # Check if listing already exists for this farmer and crop
        result = await session.execute(
            select(ProduceListing).where(
                ProduceListing.seller_id == farmer.id,
                ProduceListing.crop_name == ldata["crop_name"],
                ProduceListing.variety == ldata["variety"]
            )
        )
        existing_listing = result.scalar_one_or_none()
        
        if not existing_listing:
            print(f"Creating demo listing {i+1}: {ldata['crop_name']} {ldata['variety']} ({ldata['quantity_kg']}kg)...")
            listing = ProduceListing(
                id=uuid4(),
                **{k: v for k, v in ldata.items() if k not in ["description", "images"]},
                description=ldata["description"],
                images=ldata["images"]
            )
            session.add(listing)
            listings.append(listing)
        else:
            print(f"Demo listing {i+1} already exists.")
            listings.append(existing_listing)
    
    await session.flush()

    # Create demo order from buyer to farmer (for the 500kg tomato)
    print("Creating demo order...")
    order = Order(
        id=uuid4(),
        buyer_id=buyer.id,
        status=OrderStatus.PENDING,
        total_amount=500.0 * 45.0,  # 500kg * ₹45/kg
        delivery_address="APMC Market, Navi Mumbai, Maharashtra 400705",
        delivery_latitude=19.0330,
        delivery_longitude=73.0297,
        delivery_deadline=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=2),
        notes="Fresh cherry tomatoes for retail chain - urgent requirement"
    )
    session.add(order)
    await session.flush()

    # Create order item
    order_item = OrderItem(
        id=uuid4(),
        order_id=order.id,
        listing_id=listings[0].id,  # Tomato listing
        quantity_kg=500.0,
        price_per_kg=45.0
    )
    session.add(order_item)
    await session.flush()

    # Update order total (though it's already set)
    order.total_amount = order_item.quantity_kg * order_item.price_per_kg
    await session.flush()

    # Create allocation (matching buyer to seller listing)
    print("Creating demo allocation...")
    allocation = Allocation(
        id=uuid4(),
        order_id=order.id,
        listing_id=listings[0].id,
        quantity_kg=500.0,
        score=0.92,  # High match score
        explanation={
            "quantity_fit": 0.95,
            "price_attractiveness": 0.88,
            "haversine_proximity": 0.90,
            "buyer_reliability": 0.95
        }
    )
    session.add(allocation)
    await session.flush()

    # Create shipment for the allocation
    print("Creating demo shipment...")
    shipment = Shipment(
        id=uuid4(),
        allocation_id=allocation.id,
        order_id=order.id,
        vehicle_id=vehicles[0].id,  # Refrigerated truck
        route_id=None,  # Will be set after route creation
        logistics_provider_id=logistics_user.id,
        status="pending",
        route_mode="direct",
        estimated_distance_km=165.0,  # Nashik to Mumbai approx
        estimated_duration_min=150.0,  # 2.5 hours
        landed_cost=2250.0,  # Produce cost + transport
        consolidation_savings_km=0.0,
        pickup_time=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=2),
        delivery_time=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=4),
        pickup_latitude=20.0037,
        pickup_longitude=73.7896,
        drop_latitude=19.0330,
        drop_longitude=73.0297
    )
    session.add(shipment)
    await session.flush()

    # Update shipment with route info (simplified - in reality route would be created separately)
    route = Route(
        id=uuid4(),
        vehicle_id=vehicles[0].id,
        distance_km=165.0,
        duration_minutes=150,
        status=RouteStatus.PLANNED,
        route_mode="direct"
    )
    session.add(route)
    await session.flush()

    # Link route to shipment
    shipment.route_id = route.id
    await session.flush()

    # Create route stops
    stops_data = [
        {
            "route_id": route.id,
            "stop_type": StopType.PICKUP,
            "farmer_id": farmer.id,
            "hub_id": None,
            "buyer_id": None,
            "latitude": 20.0037,
            "longitude": 73.7896,
            "quantity_kg": 500.0,
            "sequence": 1,
            "time_window_earliest": datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=2),
            "time_window_latest": datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=3),
            "max_transit_hours": 4.0,
            "eta": datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=2)
        },
        {
            "route_id": route.id,
            "stop_type": StopType.DROP,
            "farmer_id": None,
            "hub_id": None,
            "buyer_id": buyer.id,
            "latitude": 19.0330,
            "longitude": 73.0297,
            "quantity_kg": 500.0,
            "sequence": 2,
            "time_window_earliest": datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=3),
            "time_window_latest": datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=5),
            "max_transit_hours": 4.0,
            "eta": datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=4)
        }
    ]

    for stop_data in stops_data:
        stop = RouteStop(**stop_data)
        session.add(stop)
    
    await session.flush()

    # Update vehicle current load
    vehicles[0].current_load_kg = 500.0
    vehicles[0].status = VehicleStatus.ASSIGNED
    
    # Update hub loads (if applicable)
    hubs[0].current_load_kg += 500.0  # Nashik hub loading
    
    await session.commit()
    await session.close()

    print("\n✅ Demo data seeding completed successfully!")
    print("\n📋 Summary of created data:")
    print(f"  • Farmers: 1 (Ramesh Patel - Nashik)")
    print(f"  • Buyers: 1 (Priya Mehta - Mumbai)")
    print(f"  • Logistics Partners: 1 (Suresh Kumar - Pune)")
    print(f"  • FPOs: 1 (Nashik Agro Producer Company Ltd)")
    print(f"  • Vehicles: {len(vehicles)} (1 refrigerated, 1 standard)")
    print(f"  • Hubs: {len(hubs)} (1 local, 1 regional)")
    print(f"  • Produce Listings: {len(listings)}")
    print(f"    - Tomato Cherry: 500kg @ ₹45/kg (Grade A)")
    print(f"    - Onion Red: 300kg @ ₹25/kg (Grade A)")
    print(f"    - Potato White: 400kg @ ₹18/kg (Grade B)")
    print(f"  • Orders: 1 (500kg tomatoes → ₹22,500)")
    print(f"  • Allocations: 1 (92% match score)")
    print(f"  • Shipments: 1 (Nashik → Mumbai via refrigerated truck)")
    print(f"  • Route: 1 planned (165km, 2.5hrs)")
    print("\n🔐 Demo Login Credentials:")
    print(f"  Farmer: {farmer_phone} / demo1234")
    print(f"  Buyer: {buyer_phone} / demo1234")
    print(f"  Logistics: {logistics_phone} / demo1234")
    print("\n🌐 Access the platform:")
    print(f"  Frontend: https://kisansetu-bay.vercel.app")
    print(f"  Backend: https://bytefrost-backend.onrender.com/api/v1/")

if __name__ == "__main__":
    asyncio.run(seed_demo_data())