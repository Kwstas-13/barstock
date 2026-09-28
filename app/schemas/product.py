from pydantic import BaseModel
from datetime import datetime


class ProductBase(BaseModel):
    name: str
    category: str
    bottle_size_ml: int
    unit: str = "ml"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    bottle_size_ml: int | None = None
    unit: str | None = None


class ProductOut(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True