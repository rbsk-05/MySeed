import asyncio
import logging
from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder
from typing import List

from backend.services.torrent_service import torrent_service
from backend.database.session import SessionLocal

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.is_broadcasting = False

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        # Immediately push initial data to the newly connected client
        try:
            db = SessionLocal()
            try:
                torrents = torrent_service.get_all_torrents(db)
                await websocket.send_json(jsonable_encoder(torrents))
            finally:
                db.close()
        except Exception as e:
            logger.warning(f"Error sending initial stats to WebSocket client: {e}")

        if not self.is_broadcasting:
            self.is_broadcasting = True
            asyncio.create_task(self.broadcast_loop())

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if not self.active_connections:
            self.is_broadcasting = False

    async def broadcast_loop(self):
        try:
            while self.is_broadcasting and self.active_connections:
                await asyncio.sleep(1)  # Broadcast every second
                if not self.active_connections:
                    break
                    
                db = SessionLocal()
                try:
                    torrents = torrent_service.get_all_torrents(db)
                    payload = jsonable_encoder(torrents)
                except Exception as e:
                    logger.error(f"Error fetching torrent stats for broadcast: {e}")
                    payload = None
                finally:
                    db.close()

                if payload is not None:
                    # Safely iterate over a copy of active connections
                    for connection in list(self.active_connections):
                        try:
                            await connection.send_json(payload)
                        except Exception:
                            self.disconnect(connection)
        finally:
            self.is_broadcasting = False

manager = ConnectionManager()
