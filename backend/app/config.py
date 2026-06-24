import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def _load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env_file(BASE_DIR / ".env")

DB_PATH = os.getenv("YARNINSIGHT_DB_PATH", str(BASE_DIR / "yarn_insight.db"))
CSV_PATH = os.getenv("YARNINSIGHT_CSV_PATH", str(BASE_DIR / "data" / "yarn_data.csv"))
PASSWORD_ITERATIONS = int(os.getenv("YARNINSIGHT_PASSWORD_ITERATIONS", "260000"))
SQLITE_JOURNAL_MODE = os.getenv("YARNINSIGHT_SQLITE_JOURNAL_MODE", "WAL").strip().upper()
ALLOW_DEMO_USERS = os.getenv("YARNINSIGHT_ALLOW_DEMO_USERS", "false").lower() == "true"

ADMIN_EMAIL = os.getenv("YARNINSIGHT_ADMIN_EMAIL")
ADMIN_NAME = os.getenv("YARNINSIGHT_ADMIN_NAME", "Admin User")
ADMIN_PASSWORD = os.getenv("YARNINSIGHT_ADMIN_PASSWORD")

JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-insecure-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_MINUTES = int(os.getenv("JWT_EXPIRY_MINUTES", "480"))

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
