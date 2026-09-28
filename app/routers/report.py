import math

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.par_level import ParLevel
from app.models.products import Product
from app.models.shift import Shift
from app.models.stock_movement import StockMovement
from app.schemas.report import AlertItem, ShiftReport, ShiftReportItem

router = APIRouter(prefix="/reports", tags=["Reports"])


def calc_percent(current: int, ideal: int) -> float:
    if ideal <= 0:
        return 0.0
    return round(current / ideal * 100, 1)


def calc_bottles_to_order(current: int, ideal: int, bottle_size_ml: int) -> int:
    missing = ideal - current
    if missing <= 0:
        return 0
    return math.ceil(missing / bottle_size_ml)


def sum_movements(db: Session, shift_id: int, product_id: int, source_type: str) -> int:
    total = (
        db.query(func.coalesce(func.sum(StockMovement.quantity_ml), 0))
        .filter(
            StockMovement.shift_id == shift_id,
            StockMovement.product_id == product_id,
            StockMovement.source_type == source_type,
        )
        .scalar()
    )
    return -int(total)  # οι κινήσεις είναι αρνητικές, το γυρνάμε σε θετικό


@router.get("/alerts", response_model=list[AlertItem])
def get_alerts(shift_id: int, db: Session = Depends(get_db)):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    rows = (
        db.query(ParLevel, Product)
        .join(Product, ParLevel.product_id == Product.id)
        .filter(ParLevel.shift_id == shift_id)
        .all()
    )

    alerts = []
    for par, product in rows:
        percent = calc_percent(par.current_quantity_ml, par.ideal_quantity_ml)
        if percent <= par.threshold_percent:
            alerts.append(
                AlertItem(
                    product_id=product.id,
                    product_name=product.name,
                    current_quantity_ml=par.current_quantity_ml,
                    ideal_quantity_ml=par.ideal_quantity_ml,
                    percent_remaining=percent,
                    threshold_percent=par.threshold_percent,
                    bottles_to_order=calc_bottles_to_order(
                        par.current_quantity_ml, par.ideal_quantity_ml, product.bottle_size_ml
                    ),
                    message=f"Παρακαλώ παραγγείλετε {product.name}",
                )
            )
    return alerts


@router.get("/shift/{shift_id}", response_model=ShiftReport)
def get_shift_report(shift_id: int, db: Session = Depends(get_db)):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    rows = (
        db.query(ParLevel, Product)
        .join(Product, ParLevel.product_id == Product.id)
        .filter(ParLevel.shift_id == shift_id)
        .all()
    )

    items = []
    for par, product in rows:
        percent = calc_percent(par.current_quantity_ml, par.ideal_quantity_ml)
        items.append(
            ShiftReportItem(
                product_id=product.id,
                product_name=product.name,
                ideal_quantity_ml=par.ideal_quantity_ml,
                current_quantity_ml=par.current_quantity_ml,
                sold_ml=sum_movements(db, shift_id, product.id, "ORDER"),
                lost_ml=sum_movements(db, shift_id, product.id, "STOCK_LOSS"),
                percent_remaining=percent,
                needs_reorder=percent <= par.threshold_percent,
                bottles_to_order=calc_bottles_to_order(
                    par.current_quantity_ml, par.ideal_quantity_ml, product.bottle_size_ml
                ),
            )
        )

    return ShiftReport(
        shift_id=shift.id,
        status=shift.status,
        started_at=shift.started_at,
        ended_at=shift.ended_at,
        items=items,
    )