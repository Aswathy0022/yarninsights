from collections import Counter

import pandas as pd

from app.constants import GRADE_ORDER
from app.repositories import batches_repo, predictions_repo


def get_kpis() -> dict:
    df: pd.DataFrame = batches_repo.get_batches()

    total_batches = len(df)
    released = int((df["status"] == "Release").sum()) if total_batches else 0
    held = int((df["status"] == "Hold").sum()) if total_batches else 0
    reviewed = int((df["status"] == "Review").sum()) if total_batches else 0
    avg_strength = float(df["predicted_strength"].mean()) if total_batches else 0.0

    grade_distribution = {grade: int((df["predicted_grade"] == grade).sum()) for grade in GRADE_ORDER} if total_batches else {g: 0 for g in GRADE_ORDER}
    status_breakdown = {"Release": released, "Review": reviewed, "Hold": held}

    intake_trend = []
    if total_batches:
        df = df.copy()
        df["creation_time"] = pd.to_datetime(df["creation_time"], errors="coerce")
        monthly = df.dropna(subset=["creation_time"]).groupby(df["creation_time"].dt.strftime("%Y-%m")).size()
        for month, count in monthly.sort_index().tail(6).items():
            intake_trend.append({"month": month, "count": int(count)})

    latest = df.sort_values("creation_time", ascending=False).head(6).to_dict("records") if total_batches else []

    return {
        "total_batches": total_batches,
        "release_rate_pct": round(released / total_batches * 100, 1) if total_batches else 0.0,
        "avg_predicted_strength": round(avg_strength, 1),
        "held_batches_count": held,
        "grade_distribution": grade_distribution,
        "status_breakdown": status_breakdown,
        "intake_trend": intake_trend,
        "latest_batches": latest,
    }


def get_home_summary() -> dict:
    df = batches_repo.get_batches()
    total_predictions = len(predictions_repo.get_prediction_history(limit=500))
    recent = df.sort_values("creation_time", ascending=False).head(5).to_dict("records") if len(df) else []
    return {
        "total_batches": len(df),
        "total_predictions": total_predictions,
        "recent_batches": recent,
    }
