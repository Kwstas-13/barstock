from enum import Enum
from datetime import datetime

from pydantic import BaseModel, Field


class LossType(str, Enum):
    STAFF_DRINK = "STAFF_DRINK"
    BREAKAGE = "BREAKAGE"
    SPILLAGE = "SPILLAGE"
    OTHER = "OTHER"


class StockLossCreate(BaseModel):
    product_id: int
    shift_id: int
    user_id: int
    quantity_ml: int = Field(gt=0)
    loss_type: LossType
    note: str | None = None


class StockLossOut(StockLossCreate):
    id: int
    recorded_at: datetime

    class Config:
        from_attributes = True