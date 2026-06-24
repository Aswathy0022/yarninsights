from pydantic import BaseModel, EmailStr, Field

from app.constants import SELF_SIGNUP_ROLES


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=12)
    role: str

    def normalized_role(self) -> str:
        # FR: self-signup is only available for Quality Engineer / Production Manager.
        return self.role if self.role in SELF_SIGNUP_ROLES else SELF_SIGNUP_ROLES[0]


class UserOut(BaseModel):
    email: str
    name: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
