# backend/app/models/fraud.py
"""
FraudEvent is created whenever the AI engine detects anomalies above threshold.
It captures the full evidence chain: which signals fired, scores, and attribution.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Enum, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class FraudType(str, enum.Enum):
    SELLER_FRAUD = "seller_fraud"        # Wrong/fake item packed
    COURIER_FRAUD = "courier_fraud"      # Tampered in transit
    RFID_MISMATCH = "rfid_mismatch"      # Tag swap / substitution
    WEIGHT_FRAUD = "weight_fraud"        # Weight discrepancy
    DIMENSION_FRAUD = "dimension_fraud"  # Dimension discrepancy
    MULTI_SIGNAL = "multi_signal"        # Multiple signals fired
    FALSE_POSITIVE = "false_positive"    # Resolved as not fraud


class FraudStatus(str, enum.Enum):
    DETECTED = "detected"          # AI flagged it
    UNDER_REVIEW = "under_review"  # Human is reviewing
    CONFIRMED = "confirmed"        # Confirmed as fraud
    DISMISSED = "dismissed"        # Dismissed — false positive
    RESOLVED = "resolved"          # Resolved & compensated


class FraudEvent(Base):
    __tablename__ = "fraud_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), nullable=False, index=True)

    # ── Attribution ───────────────────────────────────────
    fraud_type = Column(Enum(FraudType), nullable=False)
    status = Column(Enum(FraudStatus), default=FraudStatus.DETECTED, nullable=False)

    # Implicated actors (can be one or both)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id"), nullable=True)
    courier_id = Column(UUID(as_uuid=True), ForeignKey("couriers.id"), nullable=True)

    # ── Score breakdown (evidence chain) ──────────────────
    total_fraud_score = Column(Float, nullable=False)      # 0–100 final score

    # Individual signal scores (stored for evidence display)
    image_similarity_score = Column(Float, nullable=True)  # 0–1 (1 = identical, 0 = different)
    image_delta_score = Column(Float, nullable=True)       # Weighted contribution to fraud score
    weight_delta_kg = Column(Float, nullable=True)         # Declared vs measured delta
    weight_delta_score = Column(Float, nullable=True)
    rfid_matched = Column(Boolean, nullable=True)
    rfid_score = Column(Float, nullable=True)
    dim_delta_score = Column(Float, nullable=True)

    # Which checkpoint showed the first anomaly
    first_anomaly_checkpoint_id = Column(UUID(as_uuid=True),
                                          ForeignKey("delivery_checkpoints.id"), nullable=True)

    # ── AI Evidence ───────────────────────────────────────
    # Stores image paths compared, similarity heatmap path, etc.
    evidence_data = Column(JSON, nullable=True)
    """
    evidence_data schema:
    {
      "packing_image": "uploads/parcel_photos/abc.jpg",
      "checkpoint_image": "uploads/parcel_photos/ck1.jpg",
      "customer_image": "uploads/customer_media/cust1.jpg",
      "packing_vs_courier_similarity": 0.42,
      "packing_vs_customer_similarity": 0.38,
      "heatmap_path": "uploads/heatmaps/fraud_abc.jpg"
    }
    """

    # ── Location of fraud ─────────────────────────────────
    fraud_location_city = Column(String(100), nullable=True)
    fraud_location_country = Column(String(100), nullable=True)
    fraud_location_lat = Column(Float, nullable=True)
    fraud_location_lng = Column(Float, nullable=True)

    # ── Admin notes ───────────────────────────────────────
    admin_notes = Column(Text, nullable=True)
    resolved_by = Column(String(255), nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    detected_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Relationships ─────────────────────────────────────
    parcel = relationship("Parcel", back_populates="fraud_events")
    seller = relationship("Seller", foreign_keys=[seller_id])
    courier = relationship("Courier", foreign_keys=[courier_id])
    inquiry = relationship("Inquiry", back_populates="fraud_event", uselist=False)

    def __repr__(self):
        return f"<FraudEvent {self.fraud_type} score={self.total_fraud_score}>"
