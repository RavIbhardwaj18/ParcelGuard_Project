# backend/seed/seed_data.py
"""
ParcelGuard Demo Dataset Seeder — India Edition
================================================
Run with:  python -m seed.seed_data
from the /backend directory.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid, random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app.models import (
    Seller, Courier, Parcel, DeliveryCheckpoint,
    FraudEvent, TrustEvent, Inquiry,
    ParcelStatus, FraudRisk, FraudType, FraudStatus,
    TrustEventType, InquiryStatus, InquirySeverity
)
from app.database import Base

# ── Indian cities with lat/lng ─────────────────────────────────────────────
CITIES = [
    {"city": "Mumbai",      "state": "Maharashtra",  "country": "IN", "lat": 19.0760,  "lng": 72.8777},
    {"city": "Delhi",       "state": "Delhi",        "country": "IN", "lat": 28.6139,  "lng": 77.2090},
    {"city": "Bengaluru",   "state": "Karnataka",    "country": "IN", "lat": 12.9716,  "lng": 77.5946},
    {"city": "Hyderabad",   "state": "Telangana",    "country": "IN", "lat": 17.3850,  "lng": 78.4867},
    {"city": "Chennai",     "state": "Tamil Nadu",   "country": "IN", "lat": 13.0827,  "lng": 80.2707},
    {"city": "Kolkata",     "state": "West Bengal",  "country": "IN", "lat": 22.5726,  "lng": 88.3639},
    {"city": "Pune",        "state": "Maharashtra",  "country": "IN", "lat": 18.5204,  "lng": 73.8567},
    {"city": "Ahmedabad",   "state": "Gujarat",      "country": "IN", "lat": 23.0225,  "lng": 72.5714},
    {"city": "Jaipur",      "state": "Rajasthan",    "country": "IN", "lat": 26.9124,  "lng": 75.7873},
    {"city": "Lucknow",     "state": "Uttar Pradesh","country": "IN", "lat": 26.8467,  "lng": 80.9462},
    {"city": "Surat",       "state": "Gujarat",      "country": "IN", "lat": 21.1702,  "lng": 72.8311},
    {"city": "Kochi",       "state": "Kerala",       "country": "IN", "lat": 9.9312,   "lng": 76.2673},
]

def random_city(): return random.choice(CITIES)
def days_ago(n): return datetime.utcnow() - timedelta(days=n)
def tracking_number(): return f"PG{random.randint(10000000, 99999999)}"
def case_number(n): return f"PG-2025-{n:06d}"


def seed_all():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        print("🗑  Clearing existing data...")
        for model in [TrustEvent, Inquiry, FraudEvent, DeliveryCheckpoint, Parcel, Courier, Seller]:
            db.query(model).delete()
        db.commit()

        # ── Sellers (Indian businesses) ───────────────────────────────
        print("🏪 Seeding sellers...")
        sellers = []
        seller_data = [
            {"name": "Reliance Digital",    "email": "info@reliancedigital.in",  "company": "Reliance Retail Ltd",   "trust_score": 93.5, "is_flagged": False, "fraud_count": 0},
            {"name": "Meesho Seller Hub",   "email": "seller@meesho.com",        "company": "Meesho Inc",            "trust_score": 76.0, "is_flagged": False, "fraud_count": 1},
            {"name": "Dukaan Express",      "email": "hello@dukaan.com",         "company": "Dukaan Pvt Ltd",        "trust_score": 41.5, "is_flagged": True,  "fraud_count": 4},
            {"name": "Nykaa Fashion",       "email": "support@nykaa.com",        "company": "FSN E-Commerce Ventures","trust_score": 89.0, "is_flagged": False, "fraud_count": 0},
            {"name": "NakliGadgets",        "email": "sales@nakligadgets.in",    "company": "NG Traders",            "trust_score": 12.0, "is_suspended": True,"fraud_count": 11},
            {"name": "BigBasket Direct",    "email": "vendor@bigbasket.com",     "company": "Innovative Retail Pvt", "trust_score": 87.5, "is_flagged": False, "fraud_count": 1},
            {"name": "Croma Stores",        "email": "info@croma.com",           "company": "Infiniti Retail Ltd",   "trust_score": 75.0, "is_flagged": False, "fraud_count": 2},
            {"name": "LootMart Online",     "email": "loot@mart.in",             "company": "LootMart India",        "trust_score": 52.0, "is_flagged": True,  "fraud_count": 3},
            {"name": "Tanishq Jewellers",   "email": "online@tanishq.co.in",     "company": "Titan Company Ltd",     "trust_score": 96.0, "is_flagged": False, "fraud_count": 0},
            {"name": "DuplicateBazaar",     "email": "sell@dupbazaar.com",       "company": "DB Traders",            "trust_score": 35.0, "is_flagged": True,  "fraud_count": 6},
        ]
        for d in seller_data:
            city = random_city()
            s = Seller(
                id=uuid.uuid4(),
                name=d["name"], email=d["email"], company=d["company"],
                trust_score=d["trust_score"],
                is_flagged=d.get("is_flagged", False),
                is_suspended=d.get("is_suspended", False),
                fraud_count=d["fraud_count"],
                total_parcels=d["fraud_count"] + random.randint(5, 30),
                city=city["city"], country=city["country"],
                created_at=days_ago(random.randint(60, 365)),
            )
            db.add(s); sellers.append(s)
        db.commit()

        # ── Couriers (Indian names) ────────────────────────────────────
        print("🚚 Seeding couriers...")
        couriers = []
        courier_data = [
            {"name": "Ravi Kumar",          "email": "ravi.k@bluedart.com",     "company": "Blue Dart Express",  "trust_score": 91.0, "is_flagged": False, "fraud_count": 0},
            {"name": "Priya Sharma",        "email": "priya.s@delhivery.com",   "company": "Delhivery Ltd",      "trust_score": 94.5, "is_flagged": False, "fraud_count": 0},
            {"name": "Suresh Yadav",        "email": "s.yadav@ecomexpress.in",  "company": "Ecom Express",       "trust_score": 43.0, "is_flagged": True,  "fraud_count": 5},
            {"name": "Anita Nair",          "email": "a.nair@xpressbees.com",   "company": "XpressBees",         "trust_score": 83.0, "is_flagged": False, "fraud_count": 1},
            {"name": "Mohammed Irfan",      "email": "m.irfan@delhivery.com",   "company": "Delhivery Ltd",      "trust_score": 87.5, "is_flagged": False, "fraud_count": 0},
            {"name": "Vikram Tiwari",       "email": "v.tiwari@ecomexpress.in", "company": "Ecom Express",       "trust_score": 27.0, "is_flagged": True,  "fraud_count": 7},
            {"name": "Deepa Menon",         "email": "d.menon@bluedart.com",    "company": "Blue Dart Express",  "trust_score": 78.0, "is_flagged": False, "fraud_count": 2},
            {"name": "Arjun Singh",         "email": "a.singh@shiprocket.in",   "company": "ShipRocket",         "trust_score": 92.0, "is_flagged": False, "fraud_count": 0},
        ]
        for i, d in enumerate(courier_data):
            city = random_city()
            c = Courier(
                id=uuid.uuid4(),
                name=d["name"], email=d["email"], company=d["company"],
                employee_id=f"EMP{1000 + i}",
                trust_score=d["trust_score"],
                is_flagged=d.get("is_flagged", False),
                fraud_count=d["fraud_count"],
                total_deliveries=d["fraud_count"] + random.randint(10, 50),
                base_city=city["city"], base_country=city["country"],
                created_at=days_ago(random.randint(30, 200)),
            )
            db.add(c); couriers.append(c)
        db.commit()

        # ── Parcels (Indian items & customers) ────────────────────────
        print("📦 Seeding parcels...")
        parcels = []
        indian_items = [
            "Electronics - Smartphone", "Saree - Silk Banarasi",
            "Jewellery - Gold Bangles", "Books - UPSC Study Set",
            "Ayurvedic Skincare Kit", "Cricket Bat - Professional",
            "Kurta Set - Cotton", "Home Appliance - Mixer Grinder",
            "Mobile Accessories - Earbuds", "Ethnic Wear - Lehenga",
        ]
        indian_names = [
            "Aarav Sharma", "Priya Patel", "Rohit Verma", "Sunita Reddy",
            "Amit Joshi", "Kavya Nair", "Vikram Singh", "Pooja Iyer",
            "Rahul Gupta", "Meera Krishnan", "Sanjay Mehta", "Divya Pillai",
            "Arjun Rao", "Anjali Dubey", "Karan Malhotra", "Neha Desai",
            "Suresh Yadav", "Ritu Agarwal", "Manish Tiwari", "Sneha Bose",
            "Deepak Pandey", "Anjana Kumari", "Vikas Nair", "Swati Shah",
            "Rajesh Kumar", "Priyanka Singh", "Aakash Jain", "Nisha Goel",
            "Harish Choudhary", "Lalitha Subramaniam",
        ]
        statuses = [ParcelStatus.PACKED, ParcelStatus.IN_TRANSIT, ParcelStatus.DELIVERED, ParcelStatus.DISPUTED, ParcelStatus.INVESTIGATION]
        for i in range(30):
            origin = random_city()
            dest = random_city()
            seller = random.choice(sellers)
            cust_name = indian_names[i]
            p = Parcel(
                id=uuid.uuid4(),
                tracking_number=tracking_number(),
                seller_id=seller.id,
                declared_weight_kg=round(random.uniform(0.2, 15.0), 2),
                declared_length_cm=round(random.uniform(10, 60), 1),
                declared_width_cm=round(random.uniform(10, 40), 1),
                declared_height_cm=round(random.uniform(5, 30), 1),
                declared_value_usd=round(random.uniform(500, 50000), 2),  # INR values
                item_description=random.choice(indian_items),
                rfid_tag=f"RFID-{uuid.uuid4().hex[:12].upper()}",
                origin_city=origin["city"], origin_country=origin["country"],
                origin_lat=origin["lat"], origin_lng=origin["lng"],
                destination_city=dest["city"], destination_country=dest["country"],
                destination_lat=dest["lat"], destination_lng=dest["lng"],
                status=random.choice(statuses),
                fraud_risk=FraudRisk.UNKNOWN,
                customer_name=cust_name,
                customer_email=f"{cust_name.lower().replace(' ', '.')}{i+1}@gmail.com",
                packed_at=days_ago(random.randint(1, 30)),
            )
            db.add(p); parcels.append(p)
        db.commit()

        # ── Fraud Events (Indian cities) ──────────────────────────────
        print("🚨 Seeding fraud events...")
        fraud_configs = [
            (FraudType.SELLER_FRAUD,  4, None, 84.2, 0.31, 0.0,  True,  0),
            (FraudType.COURIER_FRAUD, 1, 2,    77.8, 0.44, 0.3,  True,  1),
            (FraudType.RFID_MISMATCH, 0, 5,    91.0, 0.22, 0.8,  False, 2),
            (FraudType.MULTI_SIGNAL,  7, 2,    88.5, 0.28, 1.2,  False, 3),
            (FraudType.SELLER_FRAUD,  9, None, 73.1, 0.35, 0.0,  True,  4),
            (FraudType.COURIER_FRAUD, 1, 5,    82.6, 0.41, 0.5,  True,  5),
            (FraudType.WEIGHT_FRAUD,  2, 3,    51.4, 0.71, 2.1,  True,  6),
            (FraudType.SELLER_FRAUD,  4, None, 79.9, 0.33, 0.0,  True,  7),
            (FraudType.COURIER_FRAUD, 6, 2,    66.3, 0.52, 0.4,  True,  8),
            (FraudType.MULTI_SIGNAL,  9, 5,    93.7, 0.19, 1.8,  False, 9),
            (FraudType.RFID_MISMATCH, 3, 6,    58.2, 0.63, 0.2,  False, 10),
            (FraudType.SELLER_FRAUD,  7, None, 71.5, 0.38, 0.0,  True,  11),
        ]
        fraud_events = []
        inquiry_num = 1
        for i, (ftype, sidx, cidx, score, img_sim, w_delta, rfid_ok, city_idx) in enumerate(fraud_configs):
            parcel = parcels[i % len(parcels)]
            city = CITIES[city_idx % len(CITIES)]
            seller = sellers[sidx] if sidx is not None else None
            courier = couriers[cidx] if cidx is not None else None
            fe = FraudEvent(
                id=uuid.uuid4(),
                parcel_id=parcel.id,
                fraud_type=ftype,
                status=random.choice([FraudStatus.DETECTED, FraudStatus.CONFIRMED, FraudStatus.UNDER_REVIEW]),
                seller_id=seller.id if seller else None,
                courier_id=courier.id if courier else None,
                total_fraud_score=score,
                image_similarity_score=img_sim,
                image_delta_score=round((1 - img_sim) * 40, 2),
                weight_delta_kg=w_delta,
                weight_delta_score=round(min(w_delta / 5.0, 1.0) * 25, 2),
                rfid_matched=rfid_ok,
                rfid_score=0.0 if rfid_ok else 20.0,
                dim_delta_score=round(random.uniform(0, 12), 2),
                evidence_data={
                    "packing_image": f"uploads/parcel_photos/seed_pack_{i}.jpg",
                    "checkpoint_image": f"uploads/parcel_photos/seed_ck_{i}.jpg",
                },
                fraud_location_city=city["city"],
                fraud_location_country=city["country"],
                fraud_location_lat=city["lat"] + random.uniform(-0.1, 0.1),
                fraud_location_lng=city["lng"] + random.uniform(-0.1, 0.1),
                detected_at=days_ago(random.randint(1, 20)),
            )
            db.add(fe); fraud_events.append(fe)
            parcel.fraud_risk = FraudRisk.HIGH if score > 70 else FraudRisk.MEDIUM
            parcel.fraud_score = score
            parcel.status = ParcelStatus.INVESTIGATION if score > 70 else ParcelStatus.DISPUTED

            if score > 70:
                inq = Inquiry(
                    id=uuid.uuid4(),
                    case_number=case_number(inquiry_num),
                    parcel_id=parcel.id,
                    fraud_event_id=fe.id,
                    accused_seller_id=seller.id if seller else None,
                    accused_courier_id=courier.id if courier else None,
                    status=random.choice([InquiryStatus.OPEN, InquiryStatus.ASSIGNED, InquiryStatus.UNDER_REVIEW]),
                    severity=InquirySeverity.HIGH if score > 85 else InquirySeverity.MEDIUM,
                    title=f"Fraud Detected: {ftype.value.replace('_', ' ').title()} - {parcel.tracking_number}",
                    description=f"AI system detected fraud with score {score:.1f}/100. Type: {ftype.value}. Location: {city['city']}, {city['state']}.",
                    assigned_to=random.choice(["admin@parcelguard.in", "investigator@parcelguard.in", None]),
                    auto_created=1,
                    timeline=[{"timestamp": fe.detected_at.isoformat(), "actor": "system", "action": "inquiry_created", "note": f"Auto-created: fraud score {score:.1f}"}],
                    created_at=fe.detected_at,
                )
                db.add(inq); inquiry_num += 1
        db.commit()

        print("✅ India seed complete!")
        print(f"   Sellers:      {len(sellers)}")
        print(f"   Couriers:     {len(couriers)}")
        print(f"   Parcels:      {len(parcels)}")
        print(f"   Fraud Events: {len(fraud_events)}")
        print(f"   Inquiries:    {inquiry_num - 1}")

    except Exception as e:
        print(f"❌ Seed failed: {e}"); db.rollback(); raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()