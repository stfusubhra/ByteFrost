"""
Hubs API
CRUD operations for logistics hubs.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import Hub, UserRole
from app.schemas.schemas import HubCreate, HubUpdate, HubResponse

router = APIRouter(prefix="/hubs", tags=["Logistics - Hubs"])

VEHICLE_HUB_ROLES = {
    UserRole.ADMIN,
    UserRole.LOGISTICS,
}


@router.post("/", response_model=HubResponse, status_code=status.HTTP_201_CREATED)
async def create_hub(hub_in: HubCreate, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    require_roles(current_user, VEHICLE_HUB_ROLES)
    hub = Hub(**hub_in.model_dump())
    db.add(hub)
    await db.flush()
    return hub


@router.get("/", response_model=List[HubResponse])
async def get_hubs(skip: int = 0, limit: int = 100, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    require_roles(current_user, VEHICLE_HUB_ROLES)
    result = await db.execute(select(Hub).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/{hub_id}", response_model=HubResponse)
async def get_hub(hub_id: UUID, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    require_roles(current_user, VEHICLE_HUB_ROLES)
    hub = await db.get(Hub, hub_id)
    if not hub:
        raise HTTPException(status_code=404, detail="Hub not found")
    return hub


@router.patch("/{hub_id}", response_model=HubResponse)
async def update_hub(hub_id: UUID, hub_in: HubUpdate, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    require_roles(current_user, VEHICLE_HUB_ROLES)
    hub = await db.get(Hub, hub_id)
    if not hub:
        raise HTTPException(status_code=404, detail="Hub not found")

    update_data = hub_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(hub, field, value)

    db.add(hub)
    await db.flush()
    return hub