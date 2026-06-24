from fastapi import APIRouter, Depends, HTTPException, status

from app.constants import ROLE_ADMIN, ROLE_QUALITY_ENGINEER
from app.core.deps import CurrentUser, get_registry, require_role
from app.ml.training import ModelRegistry
from app.repositories import batches_repo
from app.schemas.batch import BatchCreate, BatchUpdate
from app.services import batch_service

router = APIRouter(prefix="/api/batches", tags=["batches"])

_allowed = require_role(ROLE_ADMIN, ROLE_QUALITY_ENGINEER)


@router.get("")
def list_batches(
    search: str | None = None,
    grade: str | None = None,
    status_filter: str | None = None,
    current_user: CurrentUser = Depends(_allowed),
):
    return batch_service.list_batches(search, grade, status_filter)


@router.get("/{batch_id}")
def get_batch(batch_id: str, current_user: CurrentUser = Depends(_allowed)):
    batch = batches_repo.get_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")
    return batch


@router.post("", status_code=status.HTTP_201_CREATED)
def create_batch(
    payload: BatchCreate,
    current_user: CurrentUser = Depends(_allowed),
    registry: ModelRegistry = Depends(get_registry),
):
    return batch_service.create_batch(registry, payload, current_user.email)


@router.patch("/{batch_id}")
def update_batch(batch_id: str, payload: BatchUpdate, current_user: CurrentUser = Depends(_allowed)):
    fields = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = batch_service.update_batch(batch_id, fields, current_user.email)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")
    return updated


@router.delete("/{batch_id}")
def delete_batch(batch_id: str, current_user: CurrentUser = Depends(_allowed)):
    if not batch_service.delete_batch(batch_id, current_user.email):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")
    return {"message": f"Batch {batch_id} deleted."}
