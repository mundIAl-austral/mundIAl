from pydantic import BaseModel


class GetClubsResponse(BaseModel):
    clubs: list[str]
    total: int
    limit: int
    offset: int
