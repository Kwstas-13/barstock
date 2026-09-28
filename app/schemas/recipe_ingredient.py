from pydantic import BaseModel


class RecipeIngredientBase(BaseModel):
    recipe_id: int
    product_id: int
    quantity_ml: int


class RecipeIngredientCreate(RecipeIngredientBase):
    pass


class RecipeIngredientUpdate(BaseModel):
    quantity_ml: int | None = None


class RecipeIngredientOut(RecipeIngredientBase):
    id: int

    class Config:
        from_attributes = True