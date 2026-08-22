from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TorrentBase(BaseModel):
    info_hash: str
    name: str
    size: int = 0
    save_path: str
    status: Optional[str] = "downloading"
    is_paused: bool = False

class TorrentCreate(TorrentBase):
    pass

class TorrentUpdate(BaseModel):
    status: Optional[str] = None
    is_paused: Optional[bool] = None

class TorrentResponse(TorrentBase):
    id: int
    added_date: datetime
    status: str
    
    # Live stats (populated from libtorrent, not DB)
    progress: float = 0.0
    download_speed: int = 0
    upload_speed: int = 0
    eta: int = 0
    peers: int = 0
    seeds: int = 0
    downloaded: int = 0
    uploaded: int = 0

    class Config:
        from_attributes = True
