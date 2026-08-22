@echo off
title Torrent Downloader Launcher
echo ==================================================
echo         Torrent Downloader Launcher
echo ==================================================
echo.

:: Check virtual environment
if exist "venv\Scripts\python.exe" goto check_frontend
echo [ERROR] Python virtual environment (venv) not found!
echo Please make sure venv is created at the project root.
pause
exit /b

:check_frontend
:: Check if frontend is built
if exist "frontend\dist\index.html" goto start_backend
echo [INFO] Frontend build not found. Building frontend now...
cd frontend

if exist "node_modules" goto build_only
echo [INFO] Installing frontend dependencies...
call npm install

:build_only
echo [INFO] Building frontend production bundle...
call npm run build
cd ..

:start_backend
:: Start Backend in a new window
echo [INFO] Starting Backend Server on http://localhost:8000...
start "Torrent Downloader Backend" cmd /c ".\venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"

echo.
echo ==================================================
echo  Backend is running at http://localhost:8000
echo ==================================================
echo.

:: Ask for public link
set /p choice="Do you want to generate a public link to access it from anywhere? (y/n): "
if /I "%choice%"=="y" goto start_tunnel
goto wait_exit

:start_tunnel
echo [INFO] Starting Localtunnel on port 8000...
echo.
echo --------------------------------------------------
echo Copy the public URL generated below to your devices!
echo --------------------------------------------------
npx localtunnel --port 8000
exit /b

:wait_exit
echo.
echo Press any key to stop the server and exit launcher...
pause > nul
taskkill /FI "WINDOWTITLE eq Torrent Downloader Backend*" /F > nul 2>&1
