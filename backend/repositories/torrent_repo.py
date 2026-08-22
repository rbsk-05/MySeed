from sqlalchemy.orm import Session
from backend.models.torrent import TorrentModel
from backend.schemas.torrent import TorrentCreate, TorrentUpdate
from typing import List, Optional

class TorrentRepository:
    def get(self, db: Session, torrent_id: int) -> Optional[TorrentModel]:
        return db.query(TorrentModel).filter(TorrentModel.id == torrent_id).first()

    def get_by_info_hash(self, db: Session, info_hash: str) -> Optional[TorrentModel]:
        return db.query(TorrentModel).filter(TorrentModel.info_hash == info_hash).first()

    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[TorrentModel]:
        return db.query(TorrentModel).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: TorrentCreate) -> TorrentModel:
        db_obj = TorrentModel(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: TorrentModel, obj_in: TorrentUpdate) -> TorrentModel:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, torrent_id: int) -> TorrentModel:
        obj = db.query(TorrentModel).get(torrent_id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

torrent_repo = TorrentRepository()
