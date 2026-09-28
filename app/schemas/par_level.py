from pydantic import BaseModel


class ParLevelBase(BaseModel):
    product_id: int
    shift_id: int
    ideal_quantity_ml: int
    current_quantity_ml: int
    threshold_percent: int = 30


class ParLevelCreate(ParLevelBase):
    pass


class ParLevelUpdate(BaseModel):
    ideal_quantity_ml: int | None = None
    current_quantity_ml: int | None = None
    threshold_percent: int | None = None


class ParLevelOut(ParLevelBase):
    id: int

    class Config:
        from_attributes = True