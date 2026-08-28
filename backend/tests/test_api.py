import pytest
from fastapi.testclient import TestClient
from app.main import app
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings
from app.core.database import get_db

TEST_DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

TRUNCATE_SQL = (
    "TRUNCATE payments, shipments, allocations, order_items, orders, "
    "produce_listings, fpos, users RESTART IDENTITY CASCADE"
)


def _truncate_all():
    """Truncate all tables so each test starts from a clean database."""
    import asyncio

    async def _run():
        engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
        async with engine.begin() as conn:
            await conn.execute(__import__("sqlalchemy").text(TRUNCATE_SQL))
        await engine.dispose()

    asyncio.run(_run())


@pytest.fixture(autouse=True)
def override_get_db():
    """
    Override the DB dependency with a fresh session per request.

    The connection is created lazily INSIDE the async generator so it runs on
    the same event loop as the app (TestClient's anyio portal). Creating it in
    the pytest loop and reusing it across the portal loop causes
    InterfaceError / cross-loop connection reuse failures.

    Each request commits so data created in one request is visible to the next
    (e.g. register then login). Tables are truncated before each test so tests
    are isolated and idempotent.
    """
    _truncate_all()

    async def _get_db_override():
        engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
        TestingSessionLocal = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
        async with TestingSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
        await engine.dispose()

    app.dependency_overrides[get_db] = _get_db_override
    yield
    app.dependency_overrides.clear()

@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "0.1.0"


def test_register_and_login(client):
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
    # Save the token for login
    token = data["access_token"]

    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@bytefrost.com",
            "password": "testpass123",
        },
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data
    # Optionally, we can check that the token is the same or at least valid
    assert login_data["access_token"] is not None


def test_create_listing(client):
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
    assert reg.status_code == 201
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


def test_list_listings(client):
    response = client.get("/api/v1/listings")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_matching_returns_real_scored_buyers(client):
    # Register a farmer and a buyer.
    farmer_token = _register(client, "farmer_match@bytefrost.com", "farmer")
    buyer_token = _register(client, "buyer_match@bytefrost.com", "buyer_bulk")

    # Create a real listing.
    listing = _create_listing(client, farmer_token, price=25.0, quantity=500)
    listing_id = listing["id"]

    # Matching should return a scored list of real buyers (not a hard-coded dummy).
    response = client.post(
        "/api/v1/matching/find-matches",
        json={"listing_id": listing_id},
        headers={"Authorization": f"Bearer {buyer_token}"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data, list)
    # The registered buyer should appear as a match.
    assert any(m["buyer_id"] for m in data)
    # Scores must be within [0, 1] and explanations present.
    for m in data:
        assert 0.0 <= m["score"] <= 1.0
        assert "quantity_fit" in m["explanation"]
        assert "distance_score" in m["explanation"]


def test_matching_unknown_listing_404(client):
    """Matching against a non-existent listing must 404, not return a dummy."""
    buyer_token = _register(client, "buyer_match404@bytefrost.com", "buyer_bulk")
    response = client.post(
        "/api/v1/matching/find-matches",
        json={"listing_id": "00000000-0000-0000-0000-000000000000"},
        headers={"Authorization": f"Bearer {buyer_token}"},
    )
    assert response.status_code == 404


def _register(client, email, role, full_name="Test User"):
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "testpass123",
            "full_name": full_name,
            "role": role,
        },
    )
    assert reg.status_code == 201, reg.text
    return reg.json()["access_token"]


def _create_listing(client, token, price=25.0, quantity=500):
    response = client.post(
        "/api/v1/listings",
        json={
            "crop_name": "Rice",
            "variety": "Basmati",
            "quantity_kg": quantity,
            "quality_grade": "A",
            "price_per_kg": price,
            "pickup_location": "West Bengal, India",
            "pickup_latitude": 22.5726,
            "pickup_longitude": 88.3639,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_order_price_is_server_computed(client):
    """The server must compute the price from the listing, not trust the client."""
    farmer_token = _register(client, "farmer_price@bytefrost.com", "farmer")
    buyer_token = _register(client, "buyer_price@bytefrost.com", "buyer_bulk")

    listing = _create_listing(client, farmer_token, price=30.0, quantity=100)
    listing_id = listing["id"]

    # Client tries to order 10 kg at a fake price of 1.0 (price_per_kg is no
    # longer accepted in the payload, so it should be ignored entirely).
    response = client.post(
        "/api/v1/orders",
        json={
            "items": [
                {
                    "listing_id": listing_id,
                    "quantity_kg": 10,
                    "price_per_kg": 1.0,  # should be ignored
                }
            ]
        },
        headers={"Authorization": f"Bearer {buyer_token}"},
    )
    assert response.status_code == 201, response.text
    data = response.json()
    # 10 kg * 30.0 = 300.0, NOT 10 * 1.0
    assert data["total_amount"] == 300.0


def test_order_oversell_prevented(client):
    """Ordering more than the listing's available quantity must be rejected."""
    farmer_token = _register(client, "farmer_oversell@bytefrost.com", "farmer")
    buyer_token = _register(client, "buyer_oversell@bytefrost.com", "buyer_bulk")

    listing = _create_listing(client, farmer_token, price=20.0, quantity=50)
    listing_id = listing["id"]

    response = client.post(
        "/api/v1/orders",
        json={"items": [{"listing_id": listing_id, "quantity_kg": 500}]},
        headers={"Authorization": f"Bearer {buyer_token}"},
    )
    assert response.status_code == 400
    assert "Insufficient quantity" in response.json()["detail"]


def test_buyer_cannot_create_listing(client):
    """Role enforcement: a buyer must not be able to create a produce listing."""
    buyer_token = _register(client, "buyer_role@bytefrost.com", "buyer_bulk")

    response = client.post(
        "/api/v1/listings",
        json={
            "crop_name": "Rice",
            "variety": "Basmati",
            "quantity_kg": 100,
            "quality_grade": "A",
            "price_per_kg": 25.0,
            "pickup_location": "West Bengal, India",
        },
        headers={"Authorization": f"Bearer {buyer_token}"},
    )
    assert response.status_code == 403


def test_farmer_cannot_create_order(client):
    """Role enforcement: a farmer must not be able to place an order."""
    farmer_token = _register(client, "farmer_role@bytefrost.com", "farmer")

    response = client.post(
        "/api/v1/orders",
        json={"items": [{"listing_id": "00000000-0000-0000-0000-000000000000", "quantity_kg": 5}]},
        headers={"Authorization": f"Bearer {farmer_token}"},
    )
    assert response.status_code == 403
