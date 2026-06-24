import pandas as pd

from app.db.connection import get_db

PREDICTION_COLS = [
    "timestamp", "user_email", "cellulose", "hemicellulose", "lignin", "pectin",
    "moisture_content", "ph_level", "fineness", "tenacity", "elongation", "moisture_regain",
    "water_swelling", "density", "porosity", "predicted_strength", "predicted_grade", "confidence", "risk_level", "dye_type",
]


def save_prediction_history(data: dict) -> None:
    conn = get_db()
    cursor = conn.cursor()
    q_marks = ", ".join(["?" for _ in PREDICTION_COLS])
    val_tuple = tuple(data[col] for col in PREDICTION_COLS)
    cursor.execute(f"INSERT INTO prediction_history ({', '.join(PREDICTION_COLS)}) VALUES ({q_marks})", val_tuple)
    conn.commit()
    conn.close()


def get_prediction_history(limit: int = 50) -> list[dict]:
    conn = get_db()
    safe_limit = max(1, min(int(limit), 500))
    df = pd.read_sql_query("SELECT * FROM prediction_history ORDER BY timestamp DESC LIMIT ?", conn, params=(safe_limit,))
    conn.close()
    return df.to_dict("records")


def clear_prediction_history() -> None:
    conn = get_db()
    conn.execute("DELETE FROM prediction_history")
    conn.commit()
    conn.close()
