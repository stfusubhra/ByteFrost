#!/usr/bin/env python3
"""
Seed script to create demo data for hackathon.
Run this script to populate the database with demo users and a listing.
"""

import asyncio
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.models.models import User, UserRole, ProduceListing, FPO

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
    print("Seeding demo data...")
    session = await get_async_session()

    # Check if demo users already exist
    farmer_phone = "+919999999999"
    buyer_phone = "+918888888888"

    # Farmer
    result = await session.execute(select(User).where(User.phone == farmer_phone))
    farmer = result.scalar_one_or_none()
    if not farmer:
        print("Creating demo farmer...")
        farmer = User(
            id=uuid4(),
            email="farmer.demo@example.com",
            phone=farmer_phone,
            full_name="Demo Farmer",
            hashed_password=hash_password("demo1234"),
            role=UserRole.FARMER,
            is_active=True,
            is_verified=True,
        )
        session.add(farmer)
        await session.flush()
    else:
        print("Demo farmer already exists.")

    # Buyer
    result = await session.execute(select(User).where(User.phone == buyer_phone))
    buyer = result.scalar_one_or_none()
    if not buyer:
        print("Creating demo buyer...")
        buyer = User(
            id=uuid4(),
            email="buyer.demo@example.com",
            phone=buyer_phone,
            full_name="Demo Buyer",
            hashed_password=hash_password("demo1234"),
            role=UserRole.BUYER_RETAILER,
            is_active=True,
            is_verified=True,
        )
        session.add(buyer)
        await session.flush()
    else:
        print("Demo buyer already exists.")

    # Optional: Create a demo FPO and link the farmer to it (if farmer doesn't have an FPO already)
    # For simplicity, we'll skip FPO for now.

    # Create a demo produce listing from the farmer
    result = await session.execute(
        select(ProduceListing).where(ProduceListing.seller_id == farmer.id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        print("Creating demo produce listing...")
        # Use naive datetimes for harvest_date, availability_start, availability_end
        # because the model defines them as DateTime (without timezone)
        now_naive = datetime.now()
        listing = ProduceListing(
            id=uuid4(),
            seller_id=farmer.id,
            crop_name="Tomato",
            variety="Cherry",
            quantity_kg=100.0,
            quality_grade="A",
            price_per_kg=50.0,
            harvest_date=now_naive,
            availability_start=now_naive,
            availability_end=now_naive + timedelta(days=7),
            pickup_location="Demo Farm, Nashik",
            pickup_latitude=20.0037,
            pickup_longitude=73.7896,
            description="Fresh, organic cherry tomatoes.",
            images=["https://example.com/tomato1.jpg", "https://example.com/tomato2.jpg"],
            is_active=True,
        )
        session.add(listing)
    else:
        print("Demo listing already exists for the farmer.")

    await session.commit()
    await session.close()
    print("Demo data seeding completed.")

if __name__ == "__main__":
    asyncio.run(seed_demo_data())
