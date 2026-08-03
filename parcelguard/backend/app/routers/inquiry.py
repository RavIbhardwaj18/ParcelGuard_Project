# backend/app/routers/inquiry.py
"""
Fraud Inquiry / Investigation Router
======================================
Case management system for confirmed or suspected fraud events.
"""
import uuid
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.inquiry import Inquiry, InquiryStatus, InquirySeverity
from app.schemas.fraud import InquiryCreate, InquiryUpdate, InquiryOut

router = APIRouter()


@router.post("", response_model=InquiryOut, status_code=201)
def create_inquiry(payload: InquiryCreate, db: Session = Depends(get_db)):
    """Manually create an inquiry case. Auto-creation happens via fraud detector."""
    # Generate case number: PG-YYYY-NNNNNN
    year = datetime.utcnow().year
    count = db.query(Inquiry).count() + 1
    case_number = f"PG-{year}-{count:06d}"

    inquiry = Inquiry(
        id=uuid.uuid4(),
        case_number=case_number,
        parcel_id=str(payload.parcel_id),
        fraud_event_id=str(payload.fraud_event_id) if payload.fraud_event_id else None,
        accused_seller_id=str(payload.accused_seller_id) if payload.accused_seller_id else None,
        accused_courier_id=str(payload.accused_courier_id) if payload.accused_courier_id else None,
        status=InquiryStatus.OPEN,
        severity=payload.severity,
        title=payload.title,
        description=payload.description,
        auto_created=0,
        timeline=[{
            "timestamp": datetime.utcnow().isoformat(),
            "actor": "admin",
            "action": "inquiry_created",
            "note": "Manually created by administrator",
        }],
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return inquiry


@router.get("", response_model=List[InquiryOut])
def list_inquiries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Inquiry)
    if status:
        q = q.filter(Inquiry.status == status)
    if severity:
        q = q.filter(Inquiry.severity == severity)
    if assigned_to:
        q = q.filter(Inquiry.assigned_to == assigned_to)

    return (
        q.order_by(Inquiry.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )


@router.get("/{inquiry_id}", response_model=InquiryOut)
def get_inquiry(inquiry_id: str, db: Session = Depends(get_db)):
    inq = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not inq:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return inq


@router.patch("/{inquiry_id}", response_model=InquiryOut)
def update_inquiry(
    inquiry_id: str,
    payload: InquiryUpdate,
    actor: str = "admin",
    db: Session = Depends(get_db),
):
    """Update inquiry status, assignment, notes, etc. Appends to timeline."""
    inq = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not inq:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    update_data = payload.model_dump(exclude_unset=True)
    timeline_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "actor": actor,
        "action": "status_updated",
        "note": "",
    }

    for field, value in update_data.items():
        if field == "status" and value:
            timeline_entry["action"] = f"status_changed_to_{value}"
            timeline_entry["note"] = f"Status changed to {value}"
            if value in ["resolved_fraud", "resolved_cleared"]:
                inq.resolved_at = datetime.utcnow()
                inq.resolved_by = actor
        elif field == "assigned_to" and value:
            timeline_entry["action"] = "assigned"
            timeline_entry["note"] = f"Assigned to {value}"
            inq.assigned_at = datetime.utcnow()
        setattr(inq, field, value)

    # Append to timeline (JSON column)
    current_timeline = inq.timeline or []
    current_timeline.append(timeline_entry)
    inq.timeline = current_timeline
    inq.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(inq)
    return inq


@router.post("/{inquiry_id}/note")
def add_note(
    inquiry_id: str,
    note: str,
    actor: str = "admin",
    db: Session = Depends(get_db),
):
    """Add a timeline note to an inquiry."""
    inq = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not inq:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "actor": actor,
        "action": "note_added",
        "note": note,
    }
    current = inq.timeline or []
    current.append(entry)
    inq.timeline = current
    db.commit()
    return {"message": "Note added", "entry": entry}


# =============================================================================
# backend/app/routers/trust.py
# =============================================================================
from app.models.user import Seller, Courier
from app.models.trust import TrustEvent, TrustEventType
from app.schemas.fraud import TrustScoreOut, TrustEventOut

trust_router = APIRouter()


@trust_router.get("/sellers", response_model=List[dict])
def list_seller_scores(
    min_score: Optional[float] = Query(None),
    flagged_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    q = db.query(Seller)
    if min_score is not None:
        q = q.filter(Seller.trust_score >= min_score)
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


@trust_router.get("/couriers", response_model=List[dict])
def list_courier_scores(
    min_score: Optional[float] = Query(None),
    flagged_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    q = db.query(Courier)
    if min_score is not None:
        q = q.filter(Courier.trust_score >= min_score)
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


@trust_router.get("/seller/{seller_id}/history")
def seller_trust_history(seller_id: str, db: Session = Depends(get_db)):
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    events = (
        db.query(TrustEvent)
        .filter(TrustEvent.seller_id == seller_id)
        .order_by(TrustEvent.created_at.desc())
        .limit(50)
        .all()
    )
    return {
        "seller": {"id": str(seller.id), "name": seller.name, "trust_score": seller.trust_score},
        "history": events,
    }


@trust_router.get("/courier/{courier_id}/history")
def courier_trust_history(courier_id: str, db: Session = Depends(get_db)):
    courier = db.query(Courier).filter(Courier.id == courier_id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Courier not found")
    events = (
        db.query(TrustEvent)
        .filter(TrustEvent.courier_id == courier_id)
        .order_by(TrustEvent.created_at.desc())
        .limit(50)
        .all()
    )
    return {
        "courier": {"id": str(courier.id), "name": courier.name, "trust_score": courier.trust_score},
        "history": events,
    }


# =============================================================================
# backend/app/routers/heatmap.py
# =============================================================================
heatmap_router = APIRouter()


@heatmap_router.get("/geojson")
def get_fraud_heatmap(
    days: int = Query(30, ge=1, le=365),
    min_score: float = Query(0, ge=0, le=100),
    db: Session = Depends(get_db),
):
    """
    Returns GeoJSON FeatureCollection of fraud events for Leaflet.js heatmap.
    Each feature has coordinates and fraud score as intensity.
    """
    from datetime import timedelta
    from app.models.fraud import FraudEvent

    since = datetime.utcnow() - timedelta(days=days)
    events = (
        db.query(FraudEvent)
        .filter(
            FraudEvent.detected_at >= since,
            FraudEvent.total_fraud_score >= min_score,
            FraudEvent.fraud_location_lat.isnot(None),
        )
        .all()
    )

    features = []
    for e in events:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [e.fraud_location_lng, e.fraud_location_lat],
            },
            "properties": {
                "id": str(e.id),
                "fraud_type": e.fraud_type.value,
                "score": e.total_fraud_score,
                "city": e.fraud_location_city,
                "detected_at": e.detected_at.isoformat(),
                # Intensity for Leaflet heatmap plugin (0–1)
                "intensity": round(e.total_fraud_score / 100, 2),
            },
        })

    return {
        "type": "FeatureCollection",
        "features": features,
        "meta": {
            "total_events": len(features),
            "days_range": days,
            "min_score": min_score,
        },
    }


@heatmap_router.get("/hotspots")
def get_hotspots(db: Session = Depends(get_db)):
    """Aggregate fraud events by city for the hotspot summary table."""
    from sqlalchemy import func
    from app.models.fraud import FraudEvent

    results = (
        db.query(
            FraudEvent.fraud_location_city,
            FraudEvent.fraud_location_country,
            func.count(FraudEvent.id).label("event_count"),
            func.avg(FraudEvent.total_fraud_score).label("avg_score"),
            func.max(FraudEvent.total_fraud_score).label("max_score"),
        )
        .filter(FraudEvent.fraud_location_city.isnot(None))
        .group_by(FraudEvent.fraud_location_city, FraudEvent.fraud_location_country)
        .order_by(func.count(FraudEvent.id).desc())
        .limit(20)
        .all()
    )

    return [
        {
            "city": r.fraud_location_city,
            "country": r.fraud_location_country,
            "event_count": r.event_count,
            "avg_score": round(r.avg_score or 0, 1),
            "max_score": round(r.max_score or 0, 1),
            "risk_level": "high" if r.event_count >= 3 else "medium" if r.event_count >= 2 else "low",
        }
        for r in results
    ]


# =============================================================================
# backend/app/routers/admin.py
# =============================================================================
admin_router = APIRouter()


@admin_router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Full dashboard summary for Admin Dashboard page.
    Returns KPIs, recent fraud events, top risky actors.
    """
    from sqlalchemy import func
    from app.models.parcel import Parcel
    from app.models.fraud import FraudEvent
    from app.models.inquiry import Inquiry
    from app.models.user import Seller, Courier

    total_parcels    = db.query(func.count(Parcel.id)).scalar() or 0
    total_fraud      = db.query(func.count(FraudEvent.id)).scalar() or 0
    open_inquiries   = db.query(func.count(Inquiry.id)).filter(
                           Inquiry.status.in_(["open", "assigned", "under_review"])
                       ).scalar() or 0
    high_risk        = db.query(func.count(Parcel.id)).filter(
                           Parcel.fraud_risk == "high"
                       ).scalar() or 0
    avg_seller_trust = db.query(func.avg(Seller.trust_score)).scalar() or 0
    avg_courier_trust= db.query(func.avg(Courier.trust_score)).scalar() or 0

    fraud_rate = round((total_fraud / total_parcels * 100) if total_parcels > 0 else 0, 2)

    recent_fraud = (
        db.query(FraudEvent)
        .order_by(FraudEvent.detected_at.desc())
        .limit(10)
        .all()
    )

    # Top risky sellers (lowest trust scores)
    risky_sellers = (
        db.query(Seller)
        .order_by(Seller.trust_score)
        .limit(5)
        .all()
    )
    risky_couriers = (
        db.query(Courier)
        .order_by(Courier.trust_score)
        .limit(5)
        .all()
    )

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
            {
                "id": str(e.id),
                "parcel_id": str(e.parcel_id),
                "fraud_type": e.fraud_type.value,
                "score": e.total_fraud_score,
                "status": e.status.value,
                "city": e.fraud_location_city,
                "detected_at": e.detected_at.isoformat(),
            }
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


@admin_router.post("/sellers", status_code=201)
def create_seller(payload: dict, db: Session = Depends(get_db)):
    from app.models.user import Seller
    seller = Seller(id=uuid.uuid4(), **payload)
    db.add(seller)
    db.commit()
    db.refresh(seller)
    return seller


@admin_router.post("/couriers", status_code=201)
def create_courier(payload: dict, db: Session = Depends(get_db)):
    from app.models.user import Courier
    courier = Courier(id=uuid.uuid4(), **payload)
    db.add(courier)
    db.commit()
    db.refresh(courier)
    return courier


@admin_router.patch("/sellers/{seller_id}/flag")
def flag_seller(seller_id: str, is_flagged: bool, db: Session = Depends(get_db)):
    from app.models.user import Seller
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    seller.is_flagged = is_flagged
    db.commit()
    return {"message": f"Seller {'flagged' if is_flagged else 'unflagged'}", "id": seller_id}


@admin_router.patch("/couriers/{courier_id}/suspend")
def suspend_courier(courier_id: str, is_suspended: bool, db: Session = Depends(get_db)):
    from app.models.user import Courier
    courier = db.query(Courier).filter(Courier.id == courier_id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Courier not found")
    courier.is_suspended = is_suspended
    db.commit()
    return {"message": f"Courier {'suspended' if is_suspended else 'reinstated'}", "id": courier_id}


# ── Wire sub-routers into the module ─────────────────────────────────────────
# These are imported in main.py as the named `router` from each file.
# We inline them all here for convenience — split into separate files in prod.

from fastapi import APIRouter as _APIRouter

# Re-export named routers for main.py imports
from app.routers.inquiry import router as _inq_router  # noqa

# Make trust, heatmap, admin importable as router
trust_module_router = trust_router
heatmap_module_router = heatmap_router
admin_module_router = admin_router
