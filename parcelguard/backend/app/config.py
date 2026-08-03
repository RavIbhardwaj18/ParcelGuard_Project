# backend/app/config.py
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/parcelguard"

    # ── App ───────────────────────────────────────────────
    SECRET_KEY: str = "parcelguard-dev-secret-change-in-prod"
    APP_ENV: str = "development"
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 50

    # ── AI Model ──────────────────────────────────────────
    MODEL_CACHE_DIR: str = "./model_cache"

    # ── Fraud Thresholds ──────────────────────────────────
    FRAUD_HIGH_THRESHOLD: float = 70.0    # Auto-open inquiry
    FRAUD_MEDIUM_THRESHOLD: float = 30.0  # Flag for review

    # ── Fraud Score Weights (must sum to 1.0) ─────────────
    WEIGHT_IMAGE_DELTA: float = 0.40
    WEIGHT_WEIGHT_DELTA: float = 0.25
    WEIGHT_RFID_MISMATCH: float = 0.20
    WEIGHT_DIM_DELTA: float = 0.15

    # ── Trust Score ───────────────────────────────────────
    TRUST_INITIAL_SCORE: float = 80.0
    TRUST_FRAUD_PENALTY: float = 15.0
    TRUST_CLEAN_REWARD: float = 1.5
    TRUST_MIN_SCORE: float = 0.0
    TRUST_MAX_SCORE: float = 100.0

    # ── CORS ──────────────────────────────────────────────
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",  # Main frontend
        "http://localhost:3001",  # Customer portal
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
