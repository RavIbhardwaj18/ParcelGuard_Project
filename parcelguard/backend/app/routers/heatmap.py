# backend/app/routers/heatmap.py
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.fraud import FraudEvent

router = APIRouter()


@router.get("/geojson")
def get_fraud_heatmap(
    days: int = Query(30, ge=1, le=365),
    min_score: float = Query(0, ge=0, le=100),
    db: Session = Depends(get_db),
):
    """GeoJSON FeatureCollection for Leaflet.js heatmap."""
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
    features = [
        {
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
                "intensity": round(e.total_fraud_score / 100, 2),
            },
        }
        for e in events
    ]
    return {"type": "FeatureCollection", "features": features,
            "meta": {"total_events": len(features), "days_range": days}}


@router.get("/hotspots")
def get_hotspots(db: Session = Depends(get_db)):
    results = (
        db.query(
            FraudEvent.fraud_location_city,
            FraudEvent.fraud_location_country,
            func.count(FraudEvent.id).label("event_count"),
            func.avg(FraudEvent.total_fraud_score).label("avg_score"),
        )
        .filter(FraudEvent.fraud_location_city.isnot(None))
        .group_by(FraudEvent.fraud_location_city, FraudEvent.fraud_location_country)
        .order_by(func.count(FraudEvent.id).desc())
        .limit(20).all()
    )
    return [
        {
            "city": r.fraud_location_city,
            "country": r.fraud_location_country,
            "event_count": r.event_count,
            "avg_score": round(r.avg_score or 0, 1),
            "risk_level": "high" if r.event_count >= 3 else "medium" if r.event_count >= 2 else "low",
        }
        for r in results
    ]
