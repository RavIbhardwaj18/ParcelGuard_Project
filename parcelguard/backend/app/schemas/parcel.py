# backend/app/schemas/parcel.py
"""
Pydantic v2 schemas for request validation and response serialization.
Separate from SQLAlchemy models — these are the API contract.
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.parcel import ParcelStatus, FraudRisk


# ── Parcel Schemas ────────────────────────────────────────────────────────────

class ParcelCreate(BaseModel):
    """Sent by Packing Portal when a parcel is logged."""
    seller_id: UUID
    declared_weight_kg: float = Field(..., gt=0, le=500)
    declared_length_cm: float = Field(..., gt=0)
    declared_width_cm: float = Field(..., gt=0)
    declared_height_cm: float = Field(..., gt=0)
    declared_value_usd: Optional[float] = None
    item_description: Optional[str] = None
    rfid_tag: Optional[str] = None

    origin_city: Optional[str] = None
    origin_country: Optional[str] = "US"
    origin_lat: Optional[float] = None
    origin_lng: Optional[float] = None

    destination_city: Optional[str] = None
    destination_country: Optional[str] = None
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None

    customer_name: Optional[str] = None
    customer_email: Optional[str] = None


class ParcelUpdate(BaseModel):
    """Partial update — any field optional."""
    status: Optional[ParcelStatus] = None
    rfid_tag: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None


class ParcelOut(BaseModel):
    """Full parcel response returned to frontend."""
    id: UUID
    tracking_number: str
    seller_id: UUID
    status: ParcelStatus
    fraud_risk: FraudRisk
    fraud_score: Optional[float]

    declared_weight_kg: float
    declared_length_cm: float
    declared_width_cm: float
    declared_height_cm: float
    declared_value_usd: Optional[float]
    item_description: Optional[str]
    rfid_tag: Optional[str]

    xray_image_path: Optional[str]
    packing_image_path: Optional[str]
    customer_image_path: Optional[str]
    customer_video_path: Optional[str]

    origin_city: Optional[str]
    destination_city: Optional[str]

    customer_name: Optional[str]
    customer_email: Optional[str]
    customer_verified_at: Optional[datetime]

    packed_at: datetime
    delivered_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class ParcelListOut(BaseModel):
    """Paginated list response."""
    items: List[ParcelOut]
    total: int
    page: int
    page_size: int


# ── Checkpoint Schemas ────────────────────────────────────────────────────────

class CheckpointCreate(BaseModel):
    """Sent by Delivery Verification portal."""
    parcel_id: UUID
    courier_id: UUID
    checkpoint_type: str  # pickup | sort | hub | delivery
    location_name: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    scanned_weight_kg: Optional[float] = None
    scanned_rfid: Optional[str] = None
    notes: Optional[str] = None


class CheckpointOut(BaseModel):
    id: UUID
    parcel_id: UUID
    courier_id: UUID
    checkpoint_type: str
    location_name: Optional[str]
    city: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    scanned_weight_kg: Optional[float]
    scanned_rfid: Optional[str]
    checkpoint_image_path: Optional[str]
    scanned_at: datetime

    model_config = {"from_attributes": True}


# ── Customer Verification Schemas ──────────────────────────────────────────────

class CustomerVerifyRequest(BaseModel):
    """Sent by customer portal — minimal info, images uploaded separately."""
    parcel_tracking_number: str
    customer_name: str
    customer_email: str
    complaint_description: Optional[str] = None


class CustomerVerifyOut(BaseModel):
    parcel_id: UUID
    tracking_number: str
    status: str
    fraud_risk: FraudRisk
    message: str
    claim_id: Optional[UUID] = None  # Links to inquiry if opened
