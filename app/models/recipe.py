from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, func
from app.database import Base


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    is_cocktail = Column(Boolean, nullable=False, default=False)
    sell_price = Column(Numeric(10, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())