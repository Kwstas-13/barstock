from datetime import datetime

from pydantic import BaseModel


class ShiftOpen(BaseModel):
    opened_by_user_id: int


class ShiftOut(BaseModel):
    id: int
    started_at: datetime
    ended_at: datetime | None
    status: str
    opened_by_user_id: int

    class Config:
        from_attributes = True