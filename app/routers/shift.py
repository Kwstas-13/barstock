from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shift import Shift
from app.models.user import User
from app.models.par_level import ParLevel
from app.schemas.shift import ShiftOpen, ShiftOut

router = APIRouter(prefix="/shifts", tags=["Shifts"])

ACTIVE_STATUSES = ["OPEN", "PAUSED"]  # ΝΕΟ: βάρδιες που δεν έχουν κλείσει


def get_shift_or_404(db: Session, shift_id: int) -> Shift:  # ΝΕΟ
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    return shift


@router.post("/", response_model=ShiftOut)
def open_shift(data: ShiftOpen, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.opened_by_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ΑΛΛΑΓΗ: μετράει και τις βάρδιες σε παύση
    already_active = db.query(Shift).filter(Shift.status.in_(ACTIVE_STATUSES)).first()
    if already_active:
        raise HTTPException(
            status_code=400,
            detail=f"Η βάρδια #{already_active.id} δεν έχει κλείσει ακόμα.",
        )

    previous = db.query(Shift).order_by(Shift.id.desc()).first()

    new_shift = Shift(
        started_at=datetime.now(timezone.utc),
        status="OPEN",
        opened_by_user_id=user.id,
    )
    db.add(new_shift)
    db.flush()  # παίρνουμε το new_shift.id πριν το commit

    if previous:
        previous_levels = (
            db.query(ParLevel).filter(ParLevel.shift_id == previous.id).all()
        )
        for level in previous_levels:
            db.add(
                ParLevel(
                    product_id=level.product_id,
                    shift_id=new_shift.id,
                    ideal_quantity_ml=level.ideal_quantity_ml,
                    current_quantity_ml=level.ideal_quantity_ml,
                    threshold_percent=level.threshold_percent,
                )
            )

    db.commit()
    db.refresh(new_shift)
    return new_shift


@router.post("/{shift_id}/pause", response_model=ShiftOut)  # ΝΕΟ
def pause_shift(shift_id: int, db: Session = Depends(get_db)):
    shift = get_shift_or_404(db, shift_id)
    if shift.status != "OPEN":
        raise HTTPException(status_code=400, detail="Μόνο ανοιχτή βάρδια μπαίνει σε παύση.")

    shift.status = "PAUSED"
    db.commit()
    db.refresh(shift)
    return shift


@router.post("/{shift_id}/resume", response_model=ShiftOut)  # ΝΕΟ
def resume_shift(shift_id: int, db: Session = Depends(get_db)):
    shift = get_shift_or_404(db, shift_id)
    if shift.status != "PAUSED":
        raise HTTPException(status_code=400, detail="Η βάρδια δεν είναι σε παύση.")

    shift.status = "OPEN"
    db.commit()
    db.refresh(shift)
    return shift


@router.post("/{shift_id}/close", response_model=ShiftOut)
def close_shift(shift_id: int, db: Session = Depends(get_db)):
    shift = get_shift_or_404(db, shift_id)
    # ΑΛΛΑΓΗ: κλείνει είτε είναι ανοιχτή είτε σε παύση
    if shift.status not in ACTIVE_STATUSES:
        raise HTTPException(status_code=400, detail="Η βάρδια έχει ήδη κλείσει.")

    shift.status = "CLOSED"
    shift.ended_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(shift)
    return shift


@router.get("/", response_model=list[ShiftOut])
def get_shifts(db: Session = Depends(get_db)):
    return db.query(Shift).order_by(Shift.id).all()


@router.get("/{shift_id}", response_model=ShiftOut)
def get_shift(shift_id: int, db: Session = Depends(get_db)):
    return get_shift_or_404(db, shift_id)