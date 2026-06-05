import uuid
from typing import Any

from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Team(Base, TimestampMixin):
    __tablename__ = "teams"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    fifa_ranking: Mapped[int] = mapped_column(Integer, nullable=False)
    confederation: Mapped[str] = mapped_column(String(20), nullable=False)
    rival_team_names: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    key_players: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    star_power: Mapped[float] = mapped_column(Float, nullable=False, default=5.0)
    narrative_flags: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    playstyles_defence: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, default=list
    )
    playstyles_midfield: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, default=list
    )
    playstyles_forwards: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, default=list
    )

    home_matches: Mapped[list["Match"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Match", foreign_keys="Match.team_a_id", back_populates="team_a"
    )
    away_matches: Mapped[list["Match"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Match", foreign_keys="Match.team_b_id", back_populates="team_b"
    )
    players: Mapped[list["Player"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Player", back_populates="team", cascade="all, delete-orphan"
    )
