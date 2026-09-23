from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import ProduceListing, User, UserRole
from app.schemas.schemas import ListingCreate, ListingResponse, ListingUpdate

router = APIRouter()

# Roles allowed to create produce listings (sellers)
LISTING_CREATOR_ROLES = {
    UserRole.FARMER,
    UserRole.FPO_MANAGER,
}


def _to_response(listing: ProduceListing, farm_name: Optional[str]) -> ListingResponse:
    """Build a ListingResponse with the seller's display name (farm_name)."""
    return ListingResponse(
        id=listing.id,
        seller_id=listing.seller_id,
        crop_name=listing.crop_name,
        variety=listing.variety,
        quantity_kg=listing.quantity_kg,
        quality_grade=listing.quality_grade,
        price_per_kg=listing.price_per_kg,
        harvest_date=listing.harvest_date,
        pickup_location=listing.pickup_location,
        is_active=listing.is_active,
        created_at=listing.created_at,
        farm_name=farm_name,
    )


async def _seller_name(db: AsyncSession, seller_id: UUID) -> Optional[str]:
    result = await db.execute(select(User.full_name).where(User.id == seller_id))
    return result.scalar_one_or_none()


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
    farm_name = await _seller_name(db, listing.seller_id)
    return _to_response(listing, farm_name)


@router.get("/", response_model=List[ListingResponse])
async def list_listings(
    crop_name: str = None,
    min_quantity: float = None,
    max_price: float = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(ProduceListing, User.full_name)
        .join(User, ProduceListing.seller_id == User.id)
        .where(ProduceListing.is_active == True)  # noqa: E712
    )

    if crop_name:
        query = query.where(ProduceListing.crop_name.ilike(f"%{crop_name}%"))
    if min_quantity:
        query = query.where(ProduceListing.quantity_kg >= min_quantity)
    if max_price:
        query = query.where(ProduceListing.price_per_kg <= max_price)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    rows = result.all()
    return [_to_response(listing, farm_name) for listing, farm_name in rows]


@router.get("/{listing_id}", response_model=ListingResponse)
async def get_listing(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProduceListing, User.full_name)
        .join(User, ProduceListing.seller_id == User.id)
        .where(ProduceListing.id == listing_id)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Listing not found")
    listing, farm_name = row
    return _to_response(listing, farm_name)


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
    return None


@router.patch("/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: UUID,
    payload: ListingUpdate,
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

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(listing, field, value)

    await db.flush()
    await db.refresh(listing)
    farm_name = await _seller_name(db, listing.seller_id)
    return _to_response(listing, farm_name)