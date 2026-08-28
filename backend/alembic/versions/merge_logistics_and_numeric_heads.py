"""merge logistics and money migration heads

Revision ID: merge_logistics_numeric
Revises: 002_logistics, 50bd405ce0e2
"""
from typing import Sequence, Union

from alembic import op


revision: str = "merge_logistics_numeric"
down_revision: Union[str, Sequence[str], None] = ("002_logistics", "50bd405ce0e2")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
