from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import ProduceListing, User
from app.schemas.schemas import ListingCreate, ListingUpdate, ListingResponse

router = APIRouter()


@router.post("/", response_model=ListingResponse, status_code=201)
async def create_listing(
    payload: ListingCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    listing = ProduceListing(
        seller_id=UUID(current_user["id"]),
        **payload.model_dump(),
    )
    db.add(listing)
    await db.flush()
    return listing


@router.get("/", response_model=List[ListingResponse])
async def list_listings(
    crop_name: str = None,
    category: str = None,
    min_quantity: float = None,
    max_price: float = None,
    location: str = None,
    seller_id: str = None,
    sort: str = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    query = select(ProduceListing).where(ProduceListing.is_active == True)

    if crop_name:
        query = query.where(ProduceListing.crop_name.ilike(f"%{crop_name}%"))
    if category:
        query = query.where(ProduceListing.category == category)
    if min_quantity:
        query = query.where(ProduceListing.quantity_kg >= min_quantity)
    if max_price:
        query = query.where(ProduceListing.price_per_kg <= max_price)
    if location:
        query = query.where(ProduceListing.pickup_location.ilike(f"%{location}%"))
    if seller_id:
        query = query.where(ProduceListing.seller_id == UUID(seller_id))

    if sort == "price_asc":
        query = query.order_by(ProduceListing.price_per_kg.asc())
    elif sort == "price_desc":
        query = query.order_by(ProduceListing.price_per_kg.desc())
    elif sort == "newest":
        query = query.order_by(ProduceListing.created_at.desc())
    else:
        query = query.order_by(ProduceListing.created_at.desc())

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/mine", response_model=List[ListingResponse])
async def my_listings(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(ProduceListing)
        .where(ProduceListing.seller_id == UUID(current_user["id"]))
        .order_by(ProduceListing.created_at.desc())
    )
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

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(listing, field, value)
    await db.flush()
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
    return None
