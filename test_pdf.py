from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import os

def test_pdf():
    try:
        doc = SimpleDocTemplate("test_pdf.pdf", pagesize=letter)
        styles = getSampleStyleSheet()
        story = [
            Paragraph("YarnInsight PDF Test", styles['Heading1']),
            Spacer(1, 20),
            Paragraph("Reportlab library is working correctly on this system.", styles['BodyText'])
        ]
        doc.build(story)
        if os.path.exists("test_pdf.pdf"):
            print("PDF generation success")
            os.remove("test_pdf.pdf")
        else:
            print("PDF file not found")
    except Exception as e:
        print(f"PDF generation failed: {e}")

if __name__ == "__main__":
    test_pdf()
