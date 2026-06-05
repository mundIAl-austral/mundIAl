from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.matches import matches_service
from app.modules.matches.matches_schemas import GetMatchDetailInput, MatchDetailResponse

router = APIRouter(prefix="/api/v1/matches", tags=["matches"])


@router.get("/{match_id}", response_model=MatchDetailResponse)
async def get_match_detail(
    match_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MatchDetailResponse:
    output = await matches_service.get_match_detail(GetMatchDetailInput(match_id=match_id), db)
    return output.match
