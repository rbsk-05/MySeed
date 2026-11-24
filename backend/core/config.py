import os
import sys
import shutil
from pydantic_settings import BaseSettings

def get_app_data_dir() -> str:
    app_data = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
    data_dir = os.path.join(app_data, "MySeed")
    os.makedirs(data_dir, exist_ok=True)
    return data_dir

def get_database_url() -> str:
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL")
    
    # Store in LocalAppData\MySeed for true standalone portability
    data_dir = get_app_data_dir()
    target_db = os.path.join(data_dir, "torrent_downloader.db")
    
    # If local db exists in current folder and target does not, copy it
    local_db = os.path.abspath("torrent_downloader.db")
    if os.path.exists(local_db) and not os.path.exists(target_db):
        try:
            shutil.copy2(local_db, target_db)
        except Exception:
            pass

    norm_path = target_db.replace("\\", "/")
    return f"sqlite:///{norm_path}"

class Settings(BaseSettings):
    PROJECT_NAME: str = "MySeed"
    API_V1_STR: str = "/api"
    
    # SQLite Database stored in user LocalAppData
    DATABASE_URL: str = get_database_url()
    
    # Torrents
    DEFAULT_DOWNLOAD_DIR: str = os.getenv("DOWNLOAD_DIR", os.path.join(os.path.expanduser("~"), "Downloads"))

    @property
    def TORRENTS_STORAGE_DIR(self) -> str:
        d = os.path.join(get_app_data_dir(), "torrents")
        os.makedirs(d, exist_ok=True)
        # Migrate from local ./data/torrents if exists
        local_data = os.path.abspath("data/torrents")
        if os.path.isdir(local_data):
            for item in os.listdir(local_data):
                src = os.path.join(local_data, item)
                dst = os.path.join(d, item)
                if os.path.isfile(src) and not os.path.exists(dst):
                    try:
                        shutil.copy2(src, dst)
                    except Exception:
                        pass
        return d

    @property
    def TEMP_DIR(self) -> str:
        d = os.path.join(get_app_data_dir(), "temp")
        os.makedirs(d, exist_ok=True)
        return d
    
    # App config
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
