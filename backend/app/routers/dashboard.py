from fastapi import APIRouter, Depends

from app.constants import ALL_ROLES, ROLE_ADMIN, ROLE_PRODUCTION_MANAGER
from app.core.deps import CurrentUser, require_role
from app.services import dashboard_service

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard/kpis")
def kpis(current_user: CurrentUser = Depends(require_role(ROLE_ADMIN, ROLE_PRODUCTION_MANAGER))):
    return dashboard_service.get_kpis()


@router.get("/home/summary")
def home_summary(current_user: CurrentUser = Depends(require_role(*ALL_ROLES))):
    return dashboard_service.get_home_summary()
