"""add_grl_score

Revision ID: 2d9f3e4c5b2a
Revises: 1c7d8e9f2a1b
Create Date: 2026-06-04 23:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '2d9f3e4c5b2a'
down_revision: Union[str, None] = '1c7d8e9f2a1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('teams', sa.Column('grl_score', sa.Float(), nullable=False, server_default='0.0'))


def downgrade() -> None:
    op.drop_column('teams', 'grl_score')
