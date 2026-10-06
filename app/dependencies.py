from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shift import Shift


def require_no_open_shift(db: Session = Depends(get_db)):
    open_shift = db.query(Shift).filter(Shift.status == "OPEN").first()
    if open_shift:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Η βάρδια #{open_shift.id} είναι ανοιχτή. "
                "Προϊόντα και συνταγές είναι κλειδωμένα μέχρι να κλείσει."
            ),
        )