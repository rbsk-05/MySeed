# MySeed

## The Story Behind MySeed

I used standard torrent clients like BitTorrent and uTorrent for years, but on modern Windows systems, third-party clients are constantly flagged by Windows Defender and antivirus solutions as Potentially Unwanted Programs (PUP) or malware. Disabling real-time antivirus protection just to download files is unsafe and not a compromise anyone should have to make. 

Even after whitelisting executables, Windows updates or scanner definitions would repeatedly quarantine or delete them. On top of that, many popular clients have become bloated with bundled installers, intrusive advertisements, and obscure background telemetry.

Rather than compromising system security or fighting antivirus exceptions, I decided to do what any systems engineer does: build my own.

MySeed is a lightweight, transparent, self-hosted BitTorrent client. The core engine is built directly on `libtorrent` (the industry-standard C++ torrent library) with a Python FastAPI backend and a minimalist React web interface. Because you run the source code directly on your local machine, your antivirus does not block it, there are zero ads or telemetry, and you have full control over where your data and database live.

---

## Setup & Usage

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- Git

---

### Option 1: Quick Setup (Automated Unified Launcher)

This is the fastest way to get started.

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/myseed.git
   cd myseed
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Build the frontend web UI:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

5. Run the application:
   ```bash
   python app_launcher.py
   ```
   The engine starts locally on `http://localhost:8000` and automatically opens your default web browser.

---

### Option 2: Step-by-Step Development Mode

Use this option if you want to inspect or modify the code with live reloading.

1. Start the Backend API (Terminal 1):
   ```bash
   .\venv\Scripts\Activate.ps1
   python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Start the Frontend Development Server (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```
   Open `http://localhost:5173` in your browser for hot-reload development.

---

### Option 3: Docker Container

If you prefer running in an isolated container without installing Python or Node.js locally:

1. Build and run via Docker Compose:
   ```bash
   docker compose up -d --build
   ```

2. Open `http://localhost:8000` in your browser.

3. To stop the container:
   ```bash
   docker compose down
   ```

---

### Option 4: Standalone Executable (Windows)

To package the entire engine and web interface into a single portable `.exe`:

1. Ensure the frontend is built (`cd frontend && npm run build && cd ..`).
2. Run PyInstaller:
   ```bash
   pip install pyinstaller
   pyinstaller --noconfirm MySeed.spec
   ```
3. Your standalone executable will be located in the `dist/` directory.

---

## Data & Privacy

- **Database**: SQLite database is automatically created in `%LOCALAPPDATA%\MySeed\torrent_downloader.db` on Windows (or user home on Linux/macOS), ensuring the repository folder stays clean.
- **Downloads**: Defaults to your operating system's standard `Downloads` folder, but can be customized at any time through the in-app directory browser in Settings.
- **Telemetry**: Zero external network requests outside of peer-to-peer torrent swarms.
