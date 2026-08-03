# backend/app/routers/trust.py
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import Seller, Courier
from app.models.trust import TrustEvent

router = APIRouter()


@router.get("/sellers")
def list_seller_scores(
    flagged_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    q = db.query(Seller)
    if flagged_only:
        q = q.filter(Seller.is_flagged == True)
    sellers = q.order_by(Seller.trust_score).all()
    return [
        {
            "id": str(s.id), "name": s.name, "company": s.company,
            "trust_score": s.trust_score, "is_flagged": s.is_flagged,
            "is_suspended": s.is_suspended, "fraud_count": s.fraud_count,
            "total_parcels": s.total_parcels,
        }
        for s in sellers
    ]


@router.get("/couriers")
def list_courier_scores(
    flagged_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    q = db.query(Courier)
    if flagged_only:
        q = q.filter(Courier.is_flagged == True)
    couriers = q.order_by(Courier.trust_score).all()
    return [
        {
            "id": str(c.id), "name": c.name, "company": c.company,
            "employee_id": c.employee_id, "trust_score": c.trust_score,
            "is_flagged": c.is_flagged, "is_suspended": c.is_suspended,
            "fraud_count": c.fraud_count, "total_deliveries": c.total_deliveries,
        }
        for c in couriers
    ]


@router.get("/seller/{seller_id}/history")
def seller_trust_history(seller_id: str, db: Session = Depends(get_db)):
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    events = (
        db.query(TrustEvent)
        .filter(TrustEvent.seller_id == seller_id)
        .order_by(TrustEvent.created_at.desc())
        .limit(50).all()
    )
    return {
        "seller": {"id": str(seller.id), "name": seller.name, "trust_score": seller.trust_score},
        "history": events,
    }


@router.get("/courier/{courier_id}/history")
def courier_trust_history(courier_id: str, db: Session = Depends(get_db)):
    courier = db.query(Courier).filter(Courier.id == courier_id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Courier not found")
    events = (
        db.query(TrustEvent)
        .filter(TrustEvent.courier_id == courier_id)
        .order_by(TrustEvent.created_at.desc())
        .limit(50).all()
    )
    return {
        "courier": {"id": str(courier.id), "name": courier.name, "trust_score": courier.trust_score},
        "history": events,
    }
