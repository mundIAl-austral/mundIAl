from __future__ import annotations

import json
from pathlib import Path
from zoneinfo import available_timezones

from app.db.models.team import Team
from app.ml.feature_engineering import _CONFEDERATION_COUNTRIES
from app.modules.catalog.catalog_schemas import CatalogCountry, CatalogTeam, CatalogTimezone

SEED_DIR = Path(__file__).resolve().parents[2] / "seed"
_TIMEZONE_PREFIXES = ("America/", "Europe/", "Africa/", "Asia/", "Pacific/")


def load_seed_teams() -> list[CatalogTeam]:
    raw = json.loads((SEED_DIR / "teams.json").read_text())
    return [CatalogTeam(name=item["name"], confederation=item["confederation"]) for item in raw]


def load_seed_players() -> list[str]:
    raw = json.loads((SEED_DIR / "teams.json").read_text())
    unique: set[str] = {
        player.strip()
        for item in raw
        for player in item.get("key_players", [])
        if player and player.strip()
    }
    return sorted(unique)


def catalog_teams_from_db(teams: list[Team]) -> list[CatalogTeam]:
    return [CatalogTeam(name=team.name, confederation=team.confederation) for team in teams]


def country_options() -> list[CatalogCountry]:
    codes = sorted(
        {code for conf_codes in _CONFEDERATION_COUNTRIES.values() for code in conf_codes}
    )
    return [CatalogCountry(code=code, label=code) for code in codes]


def timezone_options() -> list[CatalogTimezone]:
    tz_values = sorted(
        tz for tz in available_timezones() if tz == "UTC" or tz.startswith(_TIMEZONE_PREFIXES)
    )
    if len(tz_values) > 400:
        tz_values = tz_values[:400]
    if "UTC" not in tz_values:
        tz_values = ["UTC", *tz_values]
    return [CatalogTimezone(value=v, label=v.replace("_", " ")) for v in tz_values]
