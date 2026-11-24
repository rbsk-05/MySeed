import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MySeed"
    API_V1_STR: str = "/api"
    
    # SQLite Database
    DATABASE_URL: str = "sqlite:///./torrent_downloader.db"
    
    # Torrents
    DEFAULT_DOWNLOAD_DIR: str = os.getenv("DOWNLOAD_DIR", r"C:\Users\mdars\Downloads")
    
    # App config
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
