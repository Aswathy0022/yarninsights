def cloth_from_rules(row, grade: str) -> list[tuple[str, int]]:
    """Ported verbatim from app.py's cloth_from_rules — 8-fabric heuristic scoring."""
    strength = float(row["Tensile Strength of yarn (MPa)"])
    tenacity = float(row["Fiber Tenacity of yarn (gm/tex)"])
    fineness = float(row["Fineness of yarn (tex)"])
    elongation = float(row["Elongation of yarn (%)"])
    regain = float(row["Moisture Regain of yarn (%)"])
    swelling = float(row["Water Swelling of yarn (%)"])
    density = float(row["True Density of yarn (gms/cc)"])
    porosity = float(row["Porosity of yarn (%)"])

    denim_score = 40
    if strength > 1700:
        denim_score += 30
    if tenacity > 42:
        denim_score += 20
    if fineness > 2.8:
        denim_score += 10

    tshirt_score = 30
    if fineness < 2.5:
        tshirt_score += 30
    if regain > 11.5:
        tshirt_score += 20
    if elongation > 2.8:
        tshirt_score += 20

    knit_score = 30
    if elongation > 3.2:
        knit_score += 40
    if fineness < 2.8:
        knit_score += 20
    if swelling > 45:
        knit_score += 10

    sports_score = 35
    if elongation > 3.4:
        sports_score += 35
    if regain < 11.0:
        sports_score += 15
    if tenacity > 38:
        sports_score += 15

    home_score = 40
    if regain > 12.0:
        home_score += 25
    if swelling > 48:
        home_score += 25
    if porosity > 7.0:
        home_score += 10

    uph_score = 40
    if density > 1.48:
        uph_score += 25
    if strength > 1550:
        uph_score += 25
    if fineness > 3.0:
        uph_score += 10

    ind_score = 30
    if strength > 1850:
        ind_score += 40
    if tenacity > 46:
        ind_score += 20
    if swelling < 45:
        ind_score += 10

    bags_score = 35
    if strength > 1600:
        bags_score += 25
    if fineness > 3.1:
        bags_score += 25
    if tenacity > 36:
        bags_score += 15

    modifier = {
        "Grade A+ (Premium)": 1.15,
        "Grade A": 1.05,
        "Grade B": 0.95,
        "Grade C": 0.80,
        "Reject": 0.35,
    }.get(grade, 1.0)

    scores = {
        "Denim": min(100, int(denim_score * modifier)),
        "T-Shirts": min(100, int(tshirt_score * modifier)),
        "Knitwear": min(100, int(knit_score * modifier)),
        "Sportswear": min(100, int(sports_score * modifier)),
        "Home Textiles": min(100, int(home_score * modifier)),
        "Upholstery": min(100, int(uph_score * modifier)),
        "Industrial Fabrics": min(100, int(ind_score * modifier)),
        "Bags & Accessories": min(100, int(bags_score * modifier)),
    }

    return sorted(scores.items(), key=lambda x: x[1], reverse=True)


def get_expected_perf(score: int) -> str:
    if score >= 85:
        return "Excellent (Highly Recommended)"
    elif score >= 70:
        return "Good (Suitable)"
    elif score >= 50:
        return "Fair (Acceptable)"
    else:
        return "Poor (Not Recommended)"


def batch_row_to_fabric_input(batch) -> dict:
    """Map SQLite batch record keys to feature column names for fabric scoring."""
    b = dict(batch) if not isinstance(batch, dict) else batch
    return {
        "Tensile Strength of yarn (MPa)": b["predicted_strength"],
        "Fiber Tenacity of yarn (gm/tex)": b["tenacity"],
        "Fineness of yarn (tex)": b["fineness"],
        "Elongation of yarn (%)": b["elongation"],
        "Moisture Regain of yarn (%)": b["moisture_regain"],
        "Water Swelling of yarn (%)": b["water_swelling"],
        "True Density of yarn (gms/cc)": b["density"],
        "Porosity of yarn (%)": b["porosity"],
    }
