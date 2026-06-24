from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import io

from app.constants import ALL_ROLES
from app.core.deps import CurrentUser, require_role
from app.repositories import audit_repo, batches_repo
from app.reports.certificate import build_certificate_preview, generate_quality_certificate_pdf
from app.reports.excel_export import export_batches_to_excel

router = APIRouter(prefix="/api/reports", tags=["reports"])

# Production Manager has full Reports & Certificates access including PDF
# generation, per the user's explicit override of the BRD's QE+Admin-only text.
_allowed = require_role(*ALL_ROLES)


@router.get("/batches")
def list_reportable_batches(current_user: CurrentUser = Depends(_allowed)):
    # Separate from GET /api/batches (Admin/QE-only Batch Management) so
    # Production Manager can populate the certificate selector without
    # gaining full batch CRUD access.
    df = batches_repo.get_batches()
    return df.to_dict("records")


@router.get("/certificate/{batch_id}/preview")
def certificate_preview(batch_id: str, current_user: CurrentUser = Depends(_allowed)):
    batch = batches_repo.get_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")
    return build_certificate_preview(batch)


@router.get("/certificate/{batch_id}")
def certificate_pdf(batch_id: str, current_user: CurrentUser = Depends(_allowed)):
    batch = batches_repo.get_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")
    pdf_bytes = generate_quality_certificate_pdf(batch)
    audit_repo.log_audit(current_user.email, "CERT_GEN", f"Generated certificate for {batch_id}")
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=certificate_{batch_id}.pdf"},
    )


@router.get("/export/excel")
def export_excel(current_user: CurrentUser = Depends(_allowed)):
    df = batches_repo.get_batches()
    excel_bytes = export_batches_to_excel(df)
    audit_repo.log_audit(current_user.email, "EXPORT_EXCEL", "Exported batch inventory to Excel")
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=yarninsight_batches.xlsx"},
    )
