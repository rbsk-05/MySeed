import asyncio
from fastapi import WebSocket
from typing import List

from backend.services.torrent_service import torrent_service
from backend.database.session import SessionLocal

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.is_broadcasting = False

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        if not self.is_broadcasting:
            self.is_broadcasting = True
            asyncio.create_task(self.broadcast_loop())

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if not self.active_connections:
            self.is_broadcasting = False

    async def broadcast_loop(self):
        while self.is_broadcasting:
            if not self.active_connections:
                break
                
            db = SessionLocal()
            try:
                # Fetch live stats for all torrents
                torrents = torrent_service.get_all_torrents(db)
                for connection in self.active_connections:
                    try:
                        await connection.send_json(torrents)
                    except Exception:
                        # Handle disconnect if client went away
                        self.disconnect(connection)
            finally:
                db.close()
                
            await asyncio.sleep(1)  # Broadcast every second

manager = ConnectionManager()
