import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Player(Base, TimestampMixin):
    __tablename__ = "players"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Relation to the national squad (nation) the player was called up for.
    # This is squad_nation in the source data — it can differ from `nationality`
    # for naturalized players, so the FK is driven by squad_nation, not Nation.
    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    squad_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    squad_position: Mapped[str] = mapped_column(String(3), nullable=False)  # GK/DF/MF/FW
    detailed_position: Mapped[str | None] = mapped_column(String(10), nullable=True)  # e.g. CB, ST
    alternative_positions: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, default=list
    )
    club: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_captain: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    overall_rating: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # OVR
    nationality: Mapped[str | None] = mapped_column(String(60), nullable=True)  # actual nationality
    league: Mapped[str | None] = mapped_column(String(80), nullable=True)

    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height_cm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[int | None] = mapped_column(Integer, nullable=True)
    preferred_foot: Mapped[str | None] = mapped_column(String(10), nullable=True)

    play_styles: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    photo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_estimated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Full EA FC26 numeric ratings (face stats + detailed attributes), normalized
    # to snake_case keys. Stored as JSONB because they are never queried field by
    # field — they travel with the player for display / scoring.
    attributes: Mapped[dict[str, int]] = mapped_column(JSONB, nullable=False, default=dict)

    team: Mapped["Team"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Team", back_populates="players"
    )
