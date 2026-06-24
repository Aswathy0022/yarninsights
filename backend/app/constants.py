# Real trained-model feature columns (from the original yarn_data.csv / app.py).
# These are the authoritative column names — the frontend's slider keys are
# remapped to this set (see PredictionInput in app/schemas/prediction.py),
# not the design prototype's fictional placeholder fields.
NUMERIC_COLUMNS = [
    "Cellulose of yarn (%)",
    "Hemicellulose of yarn (%)",
    "Lignin of yarn (%)",
    "Pectin of yarn (%)",
    "Moisture Content of yarn (%)",
    "pH Level of yarn",
    "Fineness of yarn (tex)",
    "Fiber Tenacity of yarn (gm/tex)",
    "Elongation of yarn (%)",
    "Moisture Regain of yarn (%)",
    "Water Swelling of yarn (%)",
    "True Density of yarn (gms/cc)",
    "Porosity of yarn (%)",
    "Tensile Strength of yarn (MPa)",
]
FEATURE_COLUMNS = NUMERIC_COLUMNS + ["Dye Type"]

DYE_TYPES = ["Reactive", "Vat", "Disperse", "Direct"]

GRADE_ORDER = ["Grade A+ (Premium)", "Grade A", "Grade B", "Grade C", "Reject"]

FABRIC_TYPES = [
    "Denim",
    "T-Shirts",
    "Knitwear",
    "Sportswear",
    "Home Textiles",
    "Upholstery",
    "Industrial Fabrics",
    "Bags & Accessories",
]

# API request/DB-column snake_case key -> real model feature column name.
# This is the field remap the user approved: the design prototype's fictional
# crystallinity/fiberLength/uniformity/impurity fields are dropped entirely in
# favor of the real trained model's Hemicellulose/Lignin/Pectin/Moisture Regain.
SNAKE_TO_FEATURE = {
    "cellulose": "Cellulose of yarn (%)",
    "hemicellulose": "Hemicellulose of yarn (%)",
    "lignin": "Lignin of yarn (%)",
    "pectin": "Pectin of yarn (%)",
    "moisture_content": "Moisture Content of yarn (%)",
    "ph_level": "pH Level of yarn",
    "fineness": "Fineness of yarn (tex)",
    "tenacity": "Fiber Tenacity of yarn (gm/tex)",
    "elongation": "Elongation of yarn (%)",
    "moisture_regain": "Moisture Regain of yarn (%)",
    "water_swelling": "Water Swelling of yarn (%)",
    "density": "True Density of yarn (gms/cc)",
    "porosity": "Porosity of yarn (%)",
    "dye_type": "Dye Type",
}
FEATURE_TO_SNAKE = {v: k for k, v in SNAKE_TO_FEATURE.items()}

# Roles
ROLE_ADMIN = "Admin"
ROLE_QUALITY_ENGINEER = "Quality Engineer"
ROLE_PRODUCTION_MANAGER = "Production Manager"
ALL_ROLES = [ROLE_ADMIN, ROLE_QUALITY_ENGINEER, ROLE_PRODUCTION_MANAGER]
SELF_SIGNUP_ROLES = [ROLE_QUALITY_ENGINEER, ROLE_PRODUCTION_MANAGER]
