@echo off
title Torrent Downloader Launcher
echo ==================================================
echo         Torrent Downloader Launcher
echo ==================================================
echo.

:: Check if virtual environment exists
if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Python virtual environment (venv) not found!
    echo Please make sure venv is created at the project root.
    pause
    exit /b
)

:: Check if frontend is built
if not exist "frontend\dist\index.html" (
    echo [INFO] Frontend build not found. Building frontend now...
    cd frontend
    if not exist "node_modules" (
        echo [INFO] Installing frontend dependencies...
        call npm install
    )
    echo [INFO] Building frontend production bundle...
    call npm run build
    cd ..
)

:: Start Backend in a new window (it will serve the frontend too!)
echo [INFO] Starting Backend Server on http://localhost:8000...
start "Torrent Downloader Backend" cmd /c ".\venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"

echo.
echo ==================================================
echo  Backend is running at http://localhost:8000
echo ==================================================
echo.

:: Ask if user wants a public link (localtunnel)
set /p choice="Do you want to generate a public link to access it from anywhere? (y/n): "
if /I "%choice%"=="y" (
    echo [INFO] Starting Localtunnel on port 8000...
    echo.
    echo --------------------------------------------------
    echo Copy the public URL generated below to your devices!
    echo --------------------------------------------------
    npx localtunnel --port 8000
) else (
    echo.
    echo Press any key to stop the server and exit launcher...
    pause > nul
    taskkill /FI "WINDOWTITLE eq Torrent Downloader Backend*" /F > nul 2>&1
)
