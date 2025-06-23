from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime
import os
from database import SessionLocal, engine
from models import Case, Base
from schemas import CaseRequest, CaseResponse, CaseOut
from logic import handle_category, send_email_notification

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/classify-case", response_model=CaseResponse)
async def classify_case(case: CaseRequest, db: Session = Depends(get_db)):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Classify the case into one of: Fraud, Account Access, Verification, General Inquiry."},
                {"role": "user", "content": case.description}
            ],
            max_tokens=10,
            temperature=0
        )
        category = response.choices[0].message.content.strip()
        status = handle_category(category)
        new_case = Case(
            description=case.description,
            email=case.email,
            priority=case.priority,
            category=category,
            status=status,
            resolved_at=datetime.utcnow() if status == "Resolved" else None
        )
        db.add(new_case)
        db.commit()
        db.refresh(new_case)
        if category == "Account Access":
            send_email_notification(case.email, f"Login issue reported: {case.description}. Status: {status}")
        return CaseResponse(category=category, status=status, escalation_level=0)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception:
        raise HTTPException(status_code=503, detail="API service unavailable or server error")

@app.get("/cases", response_model=list[CaseOut])
def get_all_cases(db: Session = Depends(get_db)):
    cases = db.query(Case).order_by(Case.created_at.desc()).all()
    return cases

@app.get("/cases/stats")
def case_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Case.id)).scalar()
    resolved = db.query(func.count(Case.id)).filter(Case.status == "Resolved").scalar()
    pending = db.query(func.count(Case.id)).filter(Case.status != "Resolved").scalar()
    category_counts = db.query(Case.category, func.count()).group_by(Case.category).all()
    priority_counts = db.query(Case.priority, func.count()).group_by(Case.priority).all()
    daily_counts = db.query(func.date(Case.created_at), func.count()).group_by(func.date(Case.created_at)).all()
    avg_resolution_time = db.query(func.avg(func.julianday(Case.resolved_at) - func.julianday(Case.created_at))).filter(Case.resolved_at != None).scalar() or 0
    return {
        "total_cases": total,
        "resolved_cases": resolved,
        "pending_cases": pending,
        "category_breakdown": dict(category_counts),
        "priority_breakdown": dict(priority_counts),
        "daily_breakdown": dict(daily_counts),
        "avg_resolution_time_days": avg_resolution_time
    }

@app.get("/cases/insights")
def case_insights(db: Session = Depends(get_db)):
    avg_resolution_time = db.query(func.avg(func.julianday(Case.resolved_at) - func.julianday(Case.created_at))).filter(Case.resolved_at != None).scalar() or 0
    top_category = db.query(Case.category, func.count(Case.id)).group_by(Case.category).order_by(func.count(Case.id).desc()).first()
    return {
        "avg_resolution_time_days": avg_resolution_time,
        "top_category": top_category[0] if top_category else None,
        "top_category_count": top_category[1] if top_category else 0
    }

@app.get("/cases/filter", response_model=list[CaseOut])
def filter_cases(status: str | None = Query(None), priority: str | None = Query(None), category: str | None = Query(None), db: Session = Depends(get_db)):
    query = db.query(Case)
    if status:
        query = query.filter(Case.status == status)
    if priority:
        query = query.filter(Case.priority == priority)
    if category:
        query = query.filter(Case.category == category)
    cases = query.order_by(Case.created_at.desc()).all()
    return cases

@app.patch("/cases/{case_id}/resolve", response_model=CaseOut)
async def resolve_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if case.status == "Resolved":
        raise HTTPException(status_code=400, detail="Case is already resolved")
    case.status = "Resolved"
    case.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(case)
    send_email_notification(case.email, f"Case {case.id} resolved: {case.description}")
    return case

@app.patch("/cases/{case_id}/escalate")
async def escalate_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if case.escalation_level >= 2:
        raise HTTPException(status_code=400, detail="Maximum escalation level reached")
    case.escalation_level += 1
    case.status = "Escalated"
    db.commit()
    db.refresh(case)
    send_email_notification(case.email, f"Case {case.id} escalated to level {case.escalation_level}: {case.description}")
    return {"message": "Case escalated", "escalation_level": case.escalation_level}

@app.post("/cases/{case_id}/verify")
async def request_verification(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if case.status == "Resolved":
        raise HTTPException(status_code=400, detail="Case is already resolved")
    case.status = "Verification Requested"
    db.commit()
    db.refresh(case)
    send_email_notification(case.email, f"Verification requested for case {case.id}: {case.description}. Please provide ID.")
    return {"message": "Verification requested", "status": case.status}