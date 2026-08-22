from pydantic import BaseModel

class SettingsUpdate(BaseModel):
    download_dir: str
    max_active_downloads: int
    max_download_speed: int
    max_upload_speed: int

class SettingsResponse(SettingsUpdate):
    id: int

    class Config:
        from_attributes = True
