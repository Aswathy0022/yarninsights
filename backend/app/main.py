from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ALLOWED_ORIGINS
from app.ml.training import train_yarn_models
from app.routers import admin, auth, batches, bulk, dashboard, predictions, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Retrain from CSV at every process startup (BRD FR-7) — no persisted model artifact.
    app.state.model_registry = train_yarn_models()
    yield


app = FastAPI(title="YarnInsight API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(predictions.router)
app.include_router(batches.router)
app.include_router(bulk.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    registry = getattr(app.state, "model_registry", None)
    return {"status": "ok", "model_trained": registry is not None}
