from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.par_level import ParLevel
from app.schemas.par_level import ParLevelCreate, ParLevelUpdate, ParLevelOut

router = APIRouter(prefix="/par-levels", tags=["Par Levels"])


@router.post("/", response_model=ParLevelOut)
def create_par_level(par_level: ParLevelCreate, db: Session = Depends(get_db)):
    new_par_level = ParLevel(**par_level.model_dump())
    db.add(new_par_level)
    db.commit()
    db.refresh(new_par_level)
    return new_par_level


@router.get("/", response_model=list[ParLevelOut])
def get_par_levels(db: Session = Depends(get_db)):
    return db.query(ParLevel).order_by(ParLevel.id).all()


@router.get("/{par_level_id}", response_model=ParLevelOut)
def get_par_level(par_level_id: int, db: Session = Depends(get_db)):
    par_level = db.query(ParLevel).filter(ParLevel.id == par_level_id).first()
    if not par_level:
        raise HTTPException(status_code=404, detail="Par level not found")
    return par_level


@router.put("/{par_level_id}", response_model=ParLevelOut)
def update_par_level(par_level_id: int, updates: ParLevelUpdate, db: Session = Depends(get_db)):
    par_level = db.query(ParLevel).filter(ParLevel.id == par_level_id).first()
    if not par_level:
        raise HTTPException(status_code=404, detail="Par level not found")

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(par_level, field, value)

    db.commit()
    db.refresh(par_level)
    return par_level


@router.delete("/{par_level_id}")
def delete_par_level(par_level_id: int, db: Session = Depends(get_db)):
    par_level = db.query(ParLevel).filter(ParLevel.id == par_level_id).first()
    if not par_level:
        raise HTTPException(status_code=404, detail="Par level not found")

    db.delete(par_level)
    db.commit()
    return {"detail": "Par level deleted"}