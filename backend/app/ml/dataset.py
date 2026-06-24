import os

import pandas as pd

from app.config import CSV_PATH
from app.constants import NUMERIC_COLUMNS


def get_raw_dataset() -> pd.DataFrame:
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Missing dataset file: {CSV_PATH}")
    return pd.read_csv(CSV_PATH)


def get_zscore_series(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    for col in NUMERIC_COLUMNS:
        sd = out[col].std(ddof=0)
        mean = out[col].mean()
        out[f"z_{col}"] = (out[col] - mean) / sd if sd else 0.0
    return out


def label_dataframe_grades(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    z_df = get_zscore_series(out)

    q = (
        0.35 * z_df["z_Tensile Strength of yarn (MPa)"]
        + 0.30 * z_df["z_Fiber Tenacity of yarn (gm/tex)"]
        + 0.15 * z_df["z_Elongation of yarn (%)"]
        + 0.10 * z_df["z_Moisture Regain of yarn (%)"]
        - 0.10 * z_df["z_Fineness of yarn (tex)"]
    )

    out["Quality Score"] = (q - q.min()) / (q.max() - q.min() + 1e-9) * 100

    def assign_grade(score):
        if score >= 80:
            return "Grade A+ (Premium)"
        elif score >= 65:
            return "Grade A"
        elif score >= 50:
            return "Grade B"
        elif score >= 35:
            return "Grade C"
        else:
            return "Reject"

    out["Quality Grade"] = out["Quality Score"].apply(assign_grade)
    return out
