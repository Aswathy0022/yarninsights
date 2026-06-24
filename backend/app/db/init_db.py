"""One-time DB provisioning: creates schema and seeds users/batches.

Run manually once during backend setup:
    python -m app.db.init_db

Not run automatically at every API startup — only ML training (app/ml/training.py)
runs at every startup, per BRD FR-7. This intentionally never creates a
chat_messages table; the AI Chat Assistant feature is removed per BRD v2.0.
"""
import random
import sqlite3
from datetime import datetime, timedelta

import pandas as pd

from app.config import (
    ADMIN_EMAIL,
    ADMIN_NAME,
    ADMIN_PASSWORD,
    ALLOW_DEMO_USERS,
    CSV_PATH,
    DB_PATH,
)
from app.core.security import hash_password
from app.ml.dataset import label_dataframe_grades
from app.domain.risk import compute_risk_assessment


def init_database() -> None:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS batches (
        batch_id TEXT PRIMARY KEY,
        creation_time TEXT NOT NULL,
        supplier_name TEXT NOT NULL,
        cellulose REAL,
        hemicellulose REAL,
        lignin REAL,
        pectin REAL,
        moisture_content REAL,
        ph_level REAL,
        fineness REAL,
        tenacity REAL,
        elongation REAL,
        moisture_regain REAL,
        water_swelling REAL,
        density REAL,
        porosity REAL,
        actual_strength REAL,
        predicted_strength REAL,
        predicted_grade TEXT,
        confidence REAL,
        risk_level TEXT,
        risk_reasons TEXT,
        dye_type TEXT,
        status TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prediction_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        user_email TEXT NOT NULL,
        cellulose REAL,
        hemicellulose REAL,
        lignin REAL,
        pectin REAL,
        moisture_content REAL,
        ph_level REAL,
        fineness REAL,
        tenacity REAL,
        elongation REAL,
        moisture_regain REAL,
        water_swelling REAL,
        density REAL,
        porosity REAL,
        predicted_strength REAL,
        predicted_grade TEXT,
        confidence REAL,
        risk_level TEXT,
        dye_type TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        user_email TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL
    )
    """)

    users_data = []
    if ADMIN_EMAIL and ADMIN_PASSWORD:
        users_data.append((ADMIN_EMAIL, ADMIN_NAME, hash_password(ADMIN_PASSWORD), "Admin"))

    if ALLOW_DEMO_USERS:
        users_data.extend([
            ("admin@yarninsight.com", "Admin User", hash_password("admin123"), "Admin"),
            ("manager@yarninsight.com", "Production Manager", hash_password("manager123"), "Production Manager"),
            ("engineer@yarninsight.com", "Quality Engineer", hash_password("engineer123"), "Quality Engineer"),
        ])

    if users_data:
        cursor.executemany("INSERT OR REPLACE INTO users VALUES (?, ?, ?, ?)", users_data)
        print(f"Seeded {len(users_data)} user account(s).")
    else:
        print("No users seeded. Set YARNINSIGHT_ADMIN_EMAIL and YARNINSIGHT_ADMIN_PASSWORD before production initialization.")

    try:
        df = pd.read_csv(CSV_PATH)
        df = label_dataframe_grades(df)
        print("Loaded yarn dataset.")

        sample_rows = df.sample(60, random_state=42)
        suppliers = ["Apex Fibers", "Global Cotton Co.", "TexPrime Industries", "EcoThread Co."]

        for i, (_, row) in enumerate(sample_rows.iterrows()):
            batch_id = f"B-10{10 + i}"
            supplier = random.choice(suppliers)
            days_ago = random.randint(0, 30)
            creation_time = (datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23))).strftime("%Y-%m-%d %H:%M:%S")

            cellulose = float(row["Cellulose of yarn (%)"])
            hemicellulose = float(row["Hemicellulose of yarn (%)"])
            lignin = float(row["Lignin of yarn (%)"])
            pectin = float(row["Pectin of yarn (%)"])
            moisture_content = float(row["Moisture Content of yarn (%)"])
            ph_level = float(row["pH Level of yarn"])
            fineness = float(row["Fineness of yarn (tex)"])
            tenacity = float(row["Fiber Tenacity of yarn (gm/tex)"])
            elongation = float(row["Elongation of yarn (%)"])
            moisture_regain = float(row["Moisture Regain of yarn (%)"])
            water_swelling = float(row["Water Swelling of yarn (%)"])
            density = float(row["True Density of yarn (gms/cc)"])
            porosity = float(row["Porosity of yarn (%)"])
            actual_strength = float(row["Tensile Strength of yarn (MPa)"])
            dye_type = str(row["Dye Type"])

            predicted_strength = actual_strength + random.uniform(-10.0, 10.0)
            predicted_grade = row["Quality Grade"]
            confidence = random.uniform(88.0, 99.2)

            risk_level, risk_reasons = compute_risk_assessment(row, predicted_grade)

            if predicted_grade in ["Grade A+ (Premium)", "Grade A"]:
                status = "Release"
            elif predicted_grade == "Grade B":
                status = random.choice(["Release", "Review"])
            elif predicted_grade == "Grade C":
                status = "Review"
            else:
                status = "Hold"

            cursor.execute("""
            INSERT OR REPLACE INTO batches (
                batch_id, creation_time, supplier_name, cellulose, hemicellulose, lignin, pectin,
                moisture_content, ph_level, fineness, tenacity, elongation, moisture_regain,
                water_swelling, density, porosity, actual_strength, predicted_strength,
                predicted_grade, confidence, risk_level, risk_reasons, dye_type, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                batch_id, creation_time, supplier, cellulose, hemicellulose, lignin, pectin,
                moisture_content, ph_level, fineness, tenacity, elongation, moisture_regain,
                water_swelling, density, porosity, actual_strength, predicted_strength,
                predicted_grade, confidence, risk_level, risk_reasons, dye_type, status
            ))

            pred_time = (datetime.now() - timedelta(days=random.randint(0, 15), minutes=random.randint(0, 500))).strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute("""
            INSERT INTO prediction_history (
                timestamp, user_email, cellulose, hemicellulose, lignin, pectin,
                moisture_content, ph_level, fineness, tenacity, elongation, moisture_regain,
                water_swelling, density, porosity, predicted_strength, predicted_grade, confidence, risk_level, dye_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                pred_time, random.choice(["engineer@yarninsight.com", "manager@yarninsight.com"]),
                cellulose, hemicellulose, lignin, pectin,
                moisture_content, ph_level, fineness, tenacity, elongation, moisture_regain,
                water_swelling, density, porosity, predicted_strength, predicted_grade, confidence, risk_level, dye_type
            ))

            log_time = (datetime.strptime(creation_time, "%Y-%m-%d %H:%M:%S") + timedelta(minutes=random.randint(5, 60))).strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute("""
            INSERT INTO audit_logs (timestamp, user_email, action, details)
            VALUES (?, ?, ?, ?)
            """, (
                log_time, "manager@yarninsight.com", "BATCH_CREATE", f"Created batch ID {batch_id} with grade {predicted_grade}."
            ))

        print("Successfully seeded 60 mock batches.")
    except Exception as e:
        print(f"Error seeding database from CSV: {e}")

    conn.commit()
    conn.close()
    print("Database initialization complete.")


if __name__ == "__main__":
    init_database()
