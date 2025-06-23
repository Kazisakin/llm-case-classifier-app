from pydantic import BaseModel, EmailStr, validator
from datetime import datetime

class CaseRequest(BaseModel):
    description: str
    email: EmailStr
    priority: str

    @validator("priority")
    def validate_priority(cls, v):
        if v not in ["Low", "Medium", "High"]:
            raise ValueError("Priority must be Low, Medium, or High")
        return v

class CaseResponse(BaseModel):
    category: str
    status: str
    escalation_level: int

class CaseOut(BaseModel):
    id: int
    description: str
    email: str
    priority: str
    category: str
    status: str
    created_at: datetime
    resolved_at: datetime | None
    escalation_level: int

    class Config:
        orm_mode = True