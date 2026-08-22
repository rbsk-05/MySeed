from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.websocket.manager import manager

router = APIRouter(prefix="/ws", tags=["websocket"])

@router.websocket("/torrents")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We don't expect messages from the client in this one-way stat broadcast
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
