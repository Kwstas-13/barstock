from sqlalchemy import Column, Integer, String, DateTime, Numeric, func
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # SPIRIT, MIXER, SYRUP, GARNISH...
    bottle_size_ml = Column(Integer, nullable=False)
    unit = Column(String, nullable=False, default="ml")
    bottle_cost = Column(Numeric(10, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())