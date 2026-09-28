from enum import Enum
from datetime import datetime

from pydantic import BaseModel, Field


class Role(str, Enum):
    MANAGER = "MANAGER"
    STAFF = "STAFF"


class UserCreate(BaseModel):
    name: str
    role: Role
    email: str
    password: str = Field(min_length=6, max_length=32)


class UserUpdate(BaseModel):
    name: str | None = None
    role: Role | None = None


class UserOut(BaseModel):
    id: int
    name: str
    role: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True