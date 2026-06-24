from pydantic import BaseModel


class BulkResultRow(BaseModel):
    row_id: str
    supplier_name: str | None = None
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
    dye_type: str
    predicted_strength: float
    predicted_grade: str
    confidence: float
    risk_level: str
    best_fabric: str


class BulkPredictionResponse(BaseModel):
    rows: list[BulkResultRow]
    summary: dict[str, int]
    total_rows: int
    total_high_risk: int
