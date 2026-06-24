from pydantic import BaseModel, EmailStr, Field

from app.schemas.auth import UserOut


class AdminUserCreate(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=12)
    role: str


class AdminUserRoleUpdate(BaseModel):
    role: str


class AuditLogOut(BaseModel):
    id: int
    timestamp: str
    user_email: str
    action: str
    details: str


class SystemConfigOut(BaseModel):
    db_path: str
    csv_path: str
    password_iterations: int
    allow_demo_users: bool
    model_r2: float | None = None
    model_accuracy: float | None = None
