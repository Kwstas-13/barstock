from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.recipe_ingredient import RecipeIngredient
from app.schemas.recipe_ingredient import RecipeIngredientCreate, RecipeIngredientUpdate, RecipeIngredientOut

router = APIRouter(prefix="/recipe-ingredients", tags=["Recipe Ingredients"])


@router.post("/", response_model=RecipeIngredientOut)
def create_recipe_ingredient(item: RecipeIngredientCreate, db: Session = Depends(get_db)):
    new_item = RecipeIngredient(**item.model_dump())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.get("/", response_model=list[RecipeIngredientOut])
def get_recipe_ingredients(recipe_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(RecipeIngredient)
    if recipe_id is not None:
        query = query.filter(RecipeIngredient.recipe_id == recipe_id)
    return query.order_by(RecipeIngredient.id).all()


@router.get("/{item_id}", response_model=RecipeIngredientOut)
def get_recipe_ingredient(item_id: int, db: Session = Depends(get_db)):
    item = db.query(RecipeIngredient).filter(RecipeIngredient.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Recipe ingredient not found")
    return item


@router.put("/{item_id}", response_model=RecipeIngredientOut)
def update_recipe_ingredient(item_id: int, updates: RecipeIngredientUpdate, db: Session = Depends(get_db)):
    item = db.query(RecipeIngredient).filter(RecipeIngredient.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Recipe ingredient not found")

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_recipe_ingredient(item_id: int, db: Session = Depends(get_db)):
    item = db.query(RecipeIngredient).filter(RecipeIngredient.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Recipe ingredient not found")

    db.delete(item)
    db.commit()
    return {"detail": "Recipe ingredient deleted"}