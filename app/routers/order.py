from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import Order
from app.models.recipe import Recipe
from app.models.recipe_ingredient import RecipeIngredient
from app.models.par_level import ParLevel
from app.models.shift import Shift
from app.models.user import User
from app.models.stock_movement import StockMovement
from app.schemas.order import OrderCreate, OrderOut

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=OrderOut)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == order_in.recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    shift = db.query(Shift).filter(Shift.id == order_in.shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    if shift.status != "OPEN":
        raise HTTPException(status_code=400, detail="Shift is not open")

    user = db.query(User).filter(User.id == order_in.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    ingredients = (
        db.query(RecipeIngredient)
        .filter(RecipeIngredient.recipe_id == recipe.id)
        .all()
    )
    if not ingredients:
        raise HTTPException(status_code=400, detail="Recipe has no ingredients")

    new_order = Order(**order_in.model_dump())
    db.add(new_order)
    db.flush()  # παίρνουμε το new_order.id χωρίς να κάνουμε commit ακόμα

    for ing in ingredients:
        par_level = (
            db.query(ParLevel)
            .filter(
                ParLevel.product_id == ing.product_id,
                ParLevel.shift_id == order_in.shift_id,
            )
            .first()
        )
        if not par_level:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"No par level for product {ing.product_id} in this shift",
            )

        used_ml = ing.quantity_ml * order_in.quantity
        par_level.current_quantity_ml -= used_ml

        db.add(
            StockMovement(
                product_id=ing.product_id,
                shift_id=order_in.shift_id,
                quantity_ml=-used_ml,
                source_type="ORDER",
                source_id=new_order.id,
            )
        )

    db.commit()
    db.refresh(new_order)
    return new_order


@router.get("/", response_model=list[OrderOut])
def get_orders(db: Session = Depends(get_db)):
    return db.query(Order).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order