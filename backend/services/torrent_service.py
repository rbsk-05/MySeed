from sqlalchemy.orm import Session
from fastapi import HTTPException
import os
import shutil
import libtorrent as lt

from backend.repositories.torrent_repo import torrent_repo
from backend.torrent.engine import torrent_engine
from backend.schemas.torrent import TorrentCreate, TorrentUpdate
from backend.core.config import settings
from typing import List

class TorrentService:
    def add_magnet(self, db: Session, magnet_uri: str, save_path: str = None):
        try:
            if not save_path:
                from backend.api.routes.settings import get_or_create_settings
                db_settings = get_or_create_settings(db)
                save_path = db_settings.download_dir or settings.DEFAULT_DOWNLOAD_DIR

            os.makedirs(save_path, exist_ok=True)

            handle = torrent_engine.add_magnet_link(magnet_uri, save_path)
            handle.resume()
            info_hash = str(handle.info_hash())
            
            # Check if it already exists in DB
            existing = torrent_repo.get_by_info_hash(db, info_hash)
            if existing:
                if existing.is_paused:
                    torrent_repo.update(db, existing, TorrentUpdate(is_paused=False, status="downloading"))
                return existing

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
            if not save_path:
                from backend.api.routes.settings import get_or_create_settings
                db_settings = get_or_create_settings(db)
                save_path = db_settings.download_dir or settings.DEFAULT_DOWNLOAD_DIR
                
            os.makedirs(save_path, exist_ok=True)

            # Read torrent metadata directly from file
            info = lt.torrent_info(file_path)
            name = info.name() or "Unknown"
            size = info.total_size()

            handle = torrent_engine.add_torrent_file(file_path, save_path)
            handle.resume()
            info_hash = str(handle.info_hash())
            
            # Save torrent file to persistent store
            storage_dir = "./data/torrents"
            os.makedirs(storage_dir, exist_ok=True)
            persistent_torrent_path = os.path.join(storage_dir, f"{info_hash}.torrent")
            if not os.path.exists(persistent_torrent_path):
                shutil.copyfile(file_path, persistent_torrent_path)
            
            existing = torrent_repo.get_by_info_hash(db, info_hash)
            if existing:
                if existing.is_paused:
                    torrent_repo.update(db, existing, TorrentUpdate(is_paused=False, status="downloading"))
                return existing

            torrent_in = TorrentCreate(
                info_hash=info_hash,
                name=name,
                size=size,
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
            
            added_date_str = db_t.added_date.isoformat() if db_t.added_date else None

            # Merge DB info with Live stats
            t_dict = {
                "id": db_t.id,
                "info_hash": db_t.info_hash,
                "name": db_t.name,
                "size": db_t.size or 0,
                "save_path": db_t.save_path,
                "added_date": added_date_str,
                "is_paused": db_t.is_paused,
                "status": db_t.status,
                "progress": 0.0,
                "download_speed": 0,
                "upload_speed": 0,
                "eta": 0,
                "peers": 0,
                "seeds": 0,
                "downloaded": 0,
                "uploaded": 0,
                "state": None,
                "error": None
            }

            if stats:
                is_p = stats.get("is_paused", db_t.is_paused) or stats.get("state") == "paused"
                t_dict.update({
                    "name": stats["name"] if stats.get("name") and stats.get("name") != "Downloading Metadata..." else db_t.name,
                    "progress": stats.get("progress", 0.0),
                    "download_speed": stats.get("download_speed", 0),
                    "upload_speed": stats.get("upload_speed", 0),
                    "eta": stats.get("eta", 0),
                    "peers": stats.get("peers", 0),
                    "seeds": stats.get("seeds", 0),
                    "downloaded": stats.get("downloaded", 0),
                    "uploaded": stats.get("uploaded", 0),
                    "state": stats.get("state", db_t.status),
                    "is_paused": is_p,
                    "error": stats.get("error"),
                    "status": "paused" if is_p else stats.get("state", db_t.status)
                })
                # If size wasn't set, update from engine
                if (not db_t.size or db_t.size == 0) and stats.get("size"):
                    db_t.size = stats["size"]
                    t_dict["size"] = stats["size"]
                    torrent_repo.update(db, db_t, TorrentUpdate(size=stats["size"]))

                # Update name in DB if metadata arrived
                if (db_t.name == "Downloading Metadata..." or not db_t.name) and stats["name"] and stats["name"] != "Downloading Metadata...":
                    db_t.name = stats["name"]
                    torrent_repo.update(db, db_t, TorrentUpdate(name=stats["name"]))

            results.append(t_dict)
        return results

    def pause_torrent(self, db: Session, torrent_id: int):
        torrent = torrent_repo.get(db, torrent_id)
        if not torrent:
            raise HTTPException(status_code=404, detail="Torrent not found")
        torrent_engine.pause_torrent(torrent.info_hash)
        return torrent_repo.update(db, torrent, TorrentUpdate(is_paused=True, status="paused"))

    def resume_torrent(self, db: Session, torrent_id: int):
        torrent = torrent_repo.get(db, torrent_id)
        if not torrent:
            raise HTTPException(status_code=404, detail="Torrent not found")
        torrent_engine.resume_torrent(torrent.info_hash)
        return torrent_repo.update(db, torrent, TorrentUpdate(is_paused=False, status="downloading"))

    def remove_torrent(self, db: Session, torrent_id: int, delete_files: bool = False):
        torrent = torrent_repo.get(db, torrent_id)
        if not torrent:
            raise HTTPException(status_code=404, detail="Torrent not found")
        
        # 1. Ask engine to remove torrent from session (and trigger libtorrent file deletion)
        torrent_engine.remove_torrent(torrent.info_hash, delete_files)

        # 2. If delete_files requested, physically remove content directory/files from save_path
        if delete_files and torrent.save_path and os.path.exists(torrent.save_path):
            try:
                if torrent.name and torrent.name != "Downloading Metadata...":
                    import glob
                    exact_path = os.path.join(torrent.save_path, torrent.name)
                    if os.path.isdir(exact_path):
                        shutil.rmtree(exact_path, ignore_errors=True)
                    elif os.path.isfile(exact_path):
                        try:
                            os.remove(exact_path)
                        except Exception:
                            pass
                    
                    # Pattern matches for single files, extensions, and partfiles
                    for m in glob.glob(os.path.join(torrent.save_path, torrent.name + "*")):
                        try:
                            if os.path.isdir(m):
                                shutil.rmtree(m, ignore_errors=True)
                            elif os.path.isfile(m):
                                os.remove(m)
                        except Exception:
                            pass
                    
                    # Hidden dot-files/partfiles matching .<name>*
                    for m in glob.glob(os.path.join(torrent.save_path, "." + torrent.name + "*")):
                        try:
                            if os.path.isdir(m):
                                shutil.rmtree(m, ignore_errors=True)
                            elif os.path.isfile(m):
                                os.remove(m)
                        except Exception:
                            pass
            except Exception:
                pass

        # 3. Remove persistent .torrent metadata file
        storage_dir = "./data/torrents"
        persistent_torrent_path = os.path.join(storage_dir, f"{torrent.info_hash}.torrent")
        if os.path.exists(persistent_torrent_path):
            try:
                os.remove(persistent_torrent_path)
            except Exception:
                pass

        # 4. Remove DB record
        torrent_repo.delete(db, torrent_id=torrent_id)
        return {"id": torrent_id, "message": "Torrent deleted successfully"}

torrent_service = TorrentService()
