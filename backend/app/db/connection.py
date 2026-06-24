import sqlite3

from app.config import DB_PATH, SQLITE_JOURNAL_MODE

_VALID_JOURNAL_MODES = {"DELETE", "TRUNCATE", "PERSIST", "MEMORY", "WAL", "OFF"}


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    if SQLITE_JOURNAL_MODE in _VALID_JOURNAL_MODES:
        conn.execute(f"PRAGMA journal_mode={SQLITE_JOURNAL_MODE}")
    return conn
