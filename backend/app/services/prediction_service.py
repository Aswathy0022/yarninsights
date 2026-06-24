from datetime import datetime

from app.constants import SNAKE_TO_FEATURE
from app.domain.fabric import cloth_from_rules
from app.domain.optimizer import get_optimizer_suggestions
from app.ml.inference import run_predictions_on_row
from app.ml.training import ModelRegistry
from app.repositories import audit_repo, predictions_repo
from app.schemas.prediction import PredictionInput, PredictionResult


def _to_feature_dict(input_data: PredictionInput) -> dict:
    payload = input_data.model_dump()
    return {SNAKE_TO_FEATURE[key]: value for key, value in payload.items()}


def predict(registry: ModelRegistry, input_data: PredictionInput, user_email: str, *, save_history: bool = True) -> PredictionResult:
    feature_row = _to_feature_dict(input_data)

    predicted_strength, predicted_grade, confidence, risk_level, risk_reasons = run_predictions_on_row(
        registry.reg_pipeline, registry.clf_pipeline, feature_row
    )

    full_row = {**feature_row, "Tensile Strength of yarn (MPa)": predicted_strength}
    fabric_scores = cloth_from_rules(full_row, predicted_grade)
    suggestions = get_optimizer_suggestions(full_row)

    if save_history:
        history_row = {
            **input_data.model_dump(),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "user_email": user_email,
            "predicted_strength": predicted_strength,
            "predicted_grade": predicted_grade,
            "confidence": confidence,
            "risk_level": risk_level,
        }
        predictions_repo.save_prediction_history(history_row)
        audit_repo.log_audit(user_email, "PREDICT", f"Predicted grade {predicted_grade}, strength {predicted_strength:.1f} MPa")

    return PredictionResult(
        predicted_strength=predicted_strength,
        predicted_grade=predicted_grade,
        confidence=confidence,
        risk_level=risk_level,
        risk_reasons=risk_reasons,
        fabric_suitability=[{"fabric": name, "score": score} for name, score in fabric_scores],
        optimizer_suggestions=suggestions,
    )
