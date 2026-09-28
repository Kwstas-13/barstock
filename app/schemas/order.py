from pydantic import BaseModel, Field
from datetime import datetime


class OrderCreate(BaseModel):
    recipe_id: int
    shift_id: int
    user_id: int
    quantity: int = Field(default=1, gt=0)


class OrderOut(OrderCreate):
    id: int
    ordered_at: datetime

    class Config:
        from_attributes = True