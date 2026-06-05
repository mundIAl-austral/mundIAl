from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.players import players_service
from app.modules.players.players_schemas import (
    PlayerSearchResponse,
    PlayerSuggestionsResponse,
    SquadResponse,
)

router = APIRouter(prefix="/api/v1/players", tags=["players"])


@router.get("/suggestions", response_model=PlayerSuggestionsResponse)
async def get_suggestions(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PlayerSuggestionsResponse:
    return await players_service.get_suggestions(db)


@router.get("/search", response_model=PlayerSearchResponse)
async def search_players(
    db: Annotated[AsyncSession, Depends(get_db)],
    q: Annotated[str, Query(min_length=2, description="Search query (min 2 chars)")],
    limit: Annotated[int, Query(ge=1, le=20)] = 8,
) -> PlayerSearchResponse:
    return await players_service.search_players(q, limit, db)


@router.get("/squad/{team_name}", response_model=SquadResponse)
async def get_squad(
    team_name: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SquadResponse:
    return await players_service.get_squad(team_name, db)
