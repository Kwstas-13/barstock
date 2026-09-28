from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base


class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, nullable=False, default="OPEN")  # OPEN or CLOSED
    opened_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)