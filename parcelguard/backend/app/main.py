# backend/app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine
from app import models  # noqa: F401 — triggers all model imports

from app.routers import (
    parcels, verification, customer,
    fraud, inquiry, trust, heatmap, admin
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────
    print("🚀 ParcelGuard API starting up...")

    # Create all DB tables (dev convenience — use Alembic in prod)
    from app.database import Base
    Base.metadata.create_all(bind=engine)

    # Ensure upload directories exist
    for sub in ["xray", "parcel_photos", "customer_media", "heatmaps"]:
        os.makedirs(os.path.join(settings.UPLOAD_DIR, sub), exist_ok=True)

    print("✅ Database tables ready")
    print(f"✅ Upload dir: {settings.UPLOAD_DIR}")
    yield
    # ── Shutdown ──────────────────────────────────────────
    print("👋 ParcelGuard API shutting down...")


app = FastAPI(
    title="ParcelGuard API",
    description="AI-Powered Supply Chain Fraud Detection System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Allow both frontend (3000) and customer portal (3001)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static file serving for uploaded images ───────────────────────────────────
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(parcels.router,      prefix="/api/parcels",      tags=["Parcels"])
app.include_router(verification.router, prefix="/api/verification",  tags=["Verification"])
app.include_router(customer.router,     prefix="/api/customer",      tags=["Customer Portal"])
app.include_router(fraud.router,        prefix="/api/fraud",         tags=["Fraud Detection"])
app.include_router(inquiry.router,      prefix="/api/inquiry",       tags=["Inquiry System"])
app.include_router(trust.router,        prefix="/api/trust",         tags=["Trust Scores"])
app.include_router(heatmap.router,      prefix="/api/heatmap",       tags=["Heatmap"])
app.include_router(admin.router,        prefix="/api/admin",         tags=["Admin"])


@app.get("/", tags=["Health"])
def root():
    return {
        "service": "ParcelGuard API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
