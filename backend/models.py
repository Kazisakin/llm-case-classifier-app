from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base

class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text, nullable=False)
    email = Column(String, nullable=False)
    priority = Column(String, nullable=False)
    category = Column(String, nullable=False)
    status = Column(String, default="Pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    escalation_level = Column(Integer, default=0)