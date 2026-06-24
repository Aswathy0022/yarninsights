from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.config import ALLOW_DEMO_USERS, CSV_PATH, DB_PATH, PASSWORD_ITERATIONS
from app.constants import ROLE_ADMIN
from app.core.deps import CurrentUser, require_role
from app.repositories import audit_repo, predictions_repo, users_repo
from app.schemas.admin import AdminUserCreate, AdminUserRoleUpdate, SystemConfigOut

router = APIRouter(prefix="/api/admin", tags=["admin"])

_allowed = require_role(ROLE_ADMIN)


@router.get("/users")
def list_users(current_user: CurrentUser = Depends(_allowed)):
    return users_repo.list_users()


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(payload: AdminUserCreate, current_user: CurrentUser = Depends(_allowed)):
    ok, message = users_repo.create_user(payload.email, payload.name, payload.password, payload.role)
    if not ok:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=message)
    audit_repo.log_audit(current_user.email, "USER_CREATE", f"Created account for {payload.email} ({payload.role})")
    return users_repo.get_user(payload.email)


@router.patch("/users/{email}")
def update_user_role(email: str, payload: AdminUserRoleUpdate, current_user: CurrentUser = Depends(_allowed)):
    if not users_repo.update_user_role(email, payload.role):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    audit_repo.log_audit(current_user.email, "USER_ROLE_CHANGE", f"Changed role for {email} to {payload.role}")
    return users_repo.get_user(email)


@router.delete("/users/{email}")
def delete_user(email: str, current_user: CurrentUser = Depends(_allowed)):
    if not users_repo.delete_user(email):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    audit_repo.log_audit(current_user.email, "USER_DELETE", f"Deleted user {email}")
    return {"message": f"User {email} deleted."}


@router.get("/audit-log")
def get_audit_log(limit: int = 150, current_user: CurrentUser = Depends(_allowed)):
    return audit_repo.get_audit_logs(limit=limit)


@router.delete("/audit-log")
def clear_audit_log(current_user: CurrentUser = Depends(_allowed)):
    audit_repo.clear_audit_logs()
    return {"message": "Audit logs cleared."}


@router.delete("/prediction-history")
def clear_prediction_history(current_user: CurrentUser = Depends(_allowed)):
    predictions_repo.clear_prediction_history()
    return {"message": "Prediction history cleared."}


@router.get("/config", response_model=SystemConfigOut)
def get_config(request: Request, current_user: CurrentUser = Depends(_allowed)):
    registry = getattr(request.app.state, "model_registry", None)
    return SystemConfigOut(
        db_path=DB_PATH,
        csv_path=CSV_PATH,
        password_iterations=PASSWORD_ITERATIONS,
        allow_demo_users=ALLOW_DEMO_USERS,
        model_r2=registry.r2_score if registry else None,
        model_accuracy=registry.acc_score if registry else None,
    )
