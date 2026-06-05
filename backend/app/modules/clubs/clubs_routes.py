from fastapi import APIRouter

from app.modules.clubs.clubs_schemas import GetClubsResponse
from app.modules.clubs.clubs_service import get_clubs_list

router = APIRouter(prefix="/api/v1/clubs", tags=["clubs"])


@router.get(
    "/suggestions",
    response_model=GetClubsResponse,
    summary="Get all clubs",
    description="Returns a list of all clubs with their playstyles.",
)
async def get_clubs() -> GetClubsResponse:
    """Get all clubs available in the system."""
    clubs = await get_clubs_list()
    return GetClubsResponse(clubs=clubs)
