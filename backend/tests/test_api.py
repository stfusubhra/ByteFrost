import pytest
from fastapi.testclient import TestClient
from app.main import app
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.database import get_db, Base
from app.core.config import settings

# Use a separate engine with NullPool for tests to avoid connection reuse
TEST_DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=None)  # NullPool is default? Actually poolclass=None uses default QueuePool. We want NullPool.
from sqlalchemy.pool import NullPool
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
TestingSessionLocal = sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)

@pytest.fixture(autouse=True)
def override_get_db():
    async def _override_get_db():
        async with TestingSessionLocal() as session:
            try:
                yield session
                await session.rollback()
            finally:
                await session.close()
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()
    # Dispose the engine to close all connections
    # Note: we keep the engine alive across tests for efficiency; but we could dispose each time.
    # We'll dispose after each test to be safe.
    # However, disposing the engine while other tests might be using it? Since we override per test, it's fine.
    # We'll dispose after each test in the fixture teardown.
    # Actually we should dispose after yielding, but we need to ensure the engine is not used later.
    # We'll move the dispose inside the finally after closing session? But we need the engine for the next test.
    # Instead, we will not dispose; we rely on NullPool which creates a new connection each time and closes it.
    # With NullPool, each connection is closed when the session closes, so we don't need to dispose.

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


def test_matching_placeholder(client):
    # Register
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "buyer1@bytefrost.com",
            "password": "testpass123",
            "full_name": "Buyer One",
            "role": "buyer_bulk",
        },
    )
    token = reg.json()["access_token"]

    # Test matching
    response = client.post(
        "/api/v1/matching/find-matches",
        json={"listing_id": "00000000-0000-0000-0000-000000000000"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
