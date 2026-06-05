from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.clubs import clubs_service
from app.modules.clubs.clubs_schemas import GetClubsResponse

router = APIRouter(prefix="/api/v1/clubs", tags=["clubs"])


@router.get(
    "/suggestions",
    response_model=GetClubsResponse,
    summary="List clubs",
    description="Paginated club names, optionally filtered by a case-insensitive name prefix.",
)
async def get_clubs(
    db: Annotated[AsyncSession, Depends(get_db)],
    prefix: Annotated[str, Query(description="Case-insensitive name prefix")] = "",
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> GetClubsResponse:
    return await clubs_service.get_clubs(db, prefix, limit, offset)
