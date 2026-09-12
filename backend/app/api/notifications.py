from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Notification
from app.schemas.schemas import NotificationResponse

router = APIRouter()


@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    unread_only: bool = False,
    limit: int = 30,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List the current user's notifications, newest first."""
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="1 <= limit <= 100")

    query = select(Notification).where(Notification.user_id == UUID(current_user["id"]))
    if unread_only:
        query = query.where(Notification.is_read == False)  # noqa: E712
    query = query.order_by(Notification.created_at.desc()).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/unread-count")
async def unread_count(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == UUID(current_user["id"]), Notification.is_read == False)  # noqa: E712
    )
    return {"count": len(result.scalars().all())}


@router.post("/{notification_id}/read")
async def mark_read(
    notification_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        update(Notification)
        .where(
            Notification.id == notification_id,
            Notification.user_id == UUID(current_user["id"]),
        )
        .values(is_read=True)
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}


@router.post("/read-all")
async def mark_all_read(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        update(Notification)
        .where(Notification.user_id == UUID(current_user["id"]), Notification.is_read == False)  # noqa: E712
        .values(is_read=True)
    )
    return {"message": f"{result.rowcount} notifications marked as read"}