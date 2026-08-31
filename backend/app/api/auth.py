from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.core.limiter import limiter
from app.models.models import User, UserRole
from app.schemas.schemas import UserCreate, UserLogin, TokenResponse, UserResponse

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def register(request: Request, payload: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check existing
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=UserRole(payload.role),
    )
    db.add(user)
    await db.flush()

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role.value,
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
async def login(request: Request, payload: UserLogin, db: AsyncSession = Depends(get_db)):
    # Ensure exactly one of email or phone is provided
    if payload.email and payload.phone:
        raise HTTPException(status_code=400, detail="Provide either email or phone, not both")
    if not payload.email and not payload.phone:
        raise HTTPException(status_code=400, detail="Either email or phone must be provided")
    
    query = select(User)
    if payload.email:
        query = query.where(User.email == payload.email)
    else:  # payload.phone is guaranteed to be present if we reach here
        query = query.where(User.phone == payload.phone)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role.value,
    )
@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == current_user["id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
