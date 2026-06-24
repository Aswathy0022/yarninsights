from datetime import datetime

import pandas as pd

from app.constants import SNAKE_TO_FEATURE
from app.domain.fabric import cloth_from_rules
from app.domain.fabric import batch_row_to_fabric_input
from app.ml.inference import run_predictions_on_row
from app.ml.training import ModelRegistry
from app.repositories import audit_repo, batches_repo
from app.schemas.batch import BatchCreate


def _to_feature_dict(batch_data: BatchCreate) -> dict:
    payload = batch_data.model_dump(exclude={"supplier_name", "actual_strength"})
    return {SNAKE_TO_FEATURE[key]: value for key, value in payload.items()}


def create_batch(registry: ModelRegistry, batch_data: BatchCreate, user_email: str) -> dict:
    feature_row = _to_feature_dict(batch_data)

    predicted_strength, predicted_grade, confidence, risk_level, risk_reasons = run_predictions_on_row(
        registry.reg_pipeline, registry.clf_pipeline, feature_row
    )

    if predicted_grade in ("Grade A+ (Premium)", "Grade A"):
        status = "Release"
    elif predicted_grade == "Reject" or risk_level == "High Risk":
        status = "Hold"
    else:
        status = "Review"

    record = {
        "batch_id": batches_repo.next_batch_id(),
        "creation_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "supplier_name": batch_data.supplier_name,
        "cellulose": batch_data.cellulose,
        "hemicellulose": batch_data.hemicellulose,
        "lignin": batch_data.lignin,
        "pectin": batch_data.pectin,
        "moisture_content": batch_data.moisture_content,
        "ph_level": batch_data.ph_level,
        "fineness": batch_data.fineness,
        "tenacity": batch_data.tenacity,
        "elongation": batch_data.elongation,
        "moisture_regain": batch_data.moisture_regain,
        "water_swelling": batch_data.water_swelling,
        "density": batch_data.density,
        "porosity": batch_data.porosity,
        "actual_strength": batch_data.actual_strength,
        "predicted_strength": predicted_strength,
        "predicted_grade": predicted_grade,
        "confidence": confidence,
        "risk_level": risk_level,
        "risk_reasons": risk_reasons,
        "dye_type": batch_data.dye_type,
        "status": status,
    }

    batches_repo.save_batch(record)
    audit_repo.log_audit(user_email, "BATCH_CREATE", f"Created {record['batch_id']} with grade {predicted_grade}.")
    return record


def update_batch(batch_id: str, fields: dict, user_email: str) -> dict | None:
    if not batches_repo.update_batch_fields(batch_id, fields):
        return None
    audit_repo.log_audit(user_email, "BATCH_EDIT", f"Updated {', '.join(fields.keys())} for {batch_id}.")
    return batches_repo.get_batch(batch_id)


def delete_batch(batch_id: str, user_email: str) -> bool:
    deleted = batches_repo.delete_batch(batch_id)
    if deleted:
        audit_repo.log_audit(user_email, "BATCH_DELETE", f"Deleted batch ID {batch_id}.")
    return deleted


def list_batches(search: str | None, grade: str | None, status: str | None) -> list[dict]:
    df: pd.DataFrame = batches_repo.get_batches(search=search, grade=grade, status=status)
    return df.to_dict("records")


def top_fabric_for_batch(batch: dict) -> str:
    scores = cloth_from_rules(batch_row_to_fabric_input(batch), batch["predicted_grade"])
    return scores[0][0] if scores else "—"
