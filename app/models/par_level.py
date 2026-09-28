from sqlalchemy import Column, Integer, ForeignKey
from app.database import Base


class ParLevel(Base):
    __tablename__ = "par_levels"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=False)
    ideal_quantity_ml = Column(Integer, nullable=False)
    current_quantity_ml = Column(Integer, nullable=False)
    threshold_percent = Column(Integer, nullable=False, default=30)