from sqlalchemy import Column, Integer, ForeignKey, DateTime, Numeric, func
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    ordered_at = Column(DateTime(timezone=True), server_default=func.now())

    # ΝΕΟ: "φωτογραφία" τη στιγμή του χτυπήματος, για ΕΝΑ ποτό
    unit_price = Column(Numeric(10, 2), nullable=True)
    unit_cost = Column(Numeric(10, 4), nullable=True)