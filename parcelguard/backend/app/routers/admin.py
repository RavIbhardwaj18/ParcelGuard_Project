# backend/app/routers/admin.py
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.parcel import Parcel, FraudRisk
from app.models.fraud import FraudEvent, FraudStatus
from app.models.inquiry import Inquiry
from app.models.user import Seller, Courier

router = APIRouter()


@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_parcels     = db.query(func.count(Parcel.id)).scalar() or 0
    total_fraud       = db.query(func.count(FraudEvent.id)).scalar() or 0
    open_inquiries    = db.query(func.count(Inquiry.id)).filter(
                            Inquiry.status.in_(["open", "assigned", "under_review"])
                        ).scalar() or 0
    high_risk         = db.query(func.count(Parcel.id)).filter(
                            Parcel.fraud_risk == "high"
                        ).scalar() or 0
    avg_seller_trust  = db.query(func.avg(Seller.trust_score)).scalar() or 0
    avg_courier_trust = db.query(func.avg(Courier.trust_score)).scalar() or 0
    fraud_rate        = round((total_fraud / total_parcels * 100) if total_parcels > 0 else 0, 2)

    recent_fraud = (
        db.query(FraudEvent).order_by(FraudEvent.detected_at.desc()).limit(10).all()
    )
    risky_sellers  = db.query(Seller).order_by(Seller.trust_score).limit(5).all()
    risky_couriers = db.query(Courier).order_by(Courier.trust_score).limit(5).all()

    return {
        "kpis": {
            "total_parcels": total_parcels,
            "total_fraud_events": total_fraud,
            "open_inquiries": open_inquiries,
            "high_risk_parcels": high_risk,
            "avg_seller_trust": round(avg_seller_trust, 1),
            "avg_courier_trust": round(avg_courier_trust, 1),
            "fraud_rate_percent": fraud_rate,
        },
        "recent_fraud_events": [
            {"id": str(e.id), "parcel_id": str(e.parcel_id),
             "fraud_type": e.fraud_type.value, "score": e.total_fraud_score,
             "status": e.status.value, "city": e.fraud_location_city,
             "detected_at": e.detected_at.isoformat()}
            for e in recent_fraud
        ],
        "risky_sellers": [
            {"id": str(s.id), "name": s.name, "trust_score": s.trust_score,
             "fraud_count": s.fraud_count, "is_flagged": s.is_flagged}
            for s in risky_sellers
        ],
        "risky_couriers": [
            {"id": str(c.id), "name": c.name, "trust_score": c.trust_score,
             "fraud_count": c.fraud_count, "is_flagged": c.is_flagged}
            for c in risky_couriers
        ],
    }


@router.patch("/sellers/{seller_id}/flag")
def flag_seller(seller_id: str, is_flagged: bool, db: Session = Depends(get_db)):
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    seller.is_flagged = is_flagged
    db.commit()
    return {"message": f"Seller {'flagged' if is_flagged else 'unflagged'}"}


@router.patch("/couriers/{courier_id}/suspend")
def suspend_courier(courier_id: str, is_suspended: bool, db: Session = Depends(get_db)):
    courier = db.query(Courier).filter(Courier.id == courier_id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Courier not found")
    courier.is_suspended = is_suspended
    db.commit()
    return {"message": f"Courier {'suspended' if is_suspended else 'reinstated'}"}
