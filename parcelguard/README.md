# 📦 ParcelGuard

> **AI-powered parcel fraud detection for last-mile supply chains.**  
> Built for the Supply Chain Integrity Hackathon.

---

## What Is It?

ParcelGuard is a full-stack fraud detection platform that catches parcel tampering, item substitution, and courier fraud in real time. It uses a ResNet50-powered image comparison pipeline, RFID verification, weight validation, and trust scoring to assign every parcel a fraud probability score from 0–100.

When something looks wrong, the system opens an investigation case automatically, notifies the customer, and updates trust scores for the seller and courier involved.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTENDS                                                  │
│                                                             │
│  ┌─────────────────────┐   ┌─────────────────────────────┐ │
│  │ Warehouse + Ops UI  │   │   Customer Portal           │ │
│  │ localhost:3000       │   │   localhost:3001            │ │
│  │                     │   │                             │ │
│  │ • Packing Portal    │   │ • Track parcel              │ │
│  │ • Delivery Scan     │   │ • Upload received photo     │ │
│  │ • Admin Dashboard   │   │ • File fraud report         │ │
│  │ • Inquiry System    │   │ • Check claim status        │ │
│  │ • Trust Scores      │   └─────────────────────────────┘ │
│  │ • Fraud Heatmap     │                                   │
│  └─────────────────────┘                                   │
│                                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP / REST
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  API GATEWAY  ·  FastAPI  ·  localhost:8000                  │
│                                                             │
│  /api/parcels         /api/verification                     │
│  /api/fraud           /api/inquiry                          │
│  /api/trust           /api/heatmap                          │
│  /api/admin           /api/customer                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
┌──────────────────┐       ┌──────────────────────┐
│  FRAUD DETECTOR  │       │  IMAGE COMPARATOR    │
│                  │       │                      │
│ Weighted scorer: │       │ ResNet50 embeddings  │
│ • Image  40%     │       │ Cosine similarity    │
│ • Weight 25%     │       │ (packing vs received)│
│ • RFID   20%     │       └──────────────────────┘
│ • Dims   15%     │
└──────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  DATABASE  ·  PostgreSQL  ·  parcelguard                    │
│                                                             │
│  parcels  ·  checkpoints  ·  fraud_events                   │
│  sellers  ·  couriers     ·  inquiries  ·  customers        │
└─────────────────────────────────────────────────────────────┘
```

---

## Fraud Detection Algorithm

Every parcel gets scored 0–100 on four signals, weighted by predictive reliability:

| Signal | Weight | How It Works |
|--------|--------|--------------|
| **Image Similarity** | 40% | ResNet50 embeddings compared between packing X-ray and customer's received-item photo. Cosine similarity < 0.5 = high risk |
| **Weight Delta** | 25% | Declared vs. scanned weight at each checkpoint. > 0.5 kg delta starts contributing to score |
| **RFID Match** | 20% | Binary — tag scanned at delivery must match tag attached at packing. Mismatch = full contribution |
| **Dimension Variance** | 15% | Package dimensions checked at each hub. > 15% variance is flagged |

**Score thresholds:**
- `0–29` → Clean, no action
- `30–49` → Low risk, logged
- `50–69` → Medium risk, flagged for review  
- `70–84` → High risk, investigation auto-opened
- `85–100` → Critical, immediate escalation

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| API Framework | FastAPI 0.104 |
| ORM | SQLAlchemy 2.0 + Alembic migrations |
| Database | PostgreSQL 15 |
| AI / CV | PyTorch, torchvision (ResNet50), Pillow |
| Auth | JWT (python-jose) |
| File storage | Local filesystem (`/uploads`) |

### Frontend — Ops Portal (`:3000`)
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + React Router 6 |
| Build tool | Vite 5 |
| HTTP | Axios 1.6 |
| Maps | Leaflet + react-leaflet |
| State | Zustand |
| Charts | Recharts |
| File upload | react-dropzone |

### Frontend — Customer Portal (`:3001`)
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + React Router 6 |
| Build tool | Vite 5 |
| HTTP | Axios 1.6 |
| File upload | react-dropzone |

---

## Project Structure

```
parcelguard/
│
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS, router mounts
│   │   ├── database.py           # SQLAlchemy engine + session
│   │   ├── config.py             # Settings (env vars)
│   │   ├── models/               # SQLAlchemy ORM models
│   │   │   ├── parcel.py         # Parcels, checkpoints
│   │   │   ├── fraud.py          # FraudEvent, FraudType enum
│   │   │   ├── inquiry.py        # Inquiry, InquiryNote
│   │   │   ├── seller.py         # Seller trust scores
│   │   │   ├── courier.py        # Courier trust scores
│   │   │   └── customer.py       # Customer + verification
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── routers/              # One file per domain
│   │   │   ├── parcels.py        # CRUD + image upload
│   │   │   ├── verification.py   # Checkpoint scanning
│   │   │   ├── fraud.py          # Detection + event management
│   │   │   ├── inquiry.py        # Case management
│   │   │   ├── trust.py          # Trust score read/update
│   │   │   ├── heatmap.py        # GeoJSON fraud distribution
│   │   │   ├── admin.py          # Dashboard KPIs + admin actions
│   │   │   └── customer.py       # Public tracking + report filing
│   │   └── services/
│   │       ├── fraud_detector.py # Weighted scoring engine
│   │       └── image_compare.py  # ResNet50 similarity
│   ├── migrations/               # Alembic migration files
│   ├── seed/seed_data.py         # Demo data population
│   └── requirements.txt
│
├── frontend/                     # Ops portal (port 3000)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── PackingPortal.jsx       # Warehouse intake + photo upload
│   │   │   ├── DeliveryVerification.jsx # Courier checkpoint scanner
│   │   │   ├── AdminDashboard.jsx      # KPIs + fraud event feed
│   │   │   ├── InquirySystem.jsx       # Case management
│   │   │   ├── TrustScores.jsx         # Leaderboard + event history
│   │   │   └── FraudHeatmap.jsx        # Geographic threat map
│   │   ├── api/
│   │   │   ├── client.js               # Axios base instance
│   │   │   └── parcels.js              # All 8 API client modules
│   │   ├── App.jsx                     # Router + sidebar layout
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
└── customer-portal/              # Public portal (port 3001)
    ├── src/
    │   ├── pages/
    │   │   ├── CustomerHome.jsx        # 4-step tracking + report flow
    │   │   └── ClaimStatus.jsx         # Claim investigation tracker
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    └── vite.config.js
```

---

## Database Schema

**7 tables, 12 foreign key relationships, 5 enums**

```
sellers ──────────────────────────────────────────┐
  id (UUID PK)                                    │
  name, email, contact_phone                      │
  trust_score (0.0–100.0, default 80.0)           │
  fraud_count, total_parcels                       │
  is_flagged, is_suspended                         │
                                                   │
couriers ─────────────────────────────────────────┤
  id (UUID PK)                                    │
  name, employee_id, email                         │
  trust_score (0.0–100.0, default 80.0)           │
  is_flagged                                       │
                                                   │
customers                                         │
  id (UUID PK)                                    │
  name, email, phone                              │
                                                   │
parcels ──────────── FK → sellers, customers ─────┤
  id (UUID PK)                                    │
  tracking_number (unique)                         │
  seller_id, customer_id                           │
  weight_kg, dimensions (JSON)                     │
  declared_value, item_description                 │
  rfid_tag, status (enum), risk_level (enum)       │
  fraud_score (0.0–100.0)                          │
  xray_image_path, packing_image_path              │
  origin_city/lat/lng, destination_city/lat/lng    │
  packed_at, delivered_at                          │
                                                   │
checkpoints ─────────── FK → parcels, couriers ───┤
  id (UUID PK)                                    │
  parcel_id, courier_id                           │
  checkpoint_type (enum: PICKUP/SORT_HUB/         │
    HUB_SCAN/OUT_FOR_DELIVERY/DELIVERED)          │
  location_name, city, lat, lng                   │
  scanned_weight, scanned_rfid                    │
  has_anomaly, anomaly_notes                      │
  photo_path, scanned_at                          │
                                                   │
fraud_events ──────────── FK → parcels ───────────┤
  id (UUID PK)                                    │
  parcel_id                                       │
  fraud_type (enum: COURIER_FRAUD/SELLER_FRAUD/   │
    RFID_MISMATCH/WEIGHT_FRAUD/DIMENSION_FRAUD/  │
    IMAGE_ANOMALY/MULTI_SIGNAL/FALSE_POSITIVE)   │
  fraud_score, image_similarity_score             │
  weight_delta_kg, rfid_matched                   │
  status (DETECTED/UNDER_REVIEW/CONFIRMED/        │
    DISMISSED/RESOLVED)                           │
  detected_at, resolved_at                        │
                                                   │
inquiries ─────────────── FK → fraud_events ──────┘
  id (UUID PK)                                    
  fraud_event_id                                  
  case_number (unique, e.g. PG-2024-000012)       
  status (OPEN/UNDER_REVIEW/ESCALATED/            
    RESOLVED_FRAUD/RESOLVED_CLEARED/DISMISSED)   
  severity (LOW/MEDIUM/HIGH/CRITICAL)             
  assigned_to, compensation_issued                
  auto_created (bool — was AI the trigger?)       
  timeline (JSONB)                                
  created_at, resolved_at                         
```

---

## API Reference

**Base URL:** `http://localhost:8000`  
**Interactive docs:** `http://localhost:8000/docs`

### Parcels  `/api/parcels`
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/` | Create parcel with X-ray + packing images |
| `GET` | `/` | List parcels (paginated, filterable) |
| `GET` | `/{id}` | Get parcel by ID |
| `GET` | `/track/{tracking_number}` | Public tracking lookup |
| `PUT` | `/{id}` | Update parcel |
| `GET` | `/{id}/checkpoints` | Get all checkpoints for parcel |

### Verification  `/api/verification`
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/checkpoint` | Submit courier checkpoint scan |
| `GET` | `/checkpoints/{parcel_id}` | All checkpoints for parcel |
| `GET` | `/sellers` | List sellers (for dropdowns) |
| `GET` | `/couriers` | List couriers (for dropdowns) |
| `GET` | `/couriers/{id}/recent` | Courier's recent scan activity |

### Fraud  `/api/fraud`
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/analyze/{parcel_id}` | **Trigger AI fraud detection** |
| `GET` | `/events` | List fraud events (filterable) |
| `GET` | `/events/{id}` | Get fraud event details |
| `GET` | `/parcel/{parcel_id}/events` | Fraud events for a parcel |
| `PUT` | `/events/{id}/status` | Update event status + notes |
| `GET` | `/summary` | Aggregate fraud statistics |

### Inquiries  `/api/inquiry`
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List cases (filterable by status/severity) |
| `POST` | `/` | Manually open a case |
| `GET` | `/{id}` | Case details + timeline |
| `PUT` | `/{id}` | Update status, assignee |
| `POST` | `/{id}/note` | Add timeline note |

### Trust  `/api/trust`
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/sellers` | Seller leaderboard |
| `GET` | `/couriers` | Courier leaderboard |
| `GET` | `/sellers/{id}/history` | Trust event history |
| `GET` | `/couriers/{id}/history` | Trust event history |
| `POST` | `/sellers/{id}/flag` | Flag/unflag seller |
| `POST` | `/couriers/{id}/suspend` | Suspend/reinstate courier |

### Heatmap  `/api/heatmap`
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/geojson` | Fraud events as GeoJSON FeatureCollection |
| `GET` | `/hotspots` | Top 20 cities by fraud event count |

### Admin  `/api/admin`
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard` | KPI summary (counts, averages, rates) |

### Customer  `/api/customer`
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/report` | File fraud report with photo upload |
| `GET` | `/claim/{claim_id}` | Check claim status |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### 1. Database
```bash
createdb parcelguard
```

### 2. Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Set environment variables
cp .env.example .env          # edit DATABASE_URL, SECRET_KEY

# Run migrations
alembic upgrade head

# Seed demo data (15 sellers, 10 couriers, 30 parcels, fraud events)
python -m seed.seed_data

# Start API server
uvicorn app.main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

### 3. Ops Frontend
```bash
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

### 4. Customer Portal
```bash
cd customer-portal
npm install
npm run dev                   # http://localhost:3001
```

---

## The Six Screens

| Screen | Port | Path | Audience |
|--------|------|------|---------|
| **Packing Portal** | 3000 | `/packing` | Warehouse staff — intake + photo upload |
| **Delivery Verification** | 3000 | `/delivery` | Couriers — checkpoint scanner |
| **Admin Dashboard** | 3000 | `/admin` | Operations — KPIs + fraud event feed |
| **Inquiry System** | 3000 | `/inquiries` | Investigators — case management |
| **Trust Scores** | 3000 | `/trust` | Compliance — actor reputation |
| **Fraud Heatmap** | 3000 | `/heatmap` | Strategy — geographic intelligence |
| **Customer Portal** | 3001 | `/` | Customers — tracking + fraud reports |

---

## Design System

Each screen was given a distinct aesthetic intentionally — different user roles deserve interfaces tuned to their context and stress level.

| Screen | Aesthetic | Fonts | Primary Color |
|--------|-----------|-------|---------------|
| Packing Portal | Industrial warehouse terminal | DM Mono + Syne | Forest green `#4ade80` |
| Delivery Verification | Field courier terminal | Space Mono + Barlow Condensed | Electric blue `#4d7cff` |
| Admin Dashboard | War-room command center | IBM Plex Mono + Anton | Signal red `#ff4d4d` |
| Inquiry System | Legal case management | JetBrains Mono + Oswald | Muted violet `#7c5cff` |
| Trust Scores | Data observatory | Recursive + Bebas Neue | Deep teal `#00c9b1` |
| Fraud Heatmap | Military threat intelligence | Share Tech Mono + Black Ops One | Radar cyan `#00d4ff` |
| Customer Portal | Editorial / luxury brand | Fraunces + DM Sans | Warm gold `#c6914a` |

---

## How Fraud Gets Detected — Step by Step

```
1. PACKING  Seller hands package to warehouse
            ↓ Staff enters weight, dimensions, RFID, item description
            ↓ X-ray scan photo + packing photo uploaded
            ↓ Parcel created in DB (status: PACKED)

2. PICKUP   Courier scans parcel at origin
            ↓ Checkpoint logged: scanned_weight vs declared_weight
            ↓ RFID match checked (binary)
            ↓ Photo captured

3. HUB SCAN Package scanned at distribution center
            ↓ Weight delta accumulates across checkpoints
            ↓ RFID re-verified at each scan

4. DELIVERY Parcel marked DELIVERED
            ↓ AI fraud detection triggered automatically
            ↓ fraud_detector.py loads images, runs ResNet50
            ↓ Computes weighted score across 4 signals

5. CUSTOMER Customer uploads received-item photo
            ↓ Second image comparison run
            ↓ If score ≥ 70 → Inquiry auto-opened
            ↓ Customer gets claim ID + email notification

6. RESOLUTION Investigator reviews case in Inquiry System
              ↓ Can view checkpoint photos, score breakdown
              ↓ Contact seller/courier, update status
              ↓ If CONFIRMED → trust scores updated
              ↓ Courier may be suspended, seller flagged
```

---

## Trust Score Mechanics

Trust scores start at **80.0** and are adjusted based on outcomes:

| Event | Delta |
|-------|-------|
| Clean delivery streak (5 parcels) | +1.5 |
| LOW fraud detected | −3.0 |
| MEDIUM fraud detected | −5.0 |
| HIGH fraud confirmed | −15.0 |
| CRITICAL fraud confirmed | −25.0 |
| False positive (dismissed) | +2.0 (partial restore) |

Scores clamp at 0.0 minimum. Actors below **40.0** are auto-flagged. Couriers below **25.0** are recommended for suspension.

---

## License

MIT — built for hackathon demonstration. Not production-ready without security hardening.
