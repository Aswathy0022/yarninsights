def get_optimizer_suggestions(row) -> list[dict]:
    """Ported verbatim from app.py's get_optimizer_suggestions."""
    suggestions = []

    tenacity = float(row["Fiber Tenacity of yarn (gm/tex)"])
    if tenacity < 42.0:
        opt_ten = 45.0
        diff = opt_ten - tenacity
        suggestions.append({
            "parameter": "Fiber Tenacity",
            "current": f"{tenacity:.2f} gm/tex",
            "target": f"{opt_ten:.1f} gm/tex",
            "impact": f"+{diff * 8.5:.1f} MPa Strength Boost",
            "action": "Select higher tenacity raw lint fibers, optimize carding and spinning speed, reduce drafts.",
        })

    moisture = float(row["Moisture Content of yarn (%)"])
    if moisture < 10.0 or moisture > 11.5:
        opt_m = 10.8
        suggestions.append({
            "parameter": "Moisture Content",
            "current": f"{moisture:.2f}%",
            "target": f"{opt_m:.1f}%",
            "impact": "Improves Elasticity & Lowers Defect Risk",
            "action": "Adjust humidifier outputs in the conditioning room, ensure aging is done for at least 24 hours.",
        })

    porosity = float(row["Porosity of yarn (%)"])
    if porosity > 8.5:
        opt_p = 6.8
        diff = porosity - opt_p
        suggestions.append({
            "parameter": "Porosity",
            "current": f"{porosity:.2f}%",
            "target": f"{opt_p:.1f}%",
            "impact": f"+{diff * 12.0:.1f} MPa Strength & Compactness",
            "action": "Increase twist multipliers during ring frame processing, check traveler size, and spindle centering.",
        })

    fineness = float(row["Fineness of yarn (tex)"])
    if fineness > 2.8:
        opt_f = 2.4
        suggestions.append({
            "parameter": "Fineness (Yarn Count)",
            "current": f"{fineness:.2f} tex",
            "target": f"{opt_f:.1f} tex",
            "impact": "Increases Surface Smoothness & Premium Grade",
            "action": "Use longer staple cotton length, adjust drawing draft ratios, and reduce sliver hank weight.",
        })

    if not suggestions:
        suggestions.append({
            "parameter": "Parameters Optimized",
            "current": "Ideal values",
            "target": "N/A",
            "impact": "No changes needed",
            "action": "Current parameters are at optimal thresholds for production.",
        })

    return suggestions
