from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
import datetime

from backend.database.session import Base

class TorrentModel(Base):
    __tablename__ = "torrents"

    id = Column(Integer, primary_key=True, index=True)
    info_hash = Column(String(40), unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    size = Column(Integer, default=0)
    save_path = Column(String, nullable=False)
    added_date = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    status = Column(String, default="downloading")  # e.g., downloading, seeding, paused, error
    
    # We store minimal state in the DB because libtorrent handles the actual resuming.
    # The DB is mainly for UI tracking of what torrents are added, and their configuration.
    is_paused = Column(Boolean, default=False)
