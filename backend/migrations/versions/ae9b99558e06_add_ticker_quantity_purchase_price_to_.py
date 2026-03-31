"""add ticker quantity purchase_price to investments

Revision ID: ae9b99558e06
Revises: c3926ccc2178
Create Date: 2026-03-30 14:27:02.885476
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'ae9b99558e06'
down_revision: Union[str, None] = 'c3926ccc2178'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('investments', sa.Column('ticker', sa.String(length=20), nullable=True))
    op.add_column('investments', sa.Column('quantity', sa.Numeric(precision=14, scale=6), nullable=False, server_default='0'))
    op.add_column('investments', sa.Column('purchase_price', sa.Numeric(precision=14, scale=2), nullable=False, server_default='0'))
    op.create_index(op.f('ix_investments_ticker'), 'investments', ['ticker'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_investments_ticker'), table_name='investments')
    op.drop_column('investments', 'purchase_price')
    op.drop_column('investments', 'quantity')
    op.drop_column('investments', 'ticker')
