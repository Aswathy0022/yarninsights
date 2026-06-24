from pydantic import BaseModel

from app.schemas.batch import BatchOut


class TrendPoint(BaseModel):
    month: str
    count: int


class DashboardKPIs(BaseModel):
    total_batches: int
    release_rate_pct: float
    avg_predicted_strength: float
    held_batches_count: int
    grade_distribution: dict[str, int]
    status_breakdown: dict[str, int]
    intake_trend: list[TrendPoint]
    latest_batches: list[BatchOut]


class HomeSummary(BaseModel):
    total_batches: int
    total_predictions: int
    recent_batches: list[BatchOut]
