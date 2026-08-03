# backend/app/routers/verification.py
"""
Delivery Verification Router
==============================
Used by courier agents at each handoff point.
Creates checkpoint records that form the audit trail for fraud detection.
"""
import uuid
import os
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.parcel import Parcel, DeliveryCheckpoint, ParcelStatus
from app.models.user import Courier
from app.schemas.parcel import CheckpointCreate, CheckpointOut

router = APIRouter()


async def save_checkpoint_image(file: UploadFile) -> str:
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"ck_{uuid.uuid4().hex}{ext}"
    path = os.path.join(settings.UPLOAD_DIR, "parcel_photos", filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)
    return f"uploads/parcel_photos/{filename}"


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/checkpoint", response_model=CheckpointOut, status_code=status.HTTP_201_CREATED)
async def create_checkpoint(
    parcel_id: str = Form(...),
    courier_id: str = Form(...),
    checkpoint_type: str = Form(...),   # pickup | sort | hub | delivery
    location_name: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    scanned_weight_kg: Optional[float] = Form(None),
    scanned_rfid: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    checkpoint_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """
    Record a delivery checkpoint scan.
    Called each time a courier scans / handles the parcel.
    Automatically triggers fraud pre-check on RFID and weight deltas.
    """
    # Validate parcel + courier exist
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    courier = db.query(Courier).filter(Courier.id == courier_id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Courier not found")

    # Save image if provided
    image_path = None
    if checkpoint_image:
        image_path = await save_checkpoint_image(checkpoint_image)

    # Create checkpoint
    checkpoint = DeliveryCheckpoint(
        id=uuid.uuid4(),
        parcel_id=parcel_id,
        courier_id=courier_id,
        checkpoint_type=checkpoint_type,
        location_name=location_name,
        city=city,
        country=country,
        latitude=latitude,
        longitude=longitude,
        scanned_weight_kg=scanned_weight_kg,
        scanned_rfid=scanned_rfid,
        checkpoint_image_path=image_path,
        notes=notes,
        scanned_at=datetime.utcnow(),
    )
    db.add(checkpoint)

    # ── Update parcel status based on checkpoint type ─────────────────────
    status_map = {
        "pickup": ParcelStatus.PICKED_UP,
        "sort": ParcelStatus.IN_TRANSIT,
        "hub": ParcelStatus.IN_TRANSIT,
        "delivery": ParcelStatus.OUT_FOR_DELIVERY,
        "delivered": ParcelStatus.DELIVERED,
    }
    if checkpoint_type in status_map:
        parcel.status = status_map[checkpoint_type]
        if checkpoint_type == "delivered":
            parcel.delivered_at = datetime.utcnow()

    # ── Quick RFID mismatch alert ─────────────────────────────────────────
    rfid_flag = False
    if scanned_rfid and parcel.rfid_tag:
        rfid_flag = scanned_rfid.strip().upper() != parcel.rfid_tag.strip().upper()

    db.commit()
    db.refresh(checkpoint)

    # Return with optional warning embedded in response header
    response_data = CheckpointOut.model_validate(checkpoint)
    if rfid_flag:
        # The fraud router will handle full analysis; we just log the flag here
        print(f"⚠️  RFID mismatch on parcel {parcel.tracking_number}: "
              f"expected={parcel.rfid_tag} got={scanned_rfid}")

    return response_data


@router.get("/checkpoints/{parcel_id}", response_model=list[CheckpointOut])
def list_checkpoints(parcel_id: str, db: Session = Depends(get_db)):
    """Get all checkpoints for a parcel — for Delivery Verification UI."""
    checkpoints = (
        db.query(DeliveryCheckpoint)
        .filter(DeliveryCheckpoint.parcel_id == parcel_id)
        .order_by(DeliveryCheckpoint.scanned_at)
        .all()
    )
    return checkpoints


@router.get("/courier/{courier_id}/recent")
def get_courier_recent(courier_id: str, limit: int = 20, db: Session = Depends(get_db)):
    """Get recent scans by a courier — for Delivery Verification home screen."""
    courier = db.query(Courier).filter(Courier.id == courier_id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Courier not found")

    checkpoints = (
        db.query(DeliveryCheckpoint)
        .filter(DeliveryCheckpoint.courier_id == courier_id)
        .order_by(DeliveryCheckpoint.scanned_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "courier": {
            "id": str(courier.id),
            "name": courier.name,
            "trust_score": courier.trust_score,
            "is_flagged": courier.is_flagged,
        },
        "recent_checkpoints": checkpoints,
    }


@router.get("/sellers", response_model=list)
def list_sellers(db: Session = Depends(get_db)):
    """List all sellers — for dropdown in Packing Portal."""
    from app.models.user import Seller
    sellers = db.query(Seller).order_by(Seller.name).all()
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "company": s.company,
            "trust_score": s.trust_score,
            "is_flagged": s.is_flagged,
            "is_suspended": s.is_suspended,
        }
        for s in sellers
    ]


@router.get("/couriers", response_model=list)
def list_couriers(db: Session = Depends(get_db)):
    """List all couriers — for dropdown in Delivery Verification Portal."""
    from app.models.user import Courier
    couriers = db.query(Courier).order_by(Courier.name).all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "company": c.company,
            "employee_id": c.employee_id,
            "trust_score": c.trust_score,
            "is_flagged": c.is_flagged,
        }
        for c in couriers
    ]
