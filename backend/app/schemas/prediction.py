from pydantic import BaseModel, Field

from app.constants import DYE_TYPES


class PredictionInput(BaseModel):
    """Field names match the real trained-model columns (see SNAKE_TO_FEATURE),
    not the design prototype's fictional placeholder fields."""
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
    dye_type: str = Field(default="Reactive")

    def model_post_init(self, __context) -> None:
        if self.dye_type not in DYE_TYPES:
            self.dye_type = DYE_TYPES[0]


class FabricScore(BaseModel):
    fabric: str
    score: int


class OptimizerSuggestion(BaseModel):
    parameter: str
    current: str
    target: str
    impact: str
    action: str


class PredictionResult(BaseModel):
    predicted_strength: float
    predicted_grade: str
    confidence: float
    risk_level: str
    risk_reasons: str
    fabric_suitability: list[FabricScore]
    optimizer_suggestions: list[OptimizerSuggestion]


class PredictionHistoryItem(PredictionInput):
    id: int | None = None
    timestamp: str
    user_email: str
    predicted_strength: float
    predicted_grade: str
    confidence: float
    risk_level: str
