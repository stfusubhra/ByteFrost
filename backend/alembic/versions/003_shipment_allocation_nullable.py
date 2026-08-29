"""make shipments.allocation_id nullable

A shipment can be linked directly to an order (fulfill-order flow) without
going through a single allocation, so allocation_id must be nullable.

Revision ID: 003_shipment_allocation_nullable
Revises: merge_logistics_numeric
Create Date: 2026-08-29
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "003_shipment_allocation_nullable"
down_revision: Union[str, Sequence[str], None] = "merge_logistics_numeric"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("shipments", "allocation_id", existing_type=sa.UUID(), nullable=True)


def downgrade() -> None:
    op.alter_column("shipments", "allocation_id", existing_type=sa.UUID(), nullable=False)
