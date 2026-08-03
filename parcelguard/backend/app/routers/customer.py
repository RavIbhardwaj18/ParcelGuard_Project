# backend/app/routers/customer.py
"""
Customer Portal Router
=======================
PUBLIC endpoints — no auth required.
Called by the separate customer-portal app (port 3001).
CORS must allow origin http://localhost:3001.

Flow:
  1. Customer enters tracking number → GET /api/customer/track/{tracking_number}
  2. Customer uploads photo/video → POST /api/customer/verify
  3. System triggers AI fraud analysis automatically
  4. Customer checks claim status → GET /api/customer/claim/{claim_id}
"""
import uuid
import os
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.parcel import Parcel, ParcelStatus, FraudRisk
from app.models.inquiry import Inquiry
from app.schemas.parcel import CustomerVerifyOut

router = APIRouter()


async def save_customer_media(file: UploadFile, subfolder: str = "customer_media") -> str:
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"cust_{uuid.uuid4().hex}{ext}"
    dir_path = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, filename)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    return f"uploads/{subfolder}/{filename}"


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/track/{tracking_number}")
def track_parcel(tracking_number: str, db: Session = Depends(get_db)):
    """
    Public tracking — customer enters their tracking number.
    Returns safe public info (no internal fraud scores exposed yet).
    """
    parcel = db.query(Parcel).filter(
        Parcel.tracking_number == tracking_number.strip().upper()
    ).first()

    if not parcel:
        raise HTTPException(status_code=404, detail="Tracking number not found. Please check and try again.")

    return {
        "tracking_number": parcel.tracking_number,
        "parcel_id": str(parcel.id),
        "status": parcel.status,
        "item_description": parcel.item_description,
        "origin_city": parcel.origin_city,
        "destination_city": parcel.destination_city,
        "packed_at": parcel.packed_at,
        "delivered_at": parcel.delivered_at,
        "already_verified": parcel.customer_verified_at is not None,
        # Public-safe: only show fraud_risk if HIGH (so customer knows to report)
        "requires_attention": parcel.fraud_risk == FraudRisk.HIGH,
    }


@router.post("/verify", response_model=CustomerVerifyOut, status_code=status.HTTP_201_CREATED)
async def customer_verify(
    tracking_number: str = Form(...),
    customer_name: str = Form(...),
    customer_email: str = Form(...),
    complaint_description: Optional[str] = Form(None),
    received_photo: Optional[UploadFile] = File(None),
    unboxing_video: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """
    Customer submits their received-parcel photo and/or unboxing video.
    This triggers the full AI fraud analysis pipeline automatically.

    Returns:
      - fraud_risk level
      - message for the customer
      - claim_id if an inquiry was auto-opened
    """
    # Find parcel
    parcel = db.query(Parcel).filter(
        Parcel.tracking_number == tracking_number.strip().upper()
    ).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Tracking number not found")

    # Save media
    photo_path = None
    video_path = None
    if received_photo:
        photo_path = await save_customer_media(received_photo)
    if unboxing_video:
        video_path = await save_customer_media(unboxing_video)

    # Update parcel with customer info
    parcel.customer_name = customer_name
    parcel.customer_email = customer_email
    parcel.customer_image_path = photo_path
    parcel.customer_video_path = video_path
    parcel.customer_verified_at = datetime.utcnow()
    db.commit()

    # ── Trigger AI fraud analysis ─────────────────────────────────────────
    inquiry_id = None
    fraud_risk = parcel.fraud_risk

    if parcel.packing_image_path and photo_path:
        # Only run AI if we have both baseline and customer images
        try:
            from app.services.fraud_detector import run_fraud_analysis
            result = run_fraud_analysis(str(parcel.id), db)
            fraud_risk = result["fraud_risk"]
            if result.get("inquiry_id"):
                inquiry_id = result["inquiry_id"]
        except Exception as e:
            print(f"⚠️  Fraud analysis failed (non-blocking): {e}")
            # Don't fail the customer submission — analysis can be triggered manually
    else:
        # No packing image to compare against — mark as pending review
        fraud_risk = FraudRisk.UNKNOWN

    db.refresh(parcel)

    # ── Build customer-friendly message ───────────────────────────────────
    risk_messages = {
        FraudRisk.LOW: "✅ Your parcel looks good! No anomalies detected.",
        FraudRisk.MEDIUM: "⚠️ We noticed some discrepancies. Our team will review your case within 24 hours.",
        FraudRisk.HIGH: "🚨 Significant anomalies detected. A fraud investigation has been opened automatically. You will be contacted shortly.",
        FraudRisk.UNKNOWN: "📋 Your submission has been received. Our team will review it shortly.",
    }
    message = risk_messages.get(fraud_risk, "Your submission has been received.")

    return CustomerVerifyOut(
        parcel_id=parcel.id,
        tracking_number=parcel.tracking_number,
        status=parcel.status.value,
        fraud_risk=fraud_risk,
        message=message,
        claim_id=inquiry_id,
    )


@router.get("/claim/{claim_id}")
def get_claim_status(claim_id: str, db: Session = Depends(get_db)):
    """
    Public claim status — customer checks their investigation status.
    Returns safe public info only (no internal scores).
    """
    inquiry = db.query(Inquiry).filter(Inquiry.id == claim_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Build public-safe timeline (filter internal notes)
    public_timeline = [
        {
            "date": entry.get("timestamp", ""),
            "message": _public_timeline_message(entry.get("action", ""), entry.get("note", "")),
        }
        for entry in (inquiry.timeline or [])
        if entry.get("action") not in ["internal_note", "score_updated"]
    ]

    status_messages = {
        "open": "Your case has been opened and is awaiting assignment.",
        "assigned": "Your case has been assigned to an investigator.",
        "evidence_gathering": "Our team is gathering evidence for your case.",
        "pending_response": "We are awaiting a response from the seller/courier.",
        "under_review": "Your case is currently under active review.",
        "escalated": "Your case has been escalated to senior investigators.",
        "resolved_fraud": "Fraud has been confirmed. Compensation is being processed.",
        "resolved_cleared": "After investigation, no fraud was confirmed.",
        "closed": "This case has been closed.",
    }

    return {
        "case_number": inquiry.case_number,
        "status": inquiry.status,
        "status_message": status_messages.get(inquiry.status.value, ""),
        "severity": inquiry.severity,
        "created_at": inquiry.created_at,
        "resolved_at": inquiry.resolved_at,
        "timeline": public_timeline,
        "compensation_issued": bool(inquiry.compensation_issued),
    }


def _public_timeline_message(action: str, note: str) -> str:
    """Convert internal action codes to customer-friendly messages."""
    action_map = {
        "inquiry_created": "Your fraud investigation case was opened.",
        "assigned": "An investigator has been assigned to your case.",
        "status_updated": "Your case status was updated.",
        "resolved_fraud": "Investigation complete: fraud confirmed.",
        "resolved_cleared": "Investigation complete: no fraud detected.",
    }
    return action_map.get(action, note or "Case updated.")
