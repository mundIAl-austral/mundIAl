import uuid

from sqlalchemy import Float, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Club(Base, TimestampMixin):
    __tablename__ = "clubs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    grl_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    playstyles_defence: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    playstyles_midfield: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, default=list
    )
    playstyles_forwards: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, default=list
    )
