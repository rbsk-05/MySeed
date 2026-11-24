import subprocess
import sys
import os
import time
import socket
import urllib.request
import threading
import re
import webbrowser

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        return s.getsockname()[0]
    except Exception:
        return '127.0.0.1'
    finally:
        s.close()

def get_public_ip():
    try:
        req = urllib.request.Request("https://api.ipify.org", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            return resp.read().decode('utf-8').strip()
    except Exception:
        return None

def copy_to_clipboard(text):
    try:
        subprocess.run(
            ["powershell", "-NoProfile", "-Command", f"Set-Clipboard -Value '{text}'"],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception:
        pass

def is_server_ready(port=8000):
    try:
        with urllib.request.urlopen(f"http://localhost:{port}/api/settings", timeout=1) as resp:
            return resp.status == 200
    except Exception:
        return False

def open_browser(url):
    chrome_paths = [
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
    ]
    for p in chrome_paths:
        if os.path.exists(p):
            try:
                subprocess.Popen([p, url])
                return
            except Exception:
                pass
    try:
        os.startfile(url)
    except Exception:
        webbrowser.open(url)

def main():
    try:
        sys.stdout.reconfigure(line_buffering=True)
    except Exception:
        pass

    try:
        os.system("title MySeed Launcher")
    except Exception:
        pass

    print("=" * 62, flush=True)
    print("                      MySeed", flush=True)
    print("=" * 62, flush=True)

    server_proc = None
    if is_server_ready(8000):
        print("\n[1/3] MySeed engine is already running on port 8000.", flush=True)
    else:
        print("\n[1/3] Starting MySeed engine on port 8000...", flush=True)
        server_cmd = [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
        server_proc = subprocess.Popen(
            server_cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
        )

        ready = False
        for _ in range(30):
            if is_server_ready(8000):
                ready = True
                break
            time.sleep(0.3)

        if not ready:
            print("\n[ERROR] MySeed engine failed to start.", flush=True)
            if server_proc:
                server_proc.terminate()
            input("\nPress Enter to exit...")
            return

    print("[2/3] MySeed engine is LIVE and healthy!", flush=True)
    local_ip = get_local_ip()

    # Automatically launch Google Chrome directly into the app (0 latency, 0 passwords!)
    print("[3/3] Opening Google Chrome directly to MySeed...", flush=True)
    open_browser("http://localhost:8000")

    print("\n" + "=" * 62, flush=True)
    print("   MySeed is ready! Chrome opened automatically.", flush=True)
    print("=" * 62, flush=True)
    print(f"\nThis Computer:          http://localhost:8000")
    print(f"Phone / Home Wi-Fi:     http://{local_ip}:8000  (Zero passwords needed)")
    print("\n------------------------------------------------------------")
    print("Starting public internet tunnel in background...")

    lt_proc_ref = [None]
    def run_tunnel():
        try:
            public_ip = get_public_ip()
            if public_ip:
                copy_to_clipboard(public_ip)

            cmd = ["cmd.exe", "/c", "npx -y localtunnel --port 8000"]
            lt_proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            lt_proc_ref[0] = lt_proc
            for line in lt_proc.stdout:
                m = re.search(r'https://[a-zA-Z0-9-]+\.loca\.lt', line)
                if m:
                    tunnel_url = m.group(0)
                    print(f"\nPublic Internet URL:    {tunnel_url}")
                    if public_ip:
                        print(f"Tunnel Password (IP):   {public_ip}  (Copied to your clipboard!)")
                    print("\n[TIP] Everything is running! Press Ctrl+C in this window to stop.")
                    break
        except Exception:
            pass

    tunnel_thread = threading.Thread(target=run_tunnel, daemon=True)
    tunnel_thread.start()

    try:
        while True:
            if server_proc and server_proc.poll() is not None:
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nShutting down CineTorrent...")
    finally:
        if server_proc:
            server_proc.terminate()
        if lt_proc_ref[0]:
            try:
                lt_proc_ref[0].terminate()
            except Exception:
                pass
        print("Goodbye!")

if __name__ == "__main__":
    main()
