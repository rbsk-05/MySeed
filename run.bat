@echo off
title MySeed Launcher
cd /d "%~dp0"

if not exist venv\Scripts\python.exe goto no_venv
if not exist frontend\dist\index.html goto build_frontend
goto start_launcher

:build_frontend
echo [INFO] Building frontend bundle...
cd frontend
if not exist node_modules call npm install
call npm run build
cd ..

:start_launcher
.\venv\Scripts\python.exe -u launcher.py
if errorlevel 1 pause
exit /b

:no_venv
echo [ERROR] Python virtual environment (venv) not found!
pause
exit /b
