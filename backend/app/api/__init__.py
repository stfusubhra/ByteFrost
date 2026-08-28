from fastapi import APIRouter
from app.api import auth, users, listings, orders, matching, logistics, vehicles, hubs

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(listings.router, prefix="/listings", tags=["Listings"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(matching.router, prefix="/matching", tags=["AI Matching"])
api_router.include_router(logistics.router, prefix="/logistics", tags=["Logistics"])
api_router.include_router(vehicles.router, prefix="/vehicles", tags=["Logistics - Vehicles"])
api_router.include_router(hubs.router, prefix="/hubs", tags=["Logistics - Hubs"])
