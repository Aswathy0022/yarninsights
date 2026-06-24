from pydantic import BaseModel

from app.schemas.prediction import PredictionInput


class BatchCreate(PredictionInput):
    supplier_name: str
    actual_strength: float | None = None


class BatchUpdate(BaseModel):
    supplier_name: str | None = None
    status: str | None = None


class BatchOut(BaseModel):
    batch_id: str
    creation_time: str
    supplier_name: str
    cellulose: float
    hemicellulose: float
    lignin: float
    pectin: float
    moisture_content: float
    ph_level: float
    fineness: float
    tenacity: float
    elongation: float
    moisture_regain: float
    water_swelling: float
    density: float
    porosity: float
    actual_strength: float | None = None
    predicted_strength: float
    predicted_grade: str
    confidence: float
    risk_level: str
    risk_reasons: str
    dye_type: str
    status: str
