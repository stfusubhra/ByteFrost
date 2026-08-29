"""
End-to-end test of the /fulfill-order pipeline against a real database.
Seeds farmers/listings/vehicle/hub (sync engine), then calls the endpoint via TestClient.
"""
import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.models.models import (
    User, UserRole, ProduceListing, Vehicle, VehicleType, VehicleStatus,
    Hub, HubType, HubStatus,
)
from app.core.security import hash_password, create_access_token


def seed(include_farmers=True):
    with SessionLocal() as db:
        # Clean any prior test rows (children first to satisfy FKs)
        from app.models.models import (
            RouteStop, Route, Shipment, LogisticsEvent, HubInventory,
            ShipmentTemperatureLog, Allocation, OrderItem, Order,
        )
        db.query(ShipmentTemperatureLog).delete()
        db.query(LogisticsEvent).delete()
        db.query(RouteStop).delete()
        db.query(Shipment).delete()  # references route/vehicle/order/allocation
        db.query(Route).delete()
        db.query(Allocation).delete()
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(HubInventory).delete()
        db.query(ProduceListing).filter(ProduceListing.crop_name == "tomato").delete()
        db.query(User).filter(User.email.like("%@test.com")).delete()
        db.query(Vehicle).delete()
        db.query(Hub).delete()
        db.commit()

        if include_farmers:
            farmers = [
                ("farmer1@test.com", "Farmer One", 22.5726, 88.3639, 400),
                ("farmer2@test.com", "Farmer Two", 22.6000, 88.4000, 300),
                ("farmer3@test.com", "Farmer Three", 22.5500, 88.3500, 100),
                ("farmer4@test.com", "Farmer Four", 23.5000, 89.3000, 500),  # distant
            ]
            for email, name, lat, lng, qty in farmers:
                u = User(
                    email=email, full_name=name,
                    hashed_password=hash_password("testpass123"),
                    role=UserRole.FARMER, is_active=True, is_verified=True,
                    latitude=lat, longitude=lng,
                )
                db.add(u)
                db.flush()
                db.add(ProduceListing(
                    seller_id=u.id, crop_name="tomato", quantity_kg=qty,
                    quality_grade="A", price_per_kg=30.0,
                    pickup_latitude=lat, pickup_longitude=lng, is_active=True,
                ))

        buyer = User(
            email="buyer@test.com", full_name="Buyer",
            hashed_password=hash_password("testpass123"),
            role=UserRole.BUYER_BULK, is_active=True, is_verified=True,
            latitude=22.5000, longitude=88.3000,
        )
        db.add(buyer)
        db.flush()

        db.add(Vehicle(
            capacity_kg=1000.0, vehicle_type=VehicleType.STANDARD,
            latitude=22.5700, longitude=88.3600,
            status=VehicleStatus.AVAILABLE, current_load_kg=0,
            operating_cost_per_km=12.0,
        ))
        db.add(Hub(
            name="Kolkata Hub", hub_type=HubType.LOCAL,
            latitude=22.5700, longitude=88.3600,
            capacity_kg=5000.0, current_load_kg=0, status=HubStatus.ACTIVE,
        ))
        db.commit()
        return str(buyer.id)


def main():
    import sys
    scenario = sys.argv[1] if len(sys.argv) > 1 else "partial"
    buyer_id = seed(include_farmers=(scenario != "infeasible"))
    print("Seeded data. Buyer ID:", buyer_id, "| scenario:", scenario)

    token = create_access_token(data={"sub": buyer_id, "role": "buyer_bulk"})
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "crop_name": "tomato",
        "required_quantity_kg": 500 if scenario == "feasible" else 1000,
        "min_quality_grade": "B",
        "delivery_latitude": 22.5000,
        "delivery_longitude": 88.3000,
        "delivery_address": "Kolkata Market",
        "max_price_per_kg": 40.0,
    }

    resp = client.post("/api/v1/logistics/fulfill-order", json=payload, headers=headers)
    print("\n=== /fulfill-order response ===")
    print("STATUS:", resp.status_code)
    import json
    print(json.dumps(resp.json(), indent=2, default=str))


if __name__ == "__main__":
    main()
