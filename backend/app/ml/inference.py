import numpy as np
import pandas as pd

from app.constants import FEATURE_COLUMNS
from app.domain.risk import compute_risk_assessment


def run_predictions_on_row(reg_model, clf_model, input_dict: dict) -> tuple[float, str, float, str, str]:
    row_reg = pd.DataFrame([input_dict])
    if "Tensile Strength of yarn (MPa)" in row_reg.columns:
        row_reg = row_reg.drop(columns=["Tensile Strength of yarn (MPa)"])

    reg_features = [col for col in FEATURE_COLUMNS if col != "Tensile Strength of yarn (MPa)"]
    row_reg = row_reg[reg_features]

    predicted_strength = float(reg_model.predict(row_reg)[0])

    row_clf = pd.DataFrame([input_dict])
    row_clf["Tensile Strength of yarn (MPa)"] = predicted_strength
    row_clf = row_clf[FEATURE_COLUMNS]

    predicted_grade = str(clf_model.predict(row_clf)[0])
    confidence = float(np.max(clf_model.predict_proba(row_clf)[0])) * 100

    risk_level, risk_reasons = compute_risk_assessment(row_clf.iloc[0], predicted_grade)

    return predicted_strength, predicted_grade, confidence, risk_level, risk_reasons
