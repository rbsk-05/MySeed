# Quick Start Commands

### Backend
```powershell
.\venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```powershell
cd frontend
npm run dev
```

### Localtunnel
```powershell
npx localtunnel --port 8000
```

### Docker
```powershell
docker compose up --build -d
```
