import sqlite3

from app.core.security import hash_password, is_legacy_hash, verify_password
from app.db.connection import get_db
from app.repositories.audit_repo import log_audit


def verify_login(email: str, password: str) -> tuple[bool, str, str]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),))
    user = cursor.fetchone()
    conn.close()
    if user and verify_password(password, user["password_hash"]):
        if is_legacy_hash(user["password_hash"]):
            update_password_hash(email, password)
        return True, user["name"], user["role"]
    return False, "", ""


def update_password_hash(email: str, password: str) -> None:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET password_hash = ? WHERE email = ?",
        (hash_password(password), email.strip().lower()),
    )
    conn.commit()
    conn.close()


def create_user(email: str, name: str, password: str, role: str) -> tuple[bool, str]:
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users VALUES (?, ?, ?, ?)",
            (email.strip().lower(), name.strip(), hash_password(password), role),
        )
        conn.commit()
        return True, "User registered successfully."
    except sqlite3.IntegrityError:
        return False, "User with this email already exists."
    finally:
        conn.close()


def get_user(email: str) -> dict | None:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT email, name, role FROM users WHERE email = ?", (email.strip().lower(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def list_users() -> list[dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT email, name, role FROM users ORDER BY email ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def update_user_role(email: str, role: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET role = ? WHERE email = ?", (role, email.strip().lower()))
    updated = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return updated


def delete_user(email: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE email = ?", (email.strip().lower(),))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
