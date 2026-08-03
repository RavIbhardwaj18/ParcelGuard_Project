# backend/app/models/inquiry.py
"""
Inquiry is a fraud investigation case. 
Created automatically when fraud score > HIGH_THRESHOLD,
or manually by admin.
Each inquiry tracks the full investigation workflow.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Enum, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class InquiryStatus(str, enum.Enum):
    OPEN = "open"                    # Just created, needs assignment
    ASSIGNED = "assigned"            # Assigned to investigator
    EVIDENCE_GATHERING = "evidence_gathering"
    PENDING_RESPONSE = "pending_response"  # Waiting for seller/courier response
    UNDER_REVIEW = "under_review"    # Investigator reviewing
    ESCALATED = "escalated"          # Escalated to senior
    RESOLVED_FRAUD = "resolved_fraud"      # Fraud confirmed
    RESOLVED_CLEARED = "resolved_cleared"  # Cleared — not fraud
    CLOSED = "closed"


class InquirySeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_number = Column(String(50), unique=True, nullable=False, index=True)
    # e.g. "PG-2024-001234"

    # ── Links ─────────────────────────────────────────────
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), nullable=False, index=True)
    fraud_event_id = Column(UUID(as_uuid=True), ForeignKey("fraud_events.id"), nullable=True)

    # Accused parties
    accused_seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id"), nullable=True)
    accused_courier_id = Column(UUID(as_uuid=True), ForeignKey("couriers.id"), nullable=True)

    # ── Case info ─────────────────────────────────────────
    status = Column(Enum(InquiryStatus), default=InquiryStatus.OPEN, nullable=False)
    severity = Column(Enum(InquirySeverity), default=InquirySeverity.MEDIUM, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # ── Assignment ────────────────────────────────────────
    assigned_to = Column(String(255), nullable=True)    # Investigator email/name
    assigned_at = Column(DateTime, nullable=True)

    # ── Resolution ────────────────────────────────────────
    resolution_notes = Column(Text, nullable=True)
    resolved_by = Column(String(255), nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    # ── Timeline (immutable log entries) ──────────────────
    # Stored as JSON array for hackathon speed
    # In production: separate InquiryTimelineEvent table
    timeline = Column(JSON, default=list)
    """
    timeline schema: [
      {
        "timestamp": "2024-01-15T10:30:00",
        "actor": "system",
        "action": "inquiry_created",
        "note": "Auto-created: fraud score 82.4"
      },
      {
        "timestamp": "2024-01-15T11:00:00",
        "actor": "admin@parcelguard.com",
        "action": "assigned",
        "note": "Assigned to investigator John"
      }
    ]
    """

    # ── Compensation ──────────────────────────────────────
    compensation_amount_usd = Column(Float, nullable=True)
    compensation_issued = Column(Float, default=0)  # Boolean-like 0/1

    auto_created = Column(Float, default=1)  # 1 = system created, 0 = manual

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Relationships ─────────────────────────────────────
    parcel = relationship("Parcel", back_populates="inquiry")
    fraud_event = relationship("FraudEvent", back_populates="inquiry")
    accused_seller = relationship("Seller", foreign_keys=[accused_seller_id])
    accused_courier = relationship("Courier", foreign_keys=[accused_courier_id])

    def __repr__(self):
        return f"<Inquiry {self.case_number} status={self.status}>"
