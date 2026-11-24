import sys
import os
import time
import socket
import threading
import webbrowser
import urllib.request
import uvicorn

def is_port_in_use(port: int = 8000) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def open_browser_when_ready(url: str, check_url: str):
    for _ in range(60):
        try:
            with urllib.request.urlopen(check_url, timeout=0.5) as resp:
                if resp.status == 200:
                    time.sleep(0.3)
                    webbrowser.open(url)
                    return
        except Exception:
            pass
        time.sleep(0.2)
    webbrowser.open(url)

def main():
    try:
        sys.stdout.reconfigure(line_buffering=True)
    except Exception:
        pass

    try:
        os.system("title MySeed Torrent Client")
    except Exception:
        pass

    target_url = "http://localhost:8000"
    health_url = "http://localhost:8000/api/settings"

    if is_port_in_use(8000):
        print("=" * 60)
        print("                 MySeed Torrent Client")
        print("=" * 60)
        print("\n[INFO] MySeed is already running!")
        print(f"[INFO] Opening web interface: {target_url}\n")
        webbrowser.open(target_url)
        time.sleep(2)
        return

    print("=" * 60)
    print("                 MySeed Torrent Client")
    print("=" * 60)
    print(f"\n • Starting local engine on {target_url}...")
    print(" • Opening your web browser automatically...")
    print(" • Close this window or press Ctrl+C to stop MySeed.\n")
    print("=" * 60 + "\n")

    # Start browser opener in background thread
    opener_thread = threading.Thread(
        target=open_browser_when_ready,
        args=(target_url, health_url),
        daemon=True
    )
    opener_thread.start()

    from backend.main import app
    from backend.core.config import settings

    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        log_level="warning",
        access_log=False
    )

if __name__ == "__main__":
    main()
