from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models.settings import Settings
from backend.schemas.settings import SettingsUpdate, SettingsResponse

router = APIRouter(prefix="/settings", tags=["settings"])

def get_or_create_settings(db: Session) -> Settings:
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    return get_or_create_settings(db)

@router.put("", response_model=SettingsResponse)
def update_settings(
    settings_in: SettingsUpdate,
    db: Session = Depends(get_db)
):
    settings = get_or_create_settings(db)
    settings.download_dir = settings_in.download_dir
    settings.max_active_downloads = settings_in.max_active_downloads
    settings.max_download_speed = settings_in.max_download_speed
    settings.max_upload_speed = settings_in.max_upload_speed
    
    db.commit()
    db.refresh(settings)
    
    # Ideally, apply these settings to the torrent engine immediately
    from backend.torrent.engine import torrent_engine
    # torrent_engine.update_settings(settings)
    
    return settings
