def compute_risk_assessment(row, grade: str) -> tuple[str, str]:
    """Ported verbatim from app.py — thresholds are the real, verified production logic."""
    reasons = []

    strength = float(row["Tensile Strength of yarn (MPa)"])
    if strength < 1350:
        reasons.append(f"Tensile Strength is dangerously low ({strength:.1f} MPa)")
    elif strength < 1500:
        reasons.append(f"Sub-optimal tensile strength ({strength:.1f} MPa)")

    ph = float(row["pH Level of yarn"])
    if ph < 4.8 or ph > 7.2:
        reasons.append(f"pH level ({ph:.1f}) is out of safe industrial bounds")
    elif ph < 5.2 or ph > 6.8:
        reasons.append(f"pH level ({ph:.1f}) requires monitoring")

    porosity = float(row["Porosity of yarn (%)"])
    if porosity > 13.0:
        reasons.append(f"High yarn porosity ({porosity:.1f}%) risks fabric structural integrity")

    tenacity = float(row["Fiber Tenacity of yarn (gm/tex)"])
    if tenacity < 32.0:
        reasons.append(f"Insufficient fiber tenacity ({tenacity:.1f} gm/tex)")

    moisture = float(row["Moisture Content of yarn (%)"])
    if moisture > 12.0:
        reasons.append(f"Excessive moisture ({moisture:.1f}%) - risk of bacterial and mildew growth")
    elif moisture < 9.0:
        reasons.append(f"Low moisture content ({moisture:.1f}%) - fibers are prone to brittle breakage")

    if grade == "Reject" or len(reasons) >= 3:
        risk_level = "High Risk"
    elif grade == "Grade C" or len(reasons) >= 1:
        risk_level = "Medium Risk"
    else:
        risk_level = "Low Risk"

    if not reasons:
        reasons.append("All physical and chemical properties fall within normal thresholds.")

    return risk_level, "; ".join(reasons)
