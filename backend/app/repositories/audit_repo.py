import sqlite3
from datetime import datetime

import pandas as pd

from app.db.connection import get_db


def log_audit(email: str, action: str, details: str) -> None:
    conn = get_db()
    cursor = conn.cursor()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO audit_logs (timestamp, user_email, action, details) VALUES (?, ?, ?, ?)",
        (timestamp, email, action, details),
    )
    conn.commit()
    conn.close()


def get_audit_logs(limit: int = 100) -> list[dict]:
    conn = get_db()
    safe_limit = max(1, min(int(limit), 500))
    df = pd.read_sql_query("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", conn, params=(safe_limit,))
    conn.close()
    return df.to_dict("records")


def clear_audit_logs() -> None:
    conn = get_db()
    conn.execute("DELETE FROM audit_logs")
    conn.commit()
    conn.close()
