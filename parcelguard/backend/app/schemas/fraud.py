# backend/app/schemas/fraud.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from app.models.fraud import FraudType, FraudStatus


class FraudEventOut(BaseModel):
    id: UUID
    parcel_id: UUID
    fraud_type: FraudType
    status: FraudStatus

    seller_id: Optional[UUID]
    courier_id: Optional[UUID]

    total_fraud_score: float
    image_similarity_score: Optional[float]
    image_delta_score: Optional[float]
    weight_delta_kg: Optional[float]
    weight_delta_score: Optional[float]
    rfid_matched: Optional[bool]
    rfid_score: Optional[float]
    dim_delta_score: Optional[float]

    evidence_data: Optional[Dict[str, Any]]
    fraud_location_city: Optional[str]
    fraud_location_lat: Optional[float]
    fraud_location_lng: Optional[float]

    detected_at: datetime
    admin_notes: Optional[str]

    model_config = {"from_attributes": True}


class FraudAnalysisRequest(BaseModel):
    """Trigger AI analysis for a parcel."""
    parcel_id: UUID


class FraudAnalysisResult(BaseModel):
    """Returned by /api/fraud/analyze"""
    parcel_id: UUID
    total_fraud_score: float
    fraud_risk: str           # low | medium | high
    fraud_type: Optional[str]
    attributed_to: Optional[str]   # "seller" | "courier" | "both" | None

    # Signal breakdown
    image_similarity_packing_vs_courier: Optional[float]
    image_similarity_packing_vs_customer: Optional[float]
    weight_delta_kg: Optional[float]
    rfid_matched: Optional[bool]

    # Summary
    summary: str              # Human-readable explanation
    auto_inquiry_opened: bool
    inquiry_id: Optional[UUID]


# ─────────────────────────────────────────────────────────────────────────────
# backend/app/schemas/trust.py
# ─────────────────────────────────────────────────────────────────────────────
from app.models.trust import TrustEventType


class TrustEventOut(BaseModel):
    id: UUID
    seller_id: Optional[UUID]
    courier_id: Optional[UUID]
    event_type: TrustEventType
    score_before: float
    score_change: float
    score_after: float
    reason: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class TrustScoreOut(BaseModel):
    """Current trust score summary for a seller or courier."""
    actor_id: UUID
    actor_type: str        # "seller" | "courier"
    actor_name: str
    current_score: float
    is_flagged: bool
    is_suspended: bool
    total_transactions: float
    fraud_count: float
    recent_events: List[TrustEventOut]


# ─────────────────────────────────────────────────────────────────────────────
# backend/app/schemas/inquiry.py
# ─────────────────────────────────────────────────────────────────────────────
from app.models.inquiry import InquiryStatus, InquirySeverity


class InquiryCreate(BaseModel):
    parcel_id: UUID
    fraud_event_id: Optional[UUID] = None
    accused_seller_id: Optional[UUID] = None
    accused_courier_id: Optional[UUID] = None
    severity: InquirySeverity = InquirySeverity.MEDIUM
    title: str
    description: Optional[str] = None


class InquiryUpdate(BaseModel):
    status: Optional[InquiryStatus] = None
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None
    severity: Optional[InquirySeverity] = None
    compensation_amount_usd: Optional[float] = None


class InquiryTimelineEntry(BaseModel):
    timestamp: str
    actor: str
    action: str
    note: str


class InquiryOut(BaseModel):
    id: UUID
    case_number: str
    parcel_id: UUID
    fraud_event_id: Optional[UUID]
    accused_seller_id: Optional[UUID]
    accused_courier_id: Optional[UUID]
    status: InquiryStatus
    severity: InquirySeverity
    title: str
    description: Optional[str]
    assigned_to: Optional[str]
    assigned_at: Optional[datetime]
    resolution_notes: Optional[str]
    resolved_at: Optional[datetime]
    timeline: List[Dict[str, Any]]
    compensation_amount_usd: Optional[float]
    auto_created: float
    created_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────────────────────────
# backend/app/schemas/user.py
# ─────────────────────────────────────────────────────────────────────────────

class SellerCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "US"


class SellerOut(BaseModel):
    id: UUID
    name: str
    email: str
    company: Optional[str]
    city: Optional[str]
    trust_score: float
    is_flagged: bool
    is_suspended: bool
    total_parcels: float
    fraud_count: float
    created_at: datetime

    model_config = {"from_attributes": True}


class CourierCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    company: Optional[str] = None
    base_city: Optional[str] = None
    base_country: Optional[str] = "US"


class CourierOut(BaseModel):
    id: UUID
    name: str
    email: str
    employee_id: Optional[str]
    company: Optional[str]
    base_city: Optional[str]
    trust_score: float
    is_flagged: bool
    is_suspended: bool
    total_deliveries: float
    fraud_count: float
    created_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────────────────────────
# Admin Dashboard summary schema
# ─────────────────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_parcels: int
    total_fraud_events: int
    open_inquiries: int
    high_risk_parcels: int
    avg_seller_trust: float
    avg_courier_trust: float
    fraud_rate_percent: float
    recent_fraud_events: List[FraudEventOut]
