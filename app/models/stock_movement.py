from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from app.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=False)
    quantity_ml = Column(Integer, nullable=False)  # πάντα αρνητικό (αφαίρεση)
    source_type = Column(String, nullable=False)  # "ORDER" or "STOCK_LOSS"
    source_id = Column(Integer, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())