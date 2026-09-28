from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from app.database import Base


class StockLoss(Base):
    __tablename__ = "stock_losses"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity_ml = Column(Integer, nullable=False)
    loss_type = Column(String, nullable=False)  # STAFF_DRINK, BREAKAGE, SPILLAGE, OTHER
    note = Column(String, nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())