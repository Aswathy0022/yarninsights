import pandas as pd

from app.db.connection import get_db

BATCH_COLS = [
    "batch_id", "creation_time", "supplier_name", "cellulose", "hemicellulose", "lignin", "pectin",
    "moisture_content", "ph_level", "fineness", "tenacity", "elongation", "moisture_regain",
    "water_swelling", "density", "porosity", "actual_strength", "predicted_strength",
    "predicted_grade", "confidence", "risk_level", "risk_reasons", "dye_type", "status",
]


def get_batches(search: str | None = None, grade: str | None = None, status: str | None = None, supplier: str | None = None) -> pd.DataFrame:
    conn = get_db()
    query = "SELECT * FROM batches WHERE 1=1"
    params: list = []

    if search:
        query += " AND (batch_id LIKE ? OR supplier_name LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
    if grade:
        query += " AND predicted_grade = ?"
        params.append(grade)
    if status:
        query += " AND status = ?"
        params.append(status)
    if supplier:
        query += " AND supplier_name = ?"
        params.append(supplier)

    query += " ORDER BY creation_time DESC"
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    # actual_strength is genuinely optional (lab measurement may not exist yet at
    # save time) — pandas reads the SQL NULL as NaN, which Starlette's JSON
    # encoder rejects outright. Normalize to None so the whole list doesn't 500.
    return df.astype(object).where(df.notna(), None)


def save_batch(data: dict) -> str:
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT batch_id FROM batches WHERE batch_id = ?", (data["batch_id"],))
    exists = cursor.fetchone()

    if exists:
        update_str = ", ".join([f"{col} = ?" for col in BATCH_COLS[1:]])
        val_tuple = tuple(data[col] for col in BATCH_COLS[1:]) + (data["batch_id"],)
        cursor.execute(f"UPDATE batches SET {update_str} WHERE batch_id = ?", val_tuple)
        action = "BATCH_UPDATE"
    else:
        q_marks = ", ".join(["?" for _ in BATCH_COLS])
        val_tuple = tuple(data[col] for col in BATCH_COLS)
        cursor.execute(f"INSERT INTO batches ({', '.join(BATCH_COLS)}) VALUES ({q_marks})", val_tuple)
        action = "BATCH_CREATE"

    conn.commit()
    conn.close()
    return action


def get_batch(batch_id: str) -> dict | None:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM batches WHERE batch_id = ?", (batch_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_batch_fields(batch_id: str, fields: dict) -> bool:
    if not fields:
        return False
    conn = get_db()
    cursor = conn.cursor()
    set_str = ", ".join([f"{col} = ?" for col in fields])
    cursor.execute(f"UPDATE batches SET {set_str} WHERE batch_id = ?", (*fields.values(), batch_id))
    updated = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return updated


def delete_batch(batch_id: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM batches WHERE batch_id = ?", (batch_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def next_batch_id() -> str:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT batch_id FROM batches ORDER BY rowid DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return "YRN-2026-001"
    last = row["batch_id"]
    try:
        prefix, num = last.rsplit("-", 1)
        return f"{prefix}-{int(num) + 1:03d}"
    except (ValueError, IndexError):
        return f"YRN-2026-{pd.Timestamp.now().strftime('%H%M%S')}"
