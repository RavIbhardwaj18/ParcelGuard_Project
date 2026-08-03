# backend/app/models/user.py
"""
Sellers and Couriers are the two actor types in ParcelGuard.
Both can be implicated in fraud. Both carry trust scores.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class ActorType(str, enum.Enum):
    SELLER = "seller"
    COURIER = "courier"


class Seller(Base):
    __tablename__ = "sellers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), default="US")

    # Trust
    trust_score = Column(Float, default=80.0, nullable=False)
    is_flagged = Column(Boolean, default=False)
    is_suspended = Column(Boolean, default=False)

    # Stats
    total_parcels = Column(Float, default=0)
    fraud_count = Column(Float, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    parcels = relationship("Parcel", back_populates="seller")
    trust_events = relationship("TrustEvent", back_populates="seller",
                                 foreign_keys="TrustEvent.seller_id")

    def __repr__(self):
        return f"<Seller {self.name} score={self.trust_score}>"


class Courier(Base):
    __tablename__ = "couriers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    employee_id = Column(String(100), unique=True, nullable=True)
    company = Column(String(255), nullable=True)  # e.g. FedEx, DHL

    # Current assignment
    current_route = Column(String(255), nullable=True)
    base_city = Column(String(100), nullable=True)
    base_country = Column(String(100), default="US")

    # Trust
    trust_score = Column(Float, default=80.0, nullable=False)
    is_flagged = Column(Boolean, default=False)
    is_suspended = Column(Boolean, default=False)

    # Stats
    total_deliveries = Column(Float, default=0)
    fraud_count = Column(Float, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    checkpoints = relationship("DeliveryCheckpoint", back_populates="courier")
    trust_events = relationship("TrustEvent", back_populates="courier",
                                 foreign_keys="TrustEvent.courier_id")

    def __repr__(self):
        return f"<Courier {self.name} score={self.trust_score}>"
