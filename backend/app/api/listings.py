from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import ProduceListing, User, UserRole
from app.schemas.schemas import ListingCreate, ListingResponse

router = APIRouter()

# Roles allowed to create produce listings (sellers)
LISTING_CREATOR_ROLES = {
    UserRole.FARMER,
    UserRole.FPO_MANAGER,
}


@router.post("/", response_model=ListingResponse, status_code=201)
async def create_listing(
    payload: ListingCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_roles(current_user, LISTING_CREATOR_ROLES)
    listing = ProduceListing(
        seller_id=UUID(current_user["id"]),
        **payload.model_dump(),
    )
    db.add(listing)
    await db.flush()
    await db.commit()
    await db.refresh(listing)
    return listing


@router.get("/", response_model=List[ListingResponse])
async def list_listings(
    crop_name: str = None,
    min_quantity: float = None,
    max_price: float = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    query = select(ProduceListing).where(ProduceListing.is_active == True)

    if crop_name:
        query = query.where(ProduceListing.crop_name.ilike(f"%{crop_name}%"))
    if min_quantity:
        query = query.where(ProduceListing.quantity_kg >= min_quantity)
    if max_price:
        query = query.where(ProduceListing.price_per_kg <= max_price)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{listing_id}", response_model=ListingResponse)
async def get_listing(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProduceListing).where(ProduceListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@router.delete("/{listing_id}", status_code=204)
async def deactivate_listing(
    listing_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProduceListing).where(
            ProduceListing.id == listing_id,
            ProduceListing.seller_id == UUID(current_user["id"]),
        )
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found or not owned")

    listing.is_active = False
    await db.commit()
    return None
