from fastapi import APIRouter, Depends, HTTPException, status

from app.config import ALLOW_DEMO_USERS
from app.constants import SELF_SIGNUP_ROLES
from app.core.deps import CurrentUser, get_current_user
from app.core.security import create_access_token
from app.repositories import audit_repo, users_repo
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    ok, name, role = users_repo.verify_login(payload.email, payload.password)
    if not ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    token = create_access_token(email=payload.email.strip().lower(), name=name, role=role)
    audit_repo.log_audit(payload.email, "LOGIN", "User logged in")
    return TokenResponse(access_token=token, user=UserOut(email=payload.email.strip().lower(), name=name, role=role))


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest):
    role = payload.normalized_role()
    ok, message = users_repo.create_user(payload.email, payload.name, payload.password, role)
    if not ok:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=message)
    audit_repo.log_audit(payload.email, "USER_SIGNUP", f"Created user {payload.name} with role {role}.")
    return {"message": message}


@router.post("/logout")
def logout(current_user: CurrentUser = Depends(get_current_user)):
    audit_repo.log_audit(current_user.email, "LOGOUT", "User logged out")
    return {"message": "Logged out."}


@router.get("/me", response_model=UserOut)
def me(current_user: CurrentUser = Depends(get_current_user)):
    return UserOut(email=current_user.email, name=current_user.name, role=current_user.role)


@router.get("/demo-mode")
def demo_mode():
    return {"allow_demo_users": ALLOW_DEMO_USERS, "self_signup_roles": SELF_SIGNUP_ROLES}
