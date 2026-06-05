"""add_players

Revision ID: eca6cd6f4903
Revises: 1c7d8e9f2a1b
Create Date: 2026-06-04 23:17:14.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "eca6cd6f4903"
down_revision: Union[str, None] = "1c7d8e9f2a1b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if "players" in sa.inspect(bind).get_table_names():
        return

    op.create_table(
        "players",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("squad_number", sa.Integer(), nullable=True),
        sa.Column("squad_position", sa.String(length=3), nullable=False),
        sa.Column("detailed_position", sa.String(length=10), nullable=True),
        sa.Column("alternative_positions", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("club", sa.String(length=120), nullable=True),
        sa.Column("is_captain", sa.Boolean(), nullable=False),
        sa.Column("overall_rating", sa.Integer(), nullable=False),
        sa.Column("nationality", sa.String(length=60), nullable=True),
        sa.Column("league", sa.String(length=80), nullable=True),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("height_cm", sa.Integer(), nullable=True),
        sa.Column("weight_kg", sa.Integer(), nullable=True),
        sa.Column("preferred_foot", sa.String(length=10), nullable=True),
        sa.Column("play_styles", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("photo_url", sa.String(length=255), nullable=True),
        sa.Column("is_estimated", sa.Boolean(), nullable=False),
        sa.Column("attributes", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_players_name"), "players", ["name"], unique=False)
    op.create_index(op.f("ix_players_overall_rating"), "players", ["overall_rating"], unique=False)
    op.create_index(op.f("ix_players_team_id"), "players", ["team_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_players_team_id"), table_name="players")
    op.drop_index(op.f("ix_players_overall_rating"), table_name="players")
    op.drop_index(op.f("ix_players_name"), table_name="players")
    op.drop_table("players")
