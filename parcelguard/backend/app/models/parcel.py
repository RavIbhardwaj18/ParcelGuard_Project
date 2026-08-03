# backend/app/models/parcel.py
"""
Parcel is the central entity in ParcelGuard.
It moves through states: PACKED → IN_TRANSIT → DELIVERED → DISPUTED
Each state transition creates a DeliveryCheckpoint record.
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Boolean, DateTime,
    Enum, Text, ForeignKey, Integer
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class ParcelStatus(str, enum.Enum):
    PACKED = "packed"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    DISPUTED = "disputed"
    INVESTIGATION = "investigation"


class FraudRisk(str, enum.Enum):
    UNKNOWN = "unknown"   # Not yet analyzed
    LOW = "low"           # Score < 30
    MEDIUM = "medium"     # Score 30–70
    HIGH = "high"         # Score > 70


class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tracking_number = Column(String(50), unique=True, nullable=False, index=True)

    # ── Seller / Courier links ─────────────────────────────
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id"), nullable=False)
    seller = relationship("Seller", back_populates="parcels")

    # ── Declared properties (set at packing) ──────────────
    declared_weight_kg = Column(Float, nullable=False)     # e.g. 1.5
    declared_length_cm = Column(Float, nullable=False)
    declared_width_cm = Column(Float, nullable=False)
    declared_height_cm = Column(Float, nullable=False)
    declared_value_usd = Column(Float, nullable=True)
    item_description = Column(Text, nullable=True)
    rfid_tag = Column(String(100), nullable=True, index=True)  # RFID at packing

    # ── Packing images (baseline) ──────────────────────────
    xray_image_path = Column(String(500), nullable=True)        # X-ray at warehouse
    packing_image_path = Column(String(500), nullable=True)     # Photo of packed item
    packing_image_embedding = Column(Text, nullable=True)       # JSON-serialized ResNet vector

    # ── Delivery geo ──────────────────────────────────────
    origin_city = Column(String(100), nullable=True)
    origin_country = Column(String(100), nullable=True)
    origin_lat = Column(Float, nullable=True)
    origin_lng = Column(Float, nullable=True)

    destination_city = Column(String(100), nullable=True)
    destination_country = Column(String(100), nullable=True)
    destination_lat = Column(Float, nullable=True)
    destination_lng = Column(Float, nullable=True)

    # ── Status & risk ─────────────────────────────────────
    status = Column(Enum(ParcelStatus), default=ParcelStatus.PACKED, nullable=False)
    fraud_risk = Column(Enum(FraudRisk), default=FraudRisk.UNKNOWN, nullable=False)
    fraud_score = Column(Float, nullable=True)  # 0–100 computed score

    # ── Customer verification ─────────────────────────────
    customer_name = Column(String(255), nullable=True)
    customer_email = Column(String(255), nullable=True)
    customer_image_path = Column(String(500), nullable=True)   # Customer's received photo
    customer_video_path = Column(String(500), nullable=True)   # Customer's unboxing video
    customer_image_embedding = Column(Text, nullable=True)     # JSON-serialized ResNet vector
    customer_verified_at = Column(DateTime, nullable=True)

    # ── Timestamps ────────────────────────────────────────
    packed_at = Column(DateTime, default=datetime.utcnow)
    picked_up_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Relationships ─────────────────────────────────────
    checkpoints = relationship("DeliveryCheckpoint", back_populates="parcel",
                                order_by="DeliveryCheckpoint.scanned_at")
    fraud_events = relationship("FraudEvent", back_populates="parcel")
    inquiry = relationship("Inquiry", back_populates="parcel", uselist=False)

    def __repr__(self):
        return f"<Parcel {self.tracking_number} status={self.status} risk={self.fraud_risk}>"


class DeliveryCheckpoint(Base):
    """
    Each time a courier scans / handles the parcel, a checkpoint is created.
    This is the audit trail that enables fraud pinpointing.
    Checkpoints in order: PICKUP → SORT_FACILITY → LOCAL_HUB → DELIVERED
    """
    __tablename__ = "delivery_checkpoints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), nullable=False, index=True)
    courier_id = Column(UUID(as_uuid=True), ForeignKey("couriers.id"), nullable=False)

    checkpoint_type = Column(String(50), nullable=False)  # pickup, sort, hub, delivery
    location_name = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Measured values at this checkpoint
    scanned_weight_kg = Column(Float, nullable=True)
    scanned_rfid = Column(String(100), nullable=True)
    checkpoint_image_path = Column(String(500), nullable=True)   # Photo taken at checkpoint
    checkpoint_image_embedding = Column(Text, nullable=True)

    # Notes
    notes = Column(Text, nullable=True)
    scanned_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    parcel = relationship("Parcel", back_populates="checkpoints")
    courier = relationship("Courier", back_populates="checkpoints")

    def __repr__(self):
        return f"<Checkpoint {self.checkpoint_type} @ {self.city}>"
