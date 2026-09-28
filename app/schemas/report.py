from pydantic import BaseModel
from datetime import datetime


class AlertItem(BaseModel):
    product_id: int
    product_name: str
    current_quantity_ml: int
    ideal_quantity_ml: int
    percent_remaining: float
    threshold_percent: int
    bottles_to_order: int
    message: str


class ShiftReportItem(BaseModel):
    product_id: int
    product_name: str
    ideal_quantity_ml: int
    current_quantity_ml: int
    sold_ml: int
    lost_ml: int
    percent_remaining: float
    needs_reorder: bool
    bottles_to_order: int


class ShiftReport(BaseModel):
    shift_id: int
    status: str
    started_at: datetime
    ended_at: datetime | None
    items: list[ShiftReportItem]