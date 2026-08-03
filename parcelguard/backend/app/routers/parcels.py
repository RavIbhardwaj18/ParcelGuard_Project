# backend/app/routers/parcels.py
"""
Parcel Router
=============
Handles the full parcel lifecycle from packing to delivery.
Used by: Packing Portal, Admin Dashboard
"""
import os
import uuid
import random
import string
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.parcel import Parcel, ParcelStatus, FraudRisk
from app.models.user import Seller
from app.schemas.parcel import ParcelCreate, ParcelUpdate, ParcelOut, ParcelListOut

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

def generate_tracking_number() -> str:
    """PG + 8 alphanumeric chars, e.g. PGX4K9B2M1"""
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=8))
    return f"PG{suffix}"


async def save_upload(file: UploadFile, subfolder: str) -> str:
    """Save an uploaded file and return its relative path."""
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    dir_path = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, filename)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    return f"uploads/{subfolder}/{filename}"


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("", response_model=ParcelOut, status_code=status.HTTP_201_CREATED)
async def create_parcel(
    # Form fields (multipart allows mixing text + files)
    seller_id: str = Form(...),
    declared_weight_kg: float = Form(...),
    declared_length_cm: float = Form(...),
    declared_width_cm: float = Form(...),
    declared_height_cm: float = Form(...),
    declared_value_usd: Optional[float] = Form(None),
    item_description: Optional[str] = Form(None),
    rfid_tag: Optional[str] = Form(None),
    origin_city: Optional[str] = Form(None),
    origin_country: Optional[str] = Form("US"),
    origin_lat: Optional[float] = Form(None),
    origin_lng: Optional[float] = Form(None),
    destination_city: Optional[str] = Form(None),
    destination_country: Optional[str] = Form(None),
    destination_lat: Optional[float] = Form(None),
    destination_lng: Optional[float] = Form(None),
    customer_name: Optional[str] = Form(None),
    customer_email: Optional[str] = Form(None),
    # File uploads
    xray_image: Optional[UploadFile] = File(None),
    packing_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """
    Create a new parcel at the packing stage.
    Called by the Packing Portal when warehouse staff logs a new parcel.
    Accepts multipart/form-data so images can be uploaded alongside metadata.
    """
    # Validate seller exists
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail=f"Seller {seller_id} not found")

    # Save images if provided
    xray_path = await save_upload(xray_image, "xray") if xray_image else None
    packing_path = await save_upload(packing_image, "parcel_photos") if packing_image else None

    parcel = Parcel(
        id=uuid.uuid4(),
        tracking_number=generate_tracking_number(),
        seller_id=seller_id,
        declared_weight_kg=declared_weight_kg,
        declared_length_cm=declared_length_cm,
        declared_width_cm=declared_width_cm,
        declared_height_cm=declared_height_cm,
        declared_value_usd=declared_value_usd,
        item_description=item_description,
        rfid_tag=rfid_tag,
        xray_image_path=xray_path,
        packing_image_path=packing_path,
        origin_city=origin_city,
        origin_country=origin_country,
        origin_lat=origin_lat,
        origin_lng=origin_lng,
        destination_city=destination_city,
        destination_country=destination_country,
        destination_lat=destination_lat,
        destination_lng=destination_lng,
        customer_name=customer_name,
        customer_email=customer_email,
        status=ParcelStatus.PACKED,
        fraud_risk=FraudRisk.UNKNOWN,
    )

    # Update seller stats
    seller.total_parcels = (seller.total_parcels or 0) + 1

    db.add(parcel)
    db.commit()
    db.refresh(parcel)
    return parcel


@router.get("", response_model=ParcelListOut)
def list_parcels(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    fraud_risk: Optional[str] = Query(None),
    seller_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    List parcels with optional filters.
    Used by: Admin Dashboard, Packing Portal list view.
    """
    q = db.query(Parcel)

    if status:
        q = q.filter(Parcel.status == status)
    if fraud_risk:
        q = q.filter(Parcel.fraud_risk == fraud_risk)
    if seller_id:
        q = q.filter(Parcel.seller_id == seller_id)
    if search:
        q = q.filter(Parcel.tracking_number.ilike(f"%{search}%"))

    total = q.count()
    items = (
        q.order_by(Parcel.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ParcelListOut(items=items, total=total, page=page, page_size=page_size)


@router.get("/{parcel_id}", response_model=ParcelOut)
def get_parcel(parcel_id: str, db: Session = Depends(get_db)):
    """Get a single parcel by ID."""
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return parcel


@router.get("/track/{tracking_number}", response_model=ParcelOut)
def get_parcel_by_tracking(tracking_number: str, db: Session = Depends(get_db)):
    """
    Look up parcel by tracking number.
    Used by: Customer Portal public tracking page.
    """
    parcel = db.query(Parcel).filter(
        Parcel.tracking_number == tracking_number.upper()
    ).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Tracking number not found")
    return parcel


@router.patch("/{parcel_id}", response_model=ParcelOut)
def update_parcel(
    parcel_id: str,
    payload: ParcelUpdate,
    db: Session = Depends(get_db),
):
    """Partial update — used to change status, assign RFID, etc."""
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(parcel, field, value)

    parcel.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(parcel)
    return parcel


@router.post("/{parcel_id}/upload-xray", response_model=ParcelOut)
async def upload_xray(
    parcel_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload or replace the X-ray scan image for a parcel."""
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    path = await save_upload(file, "xray")
    parcel.xray_image_path = path
    parcel.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(parcel)
    return parcel


@router.post("/{parcel_id}/upload-packing-image", response_model=ParcelOut)
async def upload_packing_image(
    parcel_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload the packing photo (baseline image for AI comparison)."""
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    path = await save_upload(file, "parcel_photos")
    parcel.packing_image_path = path
    parcel.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(parcel)
    return parcel


@router.delete("/{parcel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_parcel(parcel_id: str, db: Session = Depends(get_db)):
    """Hard delete — for admin/demo purposes only."""
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    db.delete(parcel)
    db.commit()


@router.get("/{parcel_id}/checkpoints")
def get_parcel_checkpoints(parcel_id: str, db: Session = Depends(get_db)):
    """Get all delivery checkpoints for a parcel, in order."""
    from app.models.parcel import DeliveryCheckpoint
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return parcel.checkpoints
