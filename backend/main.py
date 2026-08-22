import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.core.config import settings
from backend.database.session import Base, engine
from backend.api.routes import torrents, ws, auth, settings as app_settings
from backend.torrent.engine import torrent_engine
from backend.database.session import SessionLocal
from backend.api.dependencies import get_current_user

# Initialize Database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    db = SessionLocal()
    try:
        auth.init_default_user(db)
        from backend.services.torrent_service import torrent_service
        torrent_service.restore_torrents(db)
    finally:
        db.close()
    yield
    # Shutdown
    if torrent_engine._instance:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev only, should be restricted in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(app_settings.router, prefix=settings.API_V1_STR, dependencies=[Depends(get_current_user)])
app.include_router(torrents.router, prefix=settings.API_V1_STR, dependencies=[Depends(get_current_user)])
app.include_router(ws.router, prefix=settings.API_V1_STR)

# Serve the compiled React frontend natively
import os
from fastapi.staticfiles import StaticFiles

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

# Root route removed in favor of React StaticFiles
if __name__ == "__main__":
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
