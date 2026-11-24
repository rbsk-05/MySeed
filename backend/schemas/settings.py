from pydantic import BaseModel
from typing import Optional, List

class SettingsUpdate(BaseModel):
    download_dir: str
    max_active_downloads: int
    max_download_speed: int
    max_upload_speed: int

class SettingsResponse(SettingsUpdate):
    id: int

    class Config:
        from_attributes = True

class QuickLocation(BaseModel):
    name: str
    path: str

class DirectoryBrowseResponse(BaseModel):
    current_path: str
    parent_path: Optional[str] = None
    drives: List[str]
    quick_locations: List[QuickLocation]
    directories: List[str]

class NativeBrowseRequest(BaseModel):
    initial_dir: Optional[str] = None

class CreateDirectoryRequest(BaseModel):
    path: str
