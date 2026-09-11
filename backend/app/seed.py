"""
Seed script for ByteFrost demo data.

Creates demo farmer and buyer accounts plus realistic listings, orders,
payments, and notifications so the dashboards look complete immediately
after login.

Usage:
    python -m app.seed
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.models import (
    User, UserRole, ProduceListing, Order, OrderItem, OrderStatus, Payment,
)

DEMO_FARMER_PHONE = "+919999999999"
DEMO_BUYER_PHONE = "+918888888888"
DEMO_PASSWORD = "demo1234"

# Product image placeholders (emoji-based, rendered client-side)
PRODUCT_IMAGES = {
    "Rice": "🌾",
    "Wheat": "🌾",
    "Potatoes": "🥔",
    "Tomatoes": "🍅",
    "Mustard": "🌱",
    "Onions": "🧅",
    "Carrots": "🥕",
    "Spinach": "🥬",
    "Mangoes": "🥭",
    "Bananas": "🍌",
    "Apples": "🍎",
    "Oranges": "🍊",
    "Cauliflower": "🥦",
    "Cabbage": "🥬",
    "Chillies": "🌶️",
    "Corn": "🌽",
    "Grapes": "🍇",
    "Pomegranate": "🍎",
    "Turmeric": "🌱",
    "Soybean": "🫘",
}


async def seed():
    async with AsyncSessionLocal() as db:
        # --- Demo Farmer ---
        farmer = (await db.execute(
            select(User).where(User.phone == DEMO_FARMER_PHONE)
        )).scalar_one_or_none()
        if not farmer:
            farmer = User(
                email="phone_919999999999@bytefrost.local",
                phone=DEMO_FARMER_PHONE,
                full_name="Ramesh Kumar",
                hashed_password=hash_password(DEMO_PASSWORD),
                role=UserRole.FARMER,
                is_verified=True,
                address="Village Nandgaon, Nashik, Maharashtra",
                latitude=19.9975,
                longitude=73.7898,
            )
            db.add(farmer)
            await db.flush()
            print("Created demo farmer:", farmer.id)

        # --- Demo Buyer ---
        buyer = (await db.execute(
            select(User).where(User.phone == DEMO_BUYER_PHONE)
        )).scalar_one_or_none()
        if not buyer:
            buyer = User(
                email="phone_918888888888@bytefrost.local",
                phone=DEMO_BUYER_PHONE,
                full_name="Priya Sharma",
                hashed_password=hash_password(DEMO_PASSWORD),
                role=UserRole.BUYER_RETAILER,
                is_verified=True,
                address="Shop 12, Azad Market, Pune, Maharashtra",
                latitude=18.5204,
                longitude=73.8567,
            )
            db.add(buyer)
            await db.flush()
            print("Created demo buyer:", buyer.id)

        # --- Additional farmers for marketplace variety ---
        extra_farmers = [
            ("Suresh Patil", "+917777777777", "Village Khed, Satara, Maharashtra"),
            ("Anita Deshmukh", "+916666666666", "Village Baramati, Pune, Maharashtra"),
            ("Vikram Singh", "+915555555555", "Village Sangrur, Punjab"),
        ]
        farmer_ids = [farmer.id]
        for name, phone, addr in extra_farmers:
            u = (await db.execute(select(User).where(User.phone == phone))).scalar_one_or_none()
            if not u:
                u = User(
                    email=f"phone_{phone.replace('+','')}@bytefrost.local",
                    phone=phone,
                    full_name=name,
                    hashed_password=hash_password(DEMO_PASSWORD),
                    role=UserRole.FARMER,
                    is_verified=True,
                    address=addr,
                )
                db.add(u)
                await db.flush()
            farmer_ids.append(u.id)

        # --- Listings for the demo farmer ---
        now = datetime.now(timezone.utc)
        existing = (await db.execute(
            select(ProduceListing).where(ProduceListing.seller_id == farmer.id)
        )).scalars().all()
        if not existing:
            farmer_listings = [
                dict(crop_name="Rice", category="Grains", variety="Basmati", quantity_kg=5000,
                     min_order_quantity=50, price_per_kg=45, quality_grade="A",
                     pickup_location="Nandgaon, Nashik", description="Premium basmati rice, freshly harvested.",
                     images=[PRODUCT_IMAGES["Rice"]], created_days_ago=12),
                dict(crop_name="Wheat", category="Grains", variety="Sharbati", quantity_kg=8000,
                     min_order_quantity=100, price_per_kg=28, quality_grade="A",
                     pickup_location="Nandgaon, Nashik", description="High-protein sharbati wheat.",
                     images=[PRODUCT_IMAGES["Wheat"]], created_days_ago=10),
                dict(crop_name="Tomatoes", category="Vegetables", variety="Hybrid", quantity_kg=1200,
                     min_order_quantity=20, price_per_kg=22, quality_grade="A",
                     pickup_location="Nandgaon, Nashik", description="Farm-fresh hybrid tomatoes.",
                     images=[PRODUCT_IMAGES["Tomatoes"]], created_days_ago=8),
                dict(crop_name="Onions", category="Vegetables", variety="Nasik Red", quantity_kg=3000,
                     min_order_quantity=50, price_per_kg=18, quality_grade="A",
                     pickup_location="Nandgaon, Nashik", description="Premium Nasik red onions.",
                     images=[PRODUCT_IMAGES["Onions"]], created_days_ago=6),
                dict(crop_name="Potatoes", category="Vegetables", variety="Kufri", quantity_kg=4000,
                     min_order_quantity=50, price_per_kg=20, quality_grade="B",
                     pickup_location="Nandgaon, Nashik", description="Good quality Kufri potatoes.",
                     images=[PRODUCT_IMAGES["Potatoes"]], created_days_ago=5),
                dict(crop_name="Mustard", category="Spices", variety="Yellow", quantity_kg=800,
                     min_order_quantity=20, price_per_kg=65, quality_grade="A",
                     pickup_location="Nandgaon, Nashik", description="Organic yellow mustard seeds.",
                     images=[PRODUCT_IMAGES["Mustard"]], created_days_ago=3),
            ]
            for l in farmer_listings:
                listing = ProduceListing(
                    seller_id=farmer.id,
                    crop_name=l["crop_name"],
                    category=l["category"],
                    variety=l["variety"],
                    quantity_kg=l["quantity_kg"],
                    min_order_quantity=l["min_order_quantity"],
                    price_per_kg=l["price_per_kg"],
                    quality_grade=l["quality_grade"],
                    pickup_location=l["pickup_location"],
                    description=l["description"],
                    images=l["images"],
                    is_active=True,
                    created_at=now - timedelta(days=l["created_days_ago"]),
                )
                db.add(listing)
            await db.flush()
            print("Created demo farmer listings")

        # --- Listings for extra farmers ---
        extra_listings = [
            (farmer_ids[1], "Carrots", "Vegetables", "Nantes", 1500, 25, 35, "Khed, Satara", "Fresh Nantes carrots."),
            (farmer_ids[1], "Spinach", "Vegetables", "Palak", 600, 10, 30, "Khed, Satara", "Organic palak spinach."),
            (farmer_ids[2], "Mangoes", "Fruits", "Alphonso", 2000, 50, 120, "Baramati, Pune", "Premium Alphonso mangoes."),
            (farmer_ids[2], "Bananas", "Fruits", "Robusta", 3000, 100, 25, "Baramati, Pune", "Fresh robusta bananas."),
            (farmer_ids[3], "Wheat", "Grains", "HD-2967", 10000, 100, 26, "Sangrur, Punjab", "Bulk wheat from Punjab."),
            (farmer_ids[3], "Corn", "Grains", "Sweet Corn", 2500, 50, 32, "Sangrur, Punjab", "Sweet corn cobs."),
        ]
        for sid, name, cat, var, qty, moq, price, loc, desc in extra_listings:
            exists = (await db.execute(
                select(ProduceListing).where(
                    ProduceListing.seller_id == sid,
                    ProduceListing.crop_name == name,
                )
            )).scalar_one_or_none()
            if not exists:
                db.add(ProduceListing(
                    seller_id=sid, crop_name=name, category=cat, variety=var,
                    quantity_kg=qty, min_order_quantity=moq, price_per_kg=price,
                    pickup_location=loc, description=desc,
                    images=[PRODUCT_IMAGES.get(name, "🌾")],
                    is_active=True,
                    created_at=now - timedelta(days=4),
                ))
        await db.flush()

        # --- Orders for the demo farmer (from various buyers) ---
        existing_orders = (await db.execute(
            select(Order).join(OrderItem).join(ProduceListing)
            .where(ProduceListing.seller_id == farmer.id)
        )).scalars().all()
        if not existing_orders:
            # Create a few other buyers
            other_buyers = [
                ("Rahul Verma", "+914444444444", "GreenMart Superstore, Mumbai"),
                ("Kavita Joshi", "+913333333333", "FreshBasket Retail, Nashik"),
            ]
            buyer_ids = []
            for name, phone, addr in other_buyers:
                u = (await db.execute(select(User).where(User.phone == phone))).scalar_one_or_none()
                if not u:
                    u = User(
                        email=f"phone_{phone.replace('+','')}@bytefrost.local",
                        phone=phone, full_name=name,
                        hashed_password=hash_password(DEMO_PASSWORD),
                        role=UserRole.BUYER_RETAILER, is_verified=True, address=addr,
                    )
                    db.add(u)
                    await db.flush()
                buyer_ids.append(u.id)

            farmer_listings = (await db.execute(
                select(ProduceListing).where(ProduceListing.seller_id == farmer.id)
            )).scalars().all()
            listing_by_name = {l.crop_name: l for l in farmer_listings}

            order_specs = [
                # (buyer_idx, [(crop, qty)], status, days_ago, address)
                (0, [("Rice", 200), ("Onions", 100)], "delivered", 9, "GreenMart Superstore, Mumbai"),
                (1, [("Tomatoes", 50)], "delivered", 7, "FreshBasket Retail, Nashik"),
                (0, [("Wheat", 300)], "shipped", 4, "GreenMart Superstore, Mumbai"),
                (1, [("Potatoes", 150), ("Onions", 80)], "processing", 2, "FreshBasket Retail, Nashik"),
                (0, [("Mustard", 40)], "confirmed", 1, "GreenMart Superstore, Mumbai"),
            ]
            for buyer_idx, items, status, days_ago, addr in order_specs:
                order = Order(
                    buyer_id=buyer_ids[buyer_idx],
                    status=OrderStatus(status),
                    delivery_address=addr,
                    created_at=now - timedelta(days=days_ago),
                )
                db.add(order)
                await db.flush()
                total = 0
                for crop, qty in items:
                    listing = listing_by_name.get(crop)
                    if not listing:
                        continue
                    price = listing.price_per_kg or 0
                    db.add(OrderItem(
                        order_id=order.id, listing_id=listing.id,
                        quantity_kg=qty, price_per_kg=price,
                    ))
                    total += qty * price
                order.total_amount = total
                # Payments for delivered orders
                if status == "delivered":
                    db.add(Payment(
                        order_id=order.id, payer_id=buyer_ids[buyer_idx],
                        payee_id=farmer.id, amount=total, status="completed",
                        payment_method="UPI", transaction_id=f"TXN{order.id.hex[:8].upper()}",
                    ))
            await db.flush()
            print("Created demo farmer orders")

        # --- Orders for the demo buyer ---
        existing_buyer_orders = (await db.execute(
            select(Order).where(Order.buyer_id == buyer.id)
        )).scalars().all()
        if not existing_buyer_orders:
            all_listings = (await db.execute(
                select(ProduceListing).where(ProduceListing.is_active == True)
            )).scalars().all()
            listing_by_name = {l.crop_name: l for l in all_listings}

            buyer_order_specs = [
                (("Mangoes", 100), "delivered", 6, "Shop 12, Azad Market, Pune"),
                (("Rice", 150), "shipped", 3, "Shop 12, Azad Market, Pune"),
                (("Tomatoes", 40), "processing", 1, "Shop 12, Azad Market, Pune"),
            ]
            for (crop, qty), status, days_ago, addr in buyer_order_specs:
                listing = listing_by_name.get(crop)
                if not listing:
                    continue
                order = Order(
                    buyer_id=buyer.id,
                    status=OrderStatus(status),
                    delivery_address=addr,
                    created_at=now - timedelta(days=days_ago),
                )
                db.add(order)
                await db.flush()
                price = listing.price_per_kg or 0
                db.add(OrderItem(
                    order_id=order.id, listing_id=listing.id,
                    quantity_kg=qty, price_per_kg=price,
                ))
                order.total_amount = qty * price
                if status == "delivered":
                    db.add(Payment(
                        order_id=order.id, payer_id=buyer.id,
                        payee_id=listing.seller_id, amount=qty * price,
                        status="completed", payment_method="UPI",
                        transaction_id=f"TXN{order.id.hex[:8].upper()}",
                    ))
            await db.flush()
            print("Created demo buyer orders")

        await db.commit()
        print("Seeding complete.")


if __name__ == "__main__":
    asyncio.run(seed())
