# backend/app/models/__init__.py
# Import all models here so Alembic can discover them for migrations

from app.models.user import Seller, Courier, ActorType
from app.models.parcel import Parcel, DeliveryCheckpoint, ParcelStatus, FraudRisk
from app.models.fraud import FraudEvent, FraudType, FraudStatus
from app.models.trust import TrustEvent, TrustEventType
from app.models.inquiry import Inquiry, InquiryStatus, InquirySeverity

__all__ = [
    "Seller", "Courier", "ActorType",
    "Parcel", "DeliveryCheckpoint", "ParcelStatus", "FraudRisk",
    "FraudEvent", "FraudType", "FraudStatus",
    "TrustEvent", "TrustEventType",
    "Inquiry", "InquiryStatus", "InquirySeverity",
]
