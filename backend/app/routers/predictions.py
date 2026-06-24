from fastapi import APIRouter, Depends

from app.constants import ROLE_ADMIN, ROLE_QUALITY_ENGINEER
from app.core.deps import CurrentUser, get_registry, require_role
from app.ml.training import ModelRegistry
from app.repositories import predictions_repo
from app.schemas.prediction import PredictionInput, PredictionResult
from app.services import prediction_service

router = APIRouter(prefix="/api/predictions", tags=["predictions"])

_allowed = require_role(ROLE_ADMIN, ROLE_QUALITY_ENGINEER)


@router.post("/predict", response_model=PredictionResult)
def predict(
    payload: PredictionInput,
    current_user: CurrentUser = Depends(_allowed),
    registry: ModelRegistry = Depends(get_registry),
):
    return prediction_service.predict(registry, payload, current_user.email)


@router.get("/history")
def history(limit: int = 50, current_user: CurrentUser = Depends(_allowed)):
    return predictions_repo.get_prediction_history(limit=limit)
