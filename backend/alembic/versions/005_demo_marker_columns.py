"""demo marker columns

Adds a `demo` boolean column to vehicles, hubs and fpos so the demo seed
script can identify and reset ONLY demo records in a production database
without broad DELETEs. Demo users are already identifiable via their
`@kisansetu.demo` email domain (and `profile.demo` flag).

Revision ID: 005_demo_marker_columns
Revises: 004_buyer_profile_notifications
Create Date: 2026-09-23
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "005_demo_marker_columns"
down_revision: Union[str, Sequence[str], None] = "004_buyer_profile_notifications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("vehicles", sa.Column("demo", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("hubs", sa.Column("demo", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("fpos", sa.Column("demo", sa.Boolean(), nullable=False, server_default=sa.text("false")))


def downgrade() -> None:
    op.drop_column("fpos", "demo")
    op.drop_column("hubs", "demo")
    op.drop_column("vehicles", "demo")