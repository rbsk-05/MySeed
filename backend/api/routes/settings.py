from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import string
import asyncio
from typing import Optional
from backend.database.session import get_db
from backend.models.settings import Settings
from backend.schemas.settings import (
    SettingsUpdate,
    SettingsResponse,
    DirectoryBrowseResponse,
    NativeBrowseRequest,
    CreateDirectoryRequest
)

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
    
    # Apply these settings to the torrent engine immediately
    from backend.torrent.engine import torrent_engine
    torrent_engine.apply_session_settings(
        max_active_downloads=settings.max_active_downloads,
        max_download_speed=settings.max_download_speed,
        max_upload_speed=settings.max_upload_speed
    )
    
    return settings

@router.get("/browse-directory", response_model=DirectoryBrowseResponse)
def browse_directory(path: Optional[str] = None, db: Session = Depends(get_db)):
    if not path or not path.strip():
        current_settings = get_or_create_settings(db)
        if current_settings.download_dir and os.path.exists(current_settings.download_dir):
            target_path = current_settings.download_dir
        else:
            target_path = os.path.expanduser("~")
    else:
        target_path = path

    try:
        target_path = os.path.normpath(os.path.abspath(target_path))
        if not os.path.exists(target_path):
            target_path = os.path.expanduser("~")
    except Exception:
        target_path = os.path.expanduser("~")

    parent = os.path.dirname(target_path)
    if parent == target_path:
        parent = None

    drives = []
    for d in string.ascii_uppercase:
        drive_str = f"{d}:\\"
        if os.path.exists(drive_str):
            drives.append(drive_str)

    home = os.path.expanduser("~")
    possible_locations = [
        {"name": "Home", "path": home},
        {"name": "Downloads", "path": os.path.join(home, "Downloads")},
        {"name": "Desktop", "path": os.path.join(home, "Desktop")},
        {"name": "Documents", "path": os.path.join(home, "Documents")},
        {"name": "Videos", "path": os.path.join(home, "Videos")},
    ]
    quick_locations = [loc for loc in possible_locations if os.path.exists(loc["path"])]

    directories = []
    try:
        with os.scandir(target_path) as it:
            for entry in it:
                try:
                    if entry.is_dir(follow_symlinks=False) and not entry.name.startswith(('.', '$')):
                        directories.append(entry.name)
                except Exception:
                    pass
        directories.sort(key=lambda s: s.lower())
    except (PermissionError, Exception):
        pass

    return {
        "current_path": target_path,
        "parent_path": parent,
        "drives": drives,
        "quick_locations": quick_locations,
        "directories": directories
    }

@router.post("/browse-native")
async def browse_native(req: Optional[NativeBrowseRequest] = None, db: Session = Depends(get_db)):
    initial_dir = req.initial_dir if req else None
    if not initial_dir or not os.path.exists(initial_dir):
        current_settings = get_or_create_settings(db)
        initial_dir = current_settings.download_dir or os.path.expanduser("~")

    from backend.utils.folder_picker import pick_folder
    chosen = await asyncio.to_thread(pick_folder, initial_dir)
    return {"path": chosen}

@router.post("/create-directory")
def create_directory(req: CreateDirectoryRequest):
    target_path = os.path.normpath(os.path.abspath(req.path))
    try:
        os.makedirs(target_path, exist_ok=True)
        return {"path": target_path, "success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create folder: {str(e)}")
