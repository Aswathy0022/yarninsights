import sqlite3
import hashlib
import os
import secrets
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
import random

BASE_DIR = Path(__file__).resolve().parent

def load_env_file(path: Path):
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

load_env_file(BASE_DIR / ".env")

DB_PATH = os.getenv("YARNINSIGHT_DB_PATH", str(BASE_DIR / "yarn_insight.db"))
CSV_PATH = os.getenv("YARNINSIGHT_CSV_PATH", str(BASE_DIR / "yarn data.csv"))
PASSWORD_ITERATIONS = int(os.getenv("YARNINSIGHT_PASSWORD_ITERATIONS", "260000"))

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_ITERATIONS
    ).hex()
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt}${derived}"

def zscore(s: pd.Series) -> pd.Series:
    sd = s.std(ddof=0)
    return (s - s.mean()) / sd if sd else pd.Series(np.zeros(len(s)), index=s.index)

def label_quality(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    q = (0.35 * zscore(out["Tensile Strength of yarn (MPa)"]) + 
         0.30 * zscore(out["Fiber Tenacity of yarn (gm/tex)"]) + 
         0.15 * zscore(out["Elongation of yarn (%)"]) + 
         0.10 * zscore(out["Moisture Regain of yarn (%)"]) - 
         0.10 * zscore(out["Fineness of yarn (tex)"]))
    out["Quality Score"] = (q - q.min()) / (q.max() - q.min() + 1e-9) * 100
    
    # Grade assignments
    def assign_grade(score):
        if score >= 80: return "Grade A+ (Premium)"
        elif score >= 65: return "Grade A"
        elif score >= 50: return "Grade B"
        elif score >= 35: return "Grade C"
        else: return "Reject"
        
    out["Quality Grade"] = out["Quality Score"].apply(assign_grade)
    return out

def get_risk_assessment(row, grade):
    reasons = []
    # Strength Risk
    strength = row["Tensile Strength of yarn (MPa)"]
    if strength < 1350:
        reasons.append(f"Low Tensile Strength ({strength:.1f} MPa)")
    
    # pH Risk
    ph = row["pH Level of yarn"]
    if ph < 4.8 or ph > 7.2:
        reasons.append(f"Critical pH level ({ph:.1f})")
    elif ph < 5.2 or ph > 6.8:
        reasons.append(f"Marginal pH level ({ph:.1f})")
        
    # Porosity Risk
    porosity = row["Porosity of yarn (%)"]
    if porosity > 13.0:
        reasons.append(f"High yarn porosity ({porosity:.1f}%)")
        
    # Tenacity Risk
    tenacity = row["Fiber Tenacity of yarn (gm/tex)"]
    if tenacity < 32.0:
        reasons.append(f"Low fiber tenacity ({tenacity:.1f} gm/tex)")

    # Moisture Content Risk
    moisture = row["Moisture Content of yarn (%)"]
    if moisture > 12.0:
        reasons.append(f"Excessive moisture content ({moisture:.1f}%) - potential mildew risk")
    elif moisture < 9.0:
        reasons.append(f"Low moisture content ({moisture:.1f}%) - brittle fiber danger")

    if grade == "Reject" or len(reasons) >= 3:
        risk = "High Risk"
    elif grade == "Grade C" or len(reasons) >= 1:
        risk = "Medium Risk"
    else:
        risk = "Low Risk"
        
    if not reasons:
        reasons.append("All properties within standard tolerance limits.")
        
    return risk, "; ".join(reasons)

def init_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL
    )
    """)

    # Create batches table
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

    # Create prediction history table
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

    # Create audit logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        user_email TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL
    )
    """)

    # Create chat messages table for persistent AI assistant history
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL
    )
    """)

    # Seed users. Production deployments should set YARNINSIGHT_ADMIN_*.
    users_data = []
    admin_email = os.getenv("YARNINSIGHT_ADMIN_EMAIL")
    admin_name = os.getenv("YARNINSIGHT_ADMIN_NAME", "Admin User")
    admin_password = os.getenv("YARNINSIGHT_ADMIN_PASSWORD")

    if admin_email and admin_password:
        users_data.append((admin_email, admin_name, hash_password(admin_password), "Admin"))

    if os.getenv("YARNINSIGHT_ALLOW_DEMO_USERS", "false").lower() == "true":
        users_data.extend([
            ("admin@yarninsight.com", "Admin User", hash_password("admin123"), "Admin"),
            ("manager@yarninsight.com", "Production Manager", hash_password("manager123"), "Production Manager"),
            ("engineer@yarninsight.com", "Quality Engineer", hash_password("engineer123"), "Quality Engineer")
        ])
    
    if users_data:
        cursor.executemany("INSERT OR REPLACE INTO users VALUES (?, ?, ?, ?)", users_data)
        print(f"Seeded {len(users_data)} user account(s).")
    else:
        print("No users seeded. Set YARNINSIGHT_ADMIN_EMAIL and YARNINSIGHT_ADMIN_PASSWORD before production initialization.")

    # Load CSV to seed some batches
    try:
        df = pd.read_csv(CSV_PATH)
        df = label_quality(df)
        print("Loaded yarn dataset.")
        
        # Select a set of samples to seed as batches (e.g., 60 samples)
        sample_rows = df.sample(60, random_state=42)
        suppliers = ["Apex Fibers", "Global Cotton Co.", "TexPrime Industries", "EcoThread Co."]
        
        for i, (_, row) in enumerate(sample_rows.iterrows()):
            batch_id = f"B-10{10+i}"
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
            
            # Predict dummy values for seeds (they match actuals because we seed from dataset)
            predicted_strength = actual_strength + random.uniform(-10.0, 10.0)
            predicted_grade = row["Quality Grade"]
            confidence = random.uniform(88.0, 99.2)
            
            risk_level, risk_reasons = get_risk_assessment(row, predicted_grade)
            
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
            
            # Log some predictions in prediction history
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
            
            # Log audit trail
            log_time = (datetime.strptime(creation_time, "%Y-%m-%d %H:%M:%S") + timedelta(minutes=random.randint(5, 60))).strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute("""
            INSERT INTO audit_logs (timestamp, user_email, action, details)
            VALUES (?, ?, ?, ?)
            """, (
                log_time, "manager@yarninsight.com", "BATCH_CREATE", f"Created batch ID {batch_id} with grade {predicted_grade}."
            ))

        print(f"Successfully seeded 60 mock batches.")
    except Exception as e:
        print(f"Error seeding database from CSV: {e}")

    conn.commit()
    conn.close()
    print("Database initialization complete.")

if __name__ == "__main__":
    init_database()
