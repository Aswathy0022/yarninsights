import io

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse

from app.constants import ROLE_ADMIN, ROLE_PRODUCTION_MANAGER, SNAKE_TO_FEATURE
from app.core.deps import CurrentUser, get_registry, require_role
from app.domain.fabric import cloth_from_rules
from app.ml.inference import run_predictions_on_row
from app.ml.training import ModelRegistry
from app.repositories import audit_repo
from app.schemas.bulk import BulkPredictionResponse

router = APIRouter(prefix="/api/bulk-predictions", tags=["bulk"])

_allowed = require_role(ROLE_ADMIN, ROLE_PRODUCTION_MANAGER)

REQUIRED_COLUMNS = list(SNAKE_TO_FEATURE.keys())


@router.get("/template")
def download_template(current_user: CurrentUser = Depends(_allowed)):
    csv_buffer = io.StringIO()
    pd.DataFrame(columns=["supplier_name", *REQUIRED_COLUMNS]).to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)
    return StreamingResponse(
        iter([csv_buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bulk_prediction_template.csv"},
    )


@router.post("", response_model=BulkPredictionResponse)
async def bulk_predict(
    file: UploadFile,
    current_user: CurrentUser = Depends(_allowed),
    registry: ModelRegistry = Depends(get_registry),
):
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not parse CSV: {exc}") from exc

    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Missing required columns: {', '.join(missing)}")

    rows = []
    grade_counts: dict[str, int] = {}
    high_risk = 0

    for idx, raw_row in df.iterrows():
        feature_row = {SNAKE_TO_FEATURE[col]: raw_row[col] for col in REQUIRED_COLUMNS}
        predicted_strength, predicted_grade, confidence, risk_level, _ = run_predictions_on_row(
            registry.reg_pipeline, registry.clf_pipeline, feature_row
        )
        full_row = {**feature_row, "Tensile Strength of yarn (MPa)": predicted_strength}
        best_fabric = cloth_from_rules(full_row, predicted_grade)[0][0]

        if risk_level == "High Risk":
            high_risk += 1
        grade_counts[predicted_grade] = grade_counts.get(predicted_grade, 0) + 1

        rows.append({
            "row_id": f"ROW-{idx + 1:03d}",
            "supplier_name": raw_row.get("supplier_name"),
            **{col: float(raw_row[col]) if col != "dye_type" else raw_row[col] for col in REQUIRED_COLUMNS},
            "predicted_strength": predicted_strength,
            "predicted_grade": predicted_grade,
            "confidence": confidence,
            "risk_level": risk_level,
            "best_fabric": best_fabric,
        })

    audit_repo.log_audit(current_user.email, "BULK_PREDICT", f"Processed {len(rows)} rows")

    return BulkPredictionResponse(
        rows=rows,
        summary=grade_counts,
        total_rows=len(rows),
        total_high_risk=high_risk,
    )
