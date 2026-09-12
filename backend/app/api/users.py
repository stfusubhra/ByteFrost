from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import User, UserRole
from app.schemas.schemas import UserProfileUpdate, UserResponse

router = APIRouter()

USER_LIST_ROLES = {
    UserRole.ADMIN,
}


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's own profile (any authenticated role)."""
    result = await db.execute(select(User).where(User.id == UUID(current_user["id"])))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    payload: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile (used by buyer onboarding).

    Flat fields (full_name, address, lat/lng) map to User columns; buyer
    onboarding fields are stored in the `profile` JSON column. Passing
    onboarding_completed=True marks onboarding done.
    """
    result = await db.execute(select(User).where(User.id == UUID(current_user["id"])))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.address is not None:
        user.address = payload.address
    if payload.latitude is not None:
        user.latitude = payload.latitude
    if payload.longitude is not None:
        user.longitude = payload.longitude

    profile = dict(user.profile or {})
    if payload.business_name is not None:
        profile["business_name"] = payload.business_name
    if payload.business_type is not None:
        profile["business_type"] = payload.business_type
    if payload.delivery_city is not None:
        profile["delivery_city"] = payload.delivery_city
    if payload.preferred_crops is not None:
        profile["preferred_crops"] = payload.preferred_crops
    if payload.monthly_volume_kg is not None:
        profile["monthly_volume_kg"] = payload.monthly_volume_kg
    if payload.onboarding_completed is not None:
        profile["onboarding_completed"] = payload.onboarding_completed
    if profile:
        user.profile = profile

    await db.flush()
    return user


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List users with pagination (skip/limit)."""
    if skip < 0 or limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="skip >= 0 and 1 <= limit <= 100")
    require_roles(current_user, USER_LIST_ROLES)

    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single user by ID."""
    require_roles(current_user, USER_LIST_ROLES)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user