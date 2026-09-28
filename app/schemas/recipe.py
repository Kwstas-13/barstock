from pydantic import BaseModel
from datetime import datetime


class RecipeBase(BaseModel):
    name: str
    is_cocktail: bool = False


class RecipeCreate(RecipeBase):
    pass


class RecipeUpdate(BaseModel):
    name: str | None = None
    is_cocktail: bool | None = None


class RecipeOut(RecipeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True