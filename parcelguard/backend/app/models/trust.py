# backend/app/models/trust.py
"""
TrustEvent is an immutable ledger of every score change for a seller or courier.
This enables a full audit trail and score history charts.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Enum, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class TrustEventType(str, enum.Enum):
    # Negative events
    FRAUD_CONFIRMED = "fraud_confirmed"         # -15 points
    FRAUD_SUSPECTED = "fraud_suspected"         # -5 points (unconfirmed)
    LATE_DELIVERY = "late_delivery"             # -2 points
    COMPLAINT_FILED = "complaint_filed"         # -3 points

    # Positive events
    CLEAN_DELIVERY = "clean_delivery"           # +1.5 points
    FRAUD_DISMISSED = "fraud_dismissed"         # +5 points (false positive recovery)
    MANUAL_REVIEW_CLEARED = "manual_review_cleared"  # +3 points

    # Administrative
    MANUAL_ADJUSTMENT = "manual_adjustment"     # Admin override
    ACCOUNT_CREATED = "account_created"         # Initial score set


class TrustEvent(Base):
    __tablename__ = "trust_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # One of these will be set (not both)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id"), nullable=True, index=True)
    courier_id = Column(UUID(as_uuid=True), ForeignKey("couriers.id"), nullable=True, index=True)

    event_type = Column(Enum(TrustEventType), nullable=False)
    score_before = Column(Float, nullable=False)
    score_change = Column(Float, nullable=False)   # + or - delta
    score_after = Column(Float, nullable=False)

    # What caused this event
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), nullable=True)
    fraud_event_id = Column(UUID(as_uuid=True), ForeignKey("fraud_events.id"), nullable=True)
    reason = Column(Text, nullable=True)      # Human-readable reason
    created_by = Column(String(255), nullable=True)  # "system" or admin email

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    seller = relationship("Seller", back_populates="trust_events", foreign_keys=[seller_id])
    courier = relationship("Courier", back_populates="trust_events", foreign_keys=[courier_id])

    def __repr__(self):
        actor = f"seller={self.seller_id}" if self.seller_id else f"courier={self.courier_id}"
        return f"<TrustEvent {self.event_type} {self.score_change:+.1f} [{actor}]>"
