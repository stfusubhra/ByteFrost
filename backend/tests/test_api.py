from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "0.1.0"


def test_register_and_login():
    # Register
    reg_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@bytefrost.com",
            "password": "testpass123",
            "full_name": "Test Farmer",
            "role": "farmer",
        },
    )
    assert reg_response.status_code == 201
    data = reg_response.json()
    assert "access_token" in data
    assert data["role"] == "farmer"

    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@bytefrost.com",
            "password": "testpass123",
        },
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()


def test_create_listing():
    # Register first
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "farmer1@bytefrost.com",
            "password": "testpass123",
            "full_name": "Farmer One",
            "role": "farmer",
        },
    )
    token = reg.json()["access_token"]

    # Create listing
    response = client.post(
        "/api/v1/listings",
        json={
            "crop_name": "Rice",
            "variety": "Basmati",
            "quantity_kg": 500,
            "quality_grade": "A",
            "price_per_kg": 25.0,
            "pickup_location": "West Bengal, India",
            "pickup_latitude": 22.5726,
            "pickup_longitude": 88.3639,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["crop_name"] == "Rice"
    assert data["quantity_kg"] == 500


def test_list_listings():
    response = client.get("/api/v1/listings")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_matching():
    # Register a farmer and create a listing to match against
    farmer_reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "farmer_match@bytefrost.com",
            "password": "testpass123",
            "full_name": "Farmer Match",
            "role": "farmer",
        },
    )
    farmer_token = farmer_reg.json()["access_token"]

    listing_response = client.post(
        "/api/v1/listings",
        json={
            "crop_name": "Tomato",
            "quantity_kg": 2000,
            "price_per_kg": 25.0,
            "pickup_location": "Delhi, India",
            "pickup_latitude": 28.6,
            "pickup_longitude": 77.2,
        },
        headers={"Authorization": f"Bearer {farmer_token}"},
    )
    assert listing_response.status_code == 201
    listing_id = listing_response.json()["id"]

    # Register a buyer
    buyer_reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "buyer_match@bytefrost.com",
            "password": "testpass123",
            "full_name": "Buyer Match",
            "role": "buyer_bulk",
        },
    )
    buyer_token = buyer_reg.json()["access_token"]

    # Test matching against the real listing
    response = client.post(
        "/api/v1/matching/find-matches",
        json={"listing_id": listing_id},
        headers={"Authorization": f"Bearer {buyer_token}"},
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

    # Unknown listing should 404
    not_found = client.post(
        "/api/v1/matching/find-matches",
        json={"listing_id": "00000000-0000-0000-0000-000000000000"},
        headers={"Authorization": f"Bearer {buyer_token}"},
    )
    assert not_found.status_code == 404
