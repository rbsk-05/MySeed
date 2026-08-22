from sqlalchemy import Column, Integer, String, Boolean
from backend.database.session import Base

class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    download_dir = Column(String, default=r"C:\Users\mdars\Downloads")
    max_active_downloads = Column(Integer, default=3)
    max_download_speed = Column(Integer, default=0) # 0 means unlimited
    max_upload_speed = Column(Integer, default=0)
