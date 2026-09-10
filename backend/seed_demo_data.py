"""
ByteFrost — Demo Dataset for Judge Scenario

Creates a deterministic demo dataset that allows judges to reproduce
the end-to-end marketplace intelligence workflow.

Demo Scenario:
  - 3 farmers with tomato listings (400kg Nashik, 300kg Pune, 300kg Satara)
  - 1 buyer needing 1000kg tomatoes in Pune by Friday
  - Expected: System identifies 1000kg available, proposes fulfillment plan

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

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.core.database import Base
from app.models.models import User, ProduceListing, UserRole, OrderStatus


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
        "is_verified": True,
    },
    {
        "email": "priya.farmer@kisansetu.demo",
        "password": "demo123",
        "full_name": "Priya Shinde",
        "role": UserRole.FARMER,
        "phone": "+919876543211",
        "latitude": 18.5204,
        "longitude": 73.8567,
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
        "is_verified": True,
    },
]

# Demo listings
DEMO_LISTINGS = [
    {
        "seller_id": None,  # Will be set after user creation
        "crop_name": "Tomato",
        "variety": "Hybrid",
        "quantity_kg": 400.0,
        "quality_grade": "A",
        "price_per_kg": 32.0,
        "harvest_date": datetime.now().date(),
        "pickup_location": "Nashik Road, Maharashtra",
        "pickup_latitude": 19.9975,
        "pickup_longitude": 73.7900,
        "availability_start": datetime.now(),
        "availability_end": datetime.now() + timedelta(days=3),
        "is_active": True,
    },
    {
        "seller_id": None,
        "crop_name": "Tomato",
        "variety": "Local",
        "quantity_kg": 300.0,
        "quality_grade": "A",
        "price_per_kg": 33.0,
        "harvest_date": datetime.now().date(),
        "pickup_location": "Pune Rural, Maharashtra",
        "pickup_latitude": 18.5204,
        "pickup_longitude": 73.8567,
        "availability_start": datetime.now(),
        "availability_end": datetime.now() + timedelta(days=2),
        "is_active": True,
    },
    {
        "seller_id": None,
        "crop_name": "Tomato",
        "variety": "Desi",
        "quantity_kg": 300.0,
        "quality_grade": "B",
        "price_per_kg": 30.0,
        "harvest_date": datetime.now().date(),
        "pickup_location": "Satara Town, Maharashtra",
        "pickup_latitude": 17.6805,
        "pickup_longitude": 74.0183,
        "availability_start": datetime.now(),
        "availability_end": datetime.now() + timedelta(days=4),
        "is_active": True,
    },
]


async def seed_demo_data(reset: bool = False):
    """Create or reset demo dataset."""
    from app.core.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as session:
        if reset:
            # Clear existing demo data
            print("Resetting demo data...")
            # Note: In production, you'd want more selective deletion
            # For now, we'll just note that reset would clear tables
            print("  (Full reset would clear Users and Listings tables)")
        
        try:
            # Create demo users
            print("\nCreating demo users...")
            users = {}
            for user_data in DEMO_USERS:
                # Check if user exists
                result = await session.execute(
                    select(User).where(User.email == user_data["email"])
                )
                existing = result.scalar_one_or_none()
                
                if existing:
                    print(f"  ✓ {user_data['email']} (existing)")
                    users[user_data["email"]] = existing
                else:
                    # Create new user
                    from app.core.security import hash_password
                    user_data["hashed_password"] = hash_password(user_data["password"])
                    del user_data["password"]
                    
                    user = User(**user_data)
                    session.add(user)
                    await session.flush()
                    users[user_data["email"]] = user
                    print(f"  ✓ {user_data['email']} created")
            
            # Create demo listings
            print("\nCreating demo listings...")
            for i, listing_data in enumerate(DEMO_LISTINGS):
                listing_data["seller_id"] = list(users.values())[i].id
                
                # Check if listing exists
                result = await session.execute(
                    select(ProduceListing).where(
                        ProduceListing.seller_id == listing_data["seller_id"],
                        ProduceListing.crop_name == listing_data["crop_name"],
                        ProduceListing.is_active == True,
                    )
                )
                existing = result.scalar_one_or_none()
                
                if existing:
                    print(f"  ✓ {listing_data['crop_name']} {listing_data['quantity_kg']}kg at {listing_data['pickup_location']} (existing)")
                else:
                    listing = ProduceListing(**listing_data)
                    session.add(listing)
                    await session.flush()
                    print(f"  ✓ {listing_data['crop_name']} {listing_data['quantity_kg']}kg at {listing_data['pickup_location']} created")
            
            await session.commit()
        except Exception as e:
            await session.rollback()
            raise e
    
    print("\n✓ Demo data seeded successfully!")
    print("\nDemo Scenario:")
    print("  Farmers: Rahul (Nashik 400kg), Priya (Pune 300kg), Sunil (Satara 300kg)")
    print("  Buyer: FreshMart Pune needs 1000kg tomatoes")
    print("  Expected: System identifies 1000kg available from 3 farms")
    print("\nLogin credentials:")
    for email, user in users.items():
        print(f"  {email} / demo123 ({user.role.value})")


def main():
    parser = argparse.ArgumentParser(description="Seed demo data for KisanSetu")
    parser.add_argument("--reset", action="store_true", help="Reset existing demo data")
    args = parser.parse_args()
    
    import asyncio
    asyncio.run(seed_demo_data(args.reset))


if __name__ == "__main__":
    main()
