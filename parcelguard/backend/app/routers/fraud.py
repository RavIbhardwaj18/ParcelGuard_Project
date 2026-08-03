# backend/app/routers/fraud.py
"""
Fraud Detection Router
=======================
Triggers AI analysis, returns fraud scores, manages fraud event records.
This router is the bridge between the API and the AI services layer.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.parcel import Parcel, FraudRisk
from app.models.fraud import FraudEvent, FraudStatus
from app.schemas.fraud import FraudEventOut, FraudAnalysisRequest, FraudAnalysisResult

router = APIRouter()


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/analyze", response_model=FraudAnalysisResult)
def analyze_parcel(
    payload: FraudAnalysisRequest,
    db: Session = Depends(get_db),
):
    """
    Trigger full AI fraud analysis for a parcel.
    Runs: image comparison + weight delta + RFID check + dimension delta.
    Returns fraud score, risk level, attribution, and auto-opens inquiry if HIGH.

    Called by:
      - Customer portal (auto after photo upload)
      - Admin dashboard (manual trigger)
      - Delivery portal (on final delivery scan)
    """
    parcel = db.query(Parcel).filter(Parcel.id == str(payload.parcel_id)).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    try:
        from app.services.fraud_detector import run_fraud_analysis
        result = run_fraud_analysis(str(payload.parcel_id), db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fraud analysis failed: {str(e)}")


@router.get("/events", response_model=List[FraudEventOut])
def list_fraud_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    fraud_type: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    db: Session = Depends(get_db),
):
    """List all fraud events with optional filters. Used by Admin Dashboard."""
    q = db.query(FraudEvent)

    if status:
        q = q.filter(FraudEvent.status == status)
    if fraud_type:
        q = q.filter(FraudEvent.fraud_type == fraud_type)
    if min_score is not None:
        q = q.filter(FraudEvent.total_fraud_score >= min_score)

    return (
        q.order_by(FraudEvent.detected_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )


@router.get("/events/{event_id}", response_model=FraudEventOut)
def get_fraud_event(event_id: str, db: Session = Depends(get_db)):
    """Get a single fraud event with full evidence details."""
    event = db.query(FraudEvent).filter(FraudEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Fraud event not found")
    return event


@router.get("/parcel/{parcel_id}", response_model=List[FraudEventOut])
def get_parcel_fraud_events(parcel_id: str, db: Session = Depends(get_db)):
    """Get all fraud events for a specific parcel."""
    return (
        db.query(FraudEvent)
        .filter(FraudEvent.parcel_id == parcel_id)
        .order_by(FraudEvent.detected_at.desc())
        .all()
    )


@router.patch("/events/{event_id}/status")
def update_fraud_event_status(
    event_id: str,
    new_status: str,
    admin_notes: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Update fraud event status — used by admin reviewers."""
    event = db.query(FraudEvent).filter(FraudEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Fraud event not found")

    valid_statuses = [s.value for s in FraudStatus]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose: {valid_statuses}")

    event.status = new_status
    if admin_notes:
        event.admin_notes = admin_notes

    db.commit()
    db.refresh(event)
    return {"message": "Status updated", "event_id": event_id, "status": new_status}


@router.get("/stats/summary")
def fraud_summary(db: Session = Depends(get_db)):
    """
    Quick fraud statistics for the Admin Dashboard header.
    Returns counts by type, risk level, status.
    """
    from sqlalchemy import func
    from app.models.parcel import Parcel

    total_events = db.query(func.count(FraudEvent.id)).scalar()
    high_risk = db.query(func.count(Parcel.id)).filter(Parcel.fraud_risk == FraudRisk.HIGH).scalar()
    confirmed = db.query(func.count(FraudEvent.id)).filter(
        FraudEvent.status == FraudStatus.CONFIRMED
    ).scalar()
    avg_score = db.query(func.avg(FraudEvent.total_fraud_score)).scalar()

    # Breakdown by type
    type_counts = (
        db.query(FraudEvent.fraud_type, func.count(FraudEvent.id))
        .group_by(FraudEvent.fraud_type)
        .all()
    )

    return {
        "total_fraud_events": total_events,
        "high_risk_parcels": high_risk,
        "confirmed_fraud": confirmed,
        "average_fraud_score": round(avg_score or 0, 2),
        "breakdown_by_type": {str(t): c for t, c in type_counts},
    }
