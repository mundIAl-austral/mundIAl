from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.ml import classifier
from app.modules.clubs.clubs_routes import router as clubs_router
from app.modules.players.players_routes import router as players_router
from app.modules.recommendations.recommendations_routes import router as recommendations_router
from app.modules.setup.setup_routes import router as setup_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    classifier.load_model()
    yield


app = FastAPI(
    title="mundIAl API",
    version="0.1.0",
    docs_url="/docs" if settings.env != "production" else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations_router)
app.include_router(setup_router)
app.include_router(players_router)
app.include_router(clubs_router)


@app.get("/health")
async def health() -> dict[str, object]:
    return {"status": "ok", "cors_origins": settings.cors_origins_list}
