from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os

from backend.database.session import get_db
from backend.services.torrent_service import torrent_service
from backend.schemas.torrent import TorrentResponse
from backend.core.config import settings

router = APIRouter(prefix="/torrents", tags=["torrents"])

@router.post("/upload", response_model=TorrentResponse)
async def upload_torrent(
    file: UploadFile = File(...),
    save_path: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.torrent'):
        raise HTTPException(status_code=400, detail="Must be a .torrent file")
        
    temp_dir = "./temp"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        torrent = torrent_service.add_file(db, temp_path, save_path)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
    return torrent

@router.post("/magnet", response_model=TorrentResponse)
async def add_magnet(
    magnet_uri: str = Form(...),
    save_path: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if not magnet_uri.startswith("magnet:?"):
        raise HTTPException(status_code=400, detail="Invalid magnet URI")
        
    return torrent_service.add_magnet(db, magnet_uri, save_path)

@router.get("", response_model=List[TorrentResponse])
async def get_torrents(db: Session = Depends(get_db)):
    return torrent_service.get_all_torrents(db)

@router.post("/{torrent_id}/pause", response_model=TorrentResponse)
async def pause_torrent(torrent_id: int, db: Session = Depends(get_db)):
    return torrent_service.pause_torrent(db, torrent_id)

@router.post("/{torrent_id}/resume", response_model=TorrentResponse)
async def resume_torrent(torrent_id: int, db: Session = Depends(get_db)):
    return torrent_service.resume_torrent(db, torrent_id)

@router.delete("/{torrent_id}")
async def delete_torrent(
    torrent_id: int, 
    delete_files: bool = False,
    db: Session = Depends(get_db)
):
    return torrent_service.remove_torrent(db, torrent_id, delete_files)
