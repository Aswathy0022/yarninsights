import io
import random
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.graphics.shapes import Circle, Drawing, Line, Rect, String

from app.domain.fabric import batch_row_to_fabric_input, cloth_from_rules


def build_yarn_logo_drawing() -> Drawing:
    logo = Drawing(140, 48)
    logo.add(Rect(0, 0, 140, 48, fillColor=colors.HexColor("#f0fdfa"), strokeColor=colors.HexColor("#0f766e"), strokeWidth=1.2, rx=6, ry=6))
    logo.add(Rect(8, 8, 32, 32, fillColor=colors.HexColor("#0f766e"), strokeColor=None, rx=6, ry=6))
    logo.add(String(17, 18, "YI", fontSize=13, fillColor=colors.white, fontName="Helvetica-Bold"))
    logo.add(String(48, 28, "YarnInsight", fontSize=13, fillColor=colors.HexColor("#0f766e"), fontName="Helvetica-Bold"))
    logo.add(String(48, 12, "Industrial Quality Systems", fontSize=7.5, fillColor=colors.HexColor("#64748b"), fontName="Helvetica"))
    return logo


def build_quality_approved_stamp() -> Drawing:
    stamp = Drawing(100, 100)
    stamp.add(Circle(50, 50, 46, fillColor=colors.HexColor("#ecfdf5"), strokeColor=colors.HexColor("#059669"), strokeWidth=2.5))
    stamp.add(Circle(50, 50, 38, fillColor=None, strokeColor=colors.HexColor("#10b981"), strokeWidth=1))
    stamp.add(String(14, 58, "QUALITY", fontSize=9, fillColor=colors.HexColor("#065f46"), fontName="Helvetica-Bold"))
    stamp.add(String(22, 44, "APPROVED", fontSize=9, fillColor=colors.HexColor("#065f46"), fontName="Helvetica-Bold"))
    stamp.add(String(30, 30, "✓", fontSize=14, fillColor=colors.HexColor("#059669"), fontName="Helvetica-Bold"))
    return stamp


def build_mock_qr_drawing(batch_id: str) -> Drawing:
    seed = sum(ord(c) for c in str(batch_id))
    random.seed(seed)
    qr = Drawing(72, 72)
    qr.add(Rect(0, 0, 72, 72, fillColor=colors.white, strokeColor=colors.HexColor("#0f766e"), strokeWidth=1.5))
    for corner in [(4, 48), (48, 48), (4, 4)]:
        qr.add(Rect(corner[0], corner[1], 16, 16, fillColor=colors.HexColor("#0f766e"), strokeColor=None))
        qr.add(Rect(corner[0] + 4, corner[1] + 4, 8, 8, fillColor=colors.white, strokeColor=None))
    for _ in range(18):
        rx = random.choice([22, 26, 30, 34, 38, 42, 46])
        ry = random.choice([22, 26, 30, 34, 38, 42, 46])
        qr.add(Rect(rx, ry, 3, 3, fillColor=colors.HexColor("#0f766e"), strokeColor=None))
    random.seed()
    return qr


def _pdf_draw_branded_frame(canvas, doc):
    canvas.saveState()
    page_w, page_h = letter
    canvas.setFillColor(colors.HexColor("#0f766e"))
    canvas.rect(28, 28, 10, page_h - 56, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#14b8a6"))
    canvas.rect(28, page_h - 80, 10, 52, fill=1, stroke=0)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(colors.HexColor("#94a3b8"))
    canvas.drawString(50, 22, f"YarnInsight Certificate • Batch traceability document • Page {canvas.getPageNumber()}")
    canvas.restoreState()


GRADE_COLOR = {
    "Grade A+ (Premium)": "#059669",
    "Grade A": "#10b981",
    "Grade B": "#d97706",
    "Grade C": "#ea580c",
    "Reject": "#dc2626",
}


def generate_quality_certificate_pdf(batch: dict) -> bytes:
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "CertTitle", parent=styles["Heading1"], fontName="Helvetica-Bold",
        fontSize=22, leading=26, textColor=colors.HexColor("#0f766e"), alignment=1, spaceAfter=10,
    )
    h2_style = ParagraphStyle(
        "CertH2", parent=styles["Heading2"], fontName="Helvetica-Bold",
        fontSize=13, leading=17, textColor=colors.HexColor("#0f172a"), spaceBefore=10, spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "CertBody", parent=styles["BodyText"], fontName="Helvetica",
        fontSize=9.5, leading=13.5, textColor=colors.HexColor("#334155"),
    )
    bold_style = ParagraphStyle(
        "CertBold", parent=styles["BodyText"], fontName="Helvetica-Bold",
        fontSize=9.5, leading=13.5, textColor=colors.HexColor("#0f172a"),
    )

    story = []

    logo_drawing = build_yarn_logo_drawing()
    header_data = [[
        logo_drawing,
        Paragraph(
            "YARNINSIGHT QUALITY VALIDATION CERTIFICATE<br/>"
            f"<font size='9' color='#64748b'>Official Industrial Quality Statement • Generated {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</font>",
            ParagraphStyle("CertHeaderBlock", parent=title_style, alignment=0, fontSize=18, leading=22, spaceAfter=0),
        ),
        build_mock_qr_drawing(batch["batch_id"]),
    ]]
    header_table = Table(header_data, colWidths=[150, 280, 80])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (2, 0), (2, 0), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))

    top_bar = Drawing(510, 4)
    top_bar.add(Rect(0, 0, 510, 4, fillColor=colors.HexColor("#0f766e"), strokeColor=None))
    story.append(top_bar)
    story.append(Spacer(1, 12))

    stamp_drawing = build_quality_approved_stamp()
    grade_color = GRADE_COLOR.get(batch["predicted_grade"], "#0f766e")

    details_data = [
        [Paragraph("Batch ID:", bold_style), Paragraph(str(batch["batch_id"]), body_style),
         Paragraph("Date Processed:", bold_style), Paragraph(str(batch["creation_time"]), body_style)],
        [Paragraph("Raw Supplier:", bold_style), Paragraph(str(batch["supplier_name"]), body_style),
         Paragraph("Dye Bath Mix:", bold_style), Paragraph(str(batch["dye_type"]).upper(), body_style)],
        [Paragraph("Validation Status:", bold_style), Paragraph(f"<b><font color='{grade_color}'>{batch['predicted_grade']}</font></b>", body_style),
         Paragraph("ML Confidence Score:", bold_style), Paragraph(f"{batch['confidence']:.2f}%", body_style)],
        [Paragraph("Tensile Strength:", bold_style), Paragraph(f"{batch['predicted_strength']:.1f} MPa", body_style),
         Paragraph("Quality Risk Level:", bold_style), Paragraph(f"<b>{batch['risk_level']}</b>", body_style)],
    ]

    details_table = Table(details_data, colWidths=[110, 140, 120, 140])
    details_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0f172a")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fafafa")),
    ]))

    stamp_row = Table([[details_table, stamp_drawing]], colWidths=[420, 110])
    stamp_row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, 0), "CENTER"),
    ]))
    story.append(stamp_row)
    story.append(Spacer(1, 15))

    story.append(Paragraph("Detailed Material & Mechanical Assay", h2_style))

    param_data = [
        [Paragraph("<b>Yarn Parameter</b>", bold_style), Paragraph("<b>Measured Value</b>", bold_style), Paragraph("<b>Yarn Parameter</b>", bold_style), Paragraph("<b>Measured Value</b>", bold_style)],
        [Paragraph("Cellulose Content", body_style), Paragraph(f"{batch['cellulose']:.2f}%", body_style), Paragraph("Fineness (Yarn Count)", body_style), Paragraph(f"{batch['fineness']:.2f} tex", body_style)],
        [Paragraph("Hemicellulose Content", body_style), Paragraph(f"{batch['hemicellulose']:.2f}%", body_style), Paragraph("Fiber Tenacity", body_style), Paragraph(f"{batch['tenacity']:.2f} gm/tex", body_style)],
        [Paragraph("Lignin Content", body_style), Paragraph(f"{batch['lignin']:.2f}%", body_style), Paragraph("Elongation limit", body_style), Paragraph(f"{batch['elongation']:.2f}%", body_style)],
        [Paragraph("Pectin Content", body_style), Paragraph(f"{batch['pectin']:.2f}%", body_style), Paragraph("Moisture Regain", body_style), Paragraph(f"{batch['moisture_regain']:.2f}%", body_style)],
        [Paragraph("Ambient Moisture", body_style), Paragraph(f"{batch['moisture_content']:.2f}%", body_style), Paragraph("Water Swelling", body_style), Paragraph(f"{batch['water_swelling']:.2f}%", body_style)],
        [Paragraph("Yarn pH Level", body_style), Paragraph(f"{batch['ph_level']:.2f}", body_style), Paragraph("Yarn Porosity", body_style), Paragraph(f"{batch['porosity']:.2f}%", body_style)],
    ]

    param_table = Table(param_data, colWidths=[140, 125, 140, 125])
    param_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
    ]))

    story.append(param_table)
    story.append(Spacer(1, 15))

    story.append(Paragraph("Recommended Fabric Product Mapping", h2_style))

    recs = cloth_from_rules(batch_row_to_fabric_input(batch), batch["predicted_grade"])
    best_fabric, best_score = recs[0]

    rec_text = (
        f"Based on machine learning classification models and automated production rules, this yarn batch has a peak "
        f"compatibility matching score of <b>{best_score}%</b> for <b>{best_fabric}</b>. Alternative recommended uses "
        f"include: <b>{recs[1][0]} ({recs[1][1]}%)</b> and <b>{recs[2][0]} ({recs[2][1]}%)</b>."
    )
    story.append(Paragraph(rec_text, body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Technical Risk Profile", h2_style))
    story.append(Paragraph(f"<b>Assigned Risk: {batch['risk_level']}</b>", bold_style))
    story.append(Paragraph(f"<b>Underlying parameters:</b> {batch['risk_reasons']}", body_style))

    story.append(Spacer(1, 25))

    sig_line = Drawing(200, 20)
    sig_line.add(Line(0, 10, 180, 18, strokeColor=colors.HexColor("#0f766e"), strokeWidth=1.2))
    sig_line.add(String(0, 0, "Digitally Signed", fontSize=7, fillColor=colors.HexColor("#64748b"), fontName="Helvetica-Oblique"))

    sig_data = [[
        Paragraph("_______________________________<br/>Quality Operations Inspector<br/><font size='8' color='#64748b'>Name & Employee ID</font>", body_style),
        sig_line,
        Paragraph("_______________________________<br/>Plant Quality Manager<br/><font size='8' color='#64748b'>Authorized Release Signature</font>", body_style),
    ]]
    sig_table = Table(sig_data, colWidths=[175, 160, 175])
    sig_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(sig_table)

    doc.build(story, onFirstPage=_pdf_draw_branded_frame, onLaterPages=_pdf_draw_branded_frame)
    pdf_bytes = pdf_buffer.getvalue()
    pdf_buffer.close()
    return pdf_bytes


def build_certificate_preview(batch: dict) -> dict:
    """JSON preview payload for the design's live certificate preview pane."""
    recs = cloth_from_rules(batch_row_to_fabric_input(batch), batch["predicted_grade"])
    return {
        "batch_id": batch["batch_id"],
        "supplier_name": batch["supplier_name"],
        "creation_time": batch["creation_time"],
        "dye_type": batch["dye_type"],
        "predicted_grade": batch["predicted_grade"],
        "grade_color": GRADE_COLOR.get(batch["predicted_grade"], "#0f766e"),
        "confidence": batch["confidence"],
        "predicted_strength": batch["predicted_strength"],
        "risk_level": batch["risk_level"],
        "risk_reasons": batch["risk_reasons"],
        "top_fabrics": [{"fabric": name, "score": score} for name, score in recs[:3]],
    }
