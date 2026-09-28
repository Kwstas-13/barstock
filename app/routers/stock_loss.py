from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.stock_loss import StockLoss
from app.models.products import Product
from app.models.par_level import ParLevel
from app.models.shift import Shift
from app.models.user import User
from app.models.stock_movement import StockMovement
from app.schemas.stock_loss import StockLossCreate, StockLossOut

router = APIRouter(prefix="/stock-losses", tags=["Stock Losses"])


@router.post("/", response_model=StockLossOut)
def create_stock_loss(loss_in: StockLossCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == loss_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    shift = db.query(Shift).filter(Shift.id == loss_in.shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    if shift.status != "OPEN":
        raise HTTPException(status_code=400, detail="Shift is not open")

    user = db.query(User).filter(User.id == loss_in.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    par_level = (
        db.query(ParLevel)
        .filter(
            ParLevel.product_id == loss_in.product_id,
            ParLevel.shift_id == loss_in.shift_id,
        )
        .first()
    )
    if not par_level:
        raise HTTPException(
            status_code=400,
            detail="No par level for this product in this shift",
        )

    new_loss = StockLoss(
        product_id=loss_in.product_id,
        shift_id=loss_in.shift_id,
        user_id=loss_in.user_id,
        quantity_ml=loss_in.quantity_ml,
        loss_type=loss_in.loss_type.value,
        note=loss_in.note,
    )
    db.add(new_loss)
    db.flush()  # παίρνουμε το new_loss.id πριν το commit

    par_level.current_quantity_ml -= loss_in.quantity_ml

    db.add(
        StockMovement(
            product_id=loss_in.product_id,
            shift_id=loss_in.shift_id,
            quantity_ml=-loss_in.quantity_ml,
            source_type="STOCK_LOSS",
            source_id=new_loss.id,
        )
    )

    db.commit()
    db.refresh(new_loss)
    return new_loss


@router.get("/", response_model=list[StockLossOut])
def get_stock_losses(db: Session = Depends(get_db)):
    return db.query(StockLoss).all()


@router.get("/{loss_id}", response_model=StockLossOut)
def get_stock_loss(loss_id: int, db: Session = Depends(get_db)):
    loss = db.query(StockLoss).filter(StockLoss.id == loss_id).first()
    if not loss:
        raise HTTPException(status_code=404, detail="Stock loss not found")
    return loss