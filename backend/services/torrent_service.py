from sqlalchemy.orm import Session
from fastapi import HTTPException
import os

from backend.repositories.torrent_repo import torrent_repo
from backend.torrent.engine import torrent_engine
from backend.schemas.torrent import TorrentCreate, TorrentUpdate
from backend.core.config import settings
from typing import List

class TorrentService:
    def add_magnet(self, db: Session, magnet_uri: str, save_path: str = None):
        try:
            handle = torrent_engine.add_magnet_link(magnet_uri, save_path)
            info_hash = str(handle.info_hash())
            
            # Check if it already exists in DB
            existing = torrent_repo.get_by_info_hash(db, info_hash)
            if existing:
                return existing

            if not save_path:
                from backend.api.routes.settings import get_or_create_settings
                db_settings = get_or_create_settings(db)
                save_path = db_settings.download_dir

            torrent_in = TorrentCreate(
                info_hash=info_hash,
                name=handle.status().name or "Downloading Metadata...",
                save_path=save_path,
                status="downloading",
                is_paused=False
            )
            return torrent_repo.create(db, torrent_in)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def add_file(self, db: Session, file_path: str, save_path: str = None):
        try:
            import shutil
            handle = torrent_engine.add_torrent_file(file_path, save_path)
            info_hash = str(handle.info_hash())
            
            # Save torrent file to persistent store
            storage_dir = "./data/torrents"
            os.makedirs(storage_dir, exist_ok=True)
            persistent_torrent_path = os.path.join(storage_dir, f"{info_hash}.torrent")
            if not os.path.exists(persistent_torrent_path):
                shutil.copyfile(file_path, persistent_torrent_path)
            
            existing = torrent_repo.get_by_info_hash(db, info_hash)
            if existing:
                return existing
                
            if not save_path:
                from backend.api.routes.settings import get_or_create_settings
                db_settings = get_or_create_settings(db)
                save_path = db_settings.download_dir
                
            torrent_in = TorrentCreate(
                info_hash=info_hash,
                name=handle.status().name or "Unknown",
                size=handle.status().total_wanted,
                save_path=save_path,
                status="downloading",
                is_paused=False
            )
            return torrent_repo.create(db, torrent_in)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def restore_torrents(self, db: Session):
        db_torrents = torrent_repo.get_all(db)
        storage_dir = "./data/torrents"
        for db_t in db_torrents:
            if not torrent_engine.get_torrent(db_t.info_hash):
                persistent_torrent_path = os.path.join(storage_dir, f"{db_t.info_hash}.torrent")
                if os.path.exists(persistent_torrent_path):
                    handle = torrent_engine.add_torrent_file(persistent_torrent_path, db_t.save_path)
                    if db_t.is_paused:
                        handle.pause()


    def get_all_torrents(self, db: Session) -> List[dict]:
        db_torrents = torrent_repo.get_all(db)
        results = []
        for db_t in db_torrents:
            stats = torrent_engine.get_status(db_t.info_hash)
            
            # Merge DB info with Live stats
            t_dict = {
                "id": db_t.id,
                "info_hash": db_t.info_hash,
                "name": db_t.name,
                "save_path": db_t.save_path,
                "added_date": db_t.added_date,
                "is_paused": db_t.is_paused,
            }
            
            if stats:
                t_dict.update(stats)
                if "state" in stats:
                    t_dict["status"] = stats["state"]
                # Persist finished/seeding state to DB
                if stats.get("state") in ["finished", "seeding"] and db_t.status != stats.get("state"):
                    torrent_repo.update(db, db_t, TorrentUpdate(status=stats["state"]))
                
                # update name/size in DB if we now have metadata and didn't before
                if db_t.name == "Downloading Metadata..." and stats.get("name"):
                    torrent_repo.update(db, db_t, TorrentUpdate(name=stats["name"], size=stats["size"]))
            else:
                t_dict["status"] = db_t.status
                t_dict["progress"] = 100 if db_t.status in ["finished", "seeding"] else 0
                
            results.append(t_dict)
        return results

    def pause_torrent(self, db: Session, torrent_id: int):
        db_t = torrent_repo.get(db, torrent_id)
        if not db_t:
            raise HTTPException(status_code=404, detail="Torrent not found")
        
        torrent_engine.pause_torrent(db_t.info_hash)
        return torrent_repo.update(db, db_t, TorrentUpdate(is_paused=True, status="paused"))

    def resume_torrent(self, db: Session, torrent_id: int):
        db_t = torrent_repo.get(db, torrent_id)
        if not db_t:
            raise HTTPException(status_code=404, detail="Torrent not found")
            
        torrent_engine.resume_torrent(db_t.info_hash)
        return torrent_repo.update(db, db_t, TorrentUpdate(is_paused=False, status="downloading"))

    def remove_torrent(self, db: Session, torrent_id: int, delete_files: bool = False):
        db_t = torrent_repo.get(db, torrent_id)
        if not db_t:
            raise HTTPException(status_code=404, detail="Torrent not found")
            
        torrent_engine.remove_torrent(db_t.info_hash, delete_files)
        torrent_repo.delete(db, torrent_id)
        return {"success": True}

torrent_service = TorrentService()
