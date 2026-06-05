from pydantic import BaseModel


class PlayerSuggestionsResponse(BaseModel):
    players: list[str]


class PlayerSearchResponse(BaseModel):
    players: list[str]


class PlayerDetail(BaseModel):
    name: str
    squad_number: int | None
    squad_position: str
    detailed_position: str | None
    alternative_positions: list[str]
    club: str | None
    is_captain: bool
    overall_rating: int
    nationality: str | None
    league: str | None
    age: int | None
    height_cm: int | None
    weight_kg: int | None
    preferred_foot: str | None
    play_styles: list[str]
    photo_url: str | None
    is_estimated: bool
    attributes: dict[str, int]


class SquadResponse(BaseModel):
    team: str
    players: list[PlayerDetail]
