from pydantic import BaseModel


class GetClubsResponse(BaseModel):
    clubs: list[str]
