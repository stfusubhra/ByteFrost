"""buyer profile + notifications

Adds:
- users.profile JSON column (buyer onboarding: business name/type, delivery
  location, preferred crops, monthly volume, onboarding_completed flag)
- notifications table (in-app notifications for buyers: order status changes,
  shipment milestones, supply alerts)

Revision ID: 004_buyer_profile_notifications
Revises: 003_shipment_allocation_nullable
Create Date: 2026-09-12
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = "004_buyer_profile_notifications"
down_revision: Union[str, Sequence[str], None] = "003_shipment_allocation_nullable"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("profile", sa.JSON(), nullable=True))

    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("category", sa.String(50), nullable=True),  # order / shipment / supply / system
        sa.Column("link", sa.String(500), nullable=True),     # frontend route, e.g. /buyer/orders/{id}
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_notifications_user_created", "notifications", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_notifications_user_created", table_name="notifications")
    op.drop_table("notifications")
    op.drop_column("users", "profile")