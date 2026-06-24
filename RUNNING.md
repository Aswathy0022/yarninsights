# Run Frontend + Backend

## Backend (FastAPI, port 8000)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env         # edit JWT_SECRET, admin creds, etc.
python -m app.db.init_db     # init DB
uvicorn app.main:app --reload --port 8000
```

API base: `http://localhost:8000/api`

## Frontend (Vite + React, port 5173)

```bash
cd frontend
npm install
cp .env.example .env         # VITE_API_BASE_URL=http://localhost:8000/api
npm run dev
```

App: `http://localhost:5173`

## Notes

- Backend `.env`: `CORS_ALLOWED_ORIGINS` must include frontend origin (`http://localhost:5173`).
- Run backend before frontend (frontend calls backend API).
- Legacy Streamlit app (`app.py`, root) is separate old stack — not part of this frontend/backend pair.
