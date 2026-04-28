from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import csv
import io
import asyncio
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

from email_service import send_welcome_entrepreneur, send_welcome_client

# ---------------- Setup ----------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = "HS256"

app = FastAPI(title="RED Love & Solidarity API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("red")

# ---------------- Constants ----------------
CATEGORIES = [
    "restaurants", "professional_services", "health_wellness", "technology",
    "construction", "beauty", "education", "retail", "arts_entertainment",
    "automotive", "food_beverage", "other",
]

REFERRAL_SOURCES = ["Roxxi", "TRC", "UMAPT", "Google", "Social", "Other"]

# ---------------- Models ----------------
class RegisterEntrepreneurIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    business_name: str = Field(min_length=2, max_length=120)
    owner_name: str = Field(min_length=2, max_length=120)
    category: str
    description: str = Field(min_length=10, max_length=2000)
    phone: str = Field(min_length=4, max_length=40)
    city: str = Field(min_length=2, max_length=120)
    state: Optional[str] = ""
    country: str = "USA"
    address: Optional[str] = ""
    website: Optional[str] = ""
    logo_url: Optional[str] = ""
    cover_url: Optional[str] = ""
    facebook: Optional[str] = ""
    instagram: Optional[str] = ""
    twitter: Optional[str] = ""
    whatsapp: Optional[str] = ""
    source: Optional[str] = ""

class RegisterClientIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=4, max_length=40)
    city: str = Field(min_length=2, max_length=120)
    state: Optional[str] = ""
    interests: List[str] = []
    source: Optional[str] = ""

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class EntrepreneurUpdate(BaseModel):
    business_name: Optional[str] = None
    owner_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    cover_url: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    whatsapp: Optional[str] = None
    featured: Optional[bool] = None

class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    role: Optional[str] = ""
    contribution: Optional[str] = ""
    message: str = Field(min_length=5, max_length=2000)

# ---------------- Helpers ----------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(uid: str, email: str, role: str) -> str:
    payload = {"sub": uid, "email": email, "role": role, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token", value=token, httponly=True, secure=True,
        samesite="none", max_age=7*24*3600, path="/",
    )

def clear_auth_cookie(response: Response):
    response.delete_cookie("access_token", path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(current=Depends(get_current_user)) -> dict:
    if current.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def public_entrepreneur(doc: dict) -> dict:
    keep = ["id", "user_id", "business_name", "owner_name", "category", "description",
            "phone", "city", "state", "country", "address", "website",
            "logo_url", "cover_url", "facebook", "instagram", "twitter", "whatsapp",
            "created_at", "updated_at", "featured", "view_count", "contact_click_count"]
    return {k: doc.get(k, 0 if k.endswith("_count") else "") for k in keep}

def public_user(doc: dict) -> dict:
    return {
        "id": doc.get("id"),
        "email": doc.get("email"),
        "role": doc.get("role"),
        "full_name": doc.get("full_name", ""),
        "phone": doc.get("phone", ""),
        "city": doc.get("city", ""),
        "state": doc.get("state", ""),
        "interests": doc.get("interests", []),
        "source": doc.get("source", ""),
        "created_at": doc.get("created_at", ""),
    }

# ---------------- Public ----------------
@api.get("/")
async def root():
    return {"message": "RED Love & Solidarity API", "status": "ok"}

@api.get("/categories")
async def list_categories():
    return {"categories": CATEGORIES}

@api.get("/referral-sources")
async def list_referral_sources():
    return {"sources": REFERRAL_SOURCES}

# ---------------- Auth ----------------
@api.post("/auth/register-entrepreneur")
async def auth_register_entrepreneur(payload: RegisterEntrepreneurIn, response: Response):
    email = payload.email.lower().strip()
    if payload.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    user_doc = {
        "id": uid, "email": email,
        "password_hash": hash_password(payload.password),
        "role": "entrepreneur",
        "full_name": payload.owner_name,
        "phone": payload.phone, "city": payload.city, "state": payload.state or "",
        "interests": [],
        "source": payload.source or "",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    profile = {
        "id": str(uuid.uuid4()), "user_id": uid,
        "business_name": payload.business_name.strip(),
        "owner_name": payload.owner_name.strip(),
        "category": payload.category,
        "description": payload.description.strip(),
        "phone": payload.phone.strip(),
        "city": payload.city.strip(),
        "state": payload.state or "", "country": payload.country or "USA",
        "address": payload.address or "",
        "website": payload.website or "",
        "logo_url": payload.logo_url or "",
        "cover_url": payload.cover_url or "",
        "facebook": payload.facebook or "",
        "instagram": payload.instagram or "",
        "twitter": payload.twitter or "",
        "whatsapp": payload.whatsapp or "",
        "featured": False,
        "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.entrepreneurs.insert_one(profile)
    token = create_access_token(uid, email, "entrepreneur")
    set_auth_cookie(response, token)
    # Welcome email (fire-and-forget; never block registration)
    try:
        asyncio.create_task(send_welcome_entrepreneur(email, payload.business_name.strip(), payload.owner_name.strip()))
    except Exception as e:
        logger.error("welcome_entrepreneur dispatch failed: %s", e)
    return {
        "user": public_user(user_doc),
        "profile": public_entrepreneur(profile),
        "access_token": token,
    }

@api.post("/auth/register-client")
async def auth_register_client(payload: RegisterClientIn, response: Response):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    interests = [i for i in (payload.interests or []) if i in CATEGORIES]
    uid = str(uuid.uuid4())
    user_doc = {
        "id": uid, "email": email,
        "password_hash": hash_password(payload.password),
        "role": "client",
        "full_name": payload.full_name.strip(),
        "phone": payload.phone.strip(),
        "city": payload.city.strip(),
        "state": payload.state or "",
        "interests": interests,
        "source": payload.source or "",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(uid, email, "client")
    set_auth_cookie(response, token)
    try:
        asyncio.create_task(send_welcome_client(email, payload.full_name.strip()))
    except Exception as e:
        logger.error("welcome_client dispatch failed: %s", e)
    return {"user": public_user(user_doc), "access_token": token}

@api.post("/auth/login")
async def auth_login(payload: LoginIn, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email, user.get("role", "client"))
    set_auth_cookie(response, token)
    return {"user": public_user(user), "access_token": token}

@api.post("/auth/logout")
async def auth_logout(response: Response, current=Depends(get_current_user)):
    clear_auth_cookie(response)
    return {"ok": True}

@api.get("/auth/me")
async def auth_me(current=Depends(get_current_user)):
    profile = None
    if current.get("role") == "entrepreneur":
        p = await db.entrepreneurs.find_one({"user_id": current["id"]}, {"_id": 0})
        if p:
            profile = public_entrepreneur(p)
    return {"user": public_user(current), "profile": profile}

# ---------------- Entrepreneurs (PROTECTED list/detail) ----------------
@api.get("/entrepreneurs")
async def list_entrepreneurs(
    q: Optional[str] = None,
    category: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = Query(60, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current=Depends(get_current_user),  # gated: must be authenticated
):
    filt = {}
    if category and category != "all" and category in CATEGORIES:
        filt["category"] = category
    if city:
        filt["city"] = {"$regex": city, "$options": "i"}
    if q:
        filt["$or"] = [
            {"business_name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"owner_name": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}},
        ]
    total = await db.entrepreneurs.count_documents(filt)
    cursor = db.entrepreneurs.find(filt, {"_id": 0}).sort([("featured", -1), ("created_at", -1)]).skip(skip).limit(limit)
    items = [public_entrepreneur(d) async for d in cursor]
    return {"total": total, "items": items}

@api.get("/entrepreneurs/preview")
async def preview_entrepreneurs(limit: int = Query(3, ge=1, le=6)):
    """Public teaser preview (without auth) — used to show a few cards on the landing/wall."""
    cursor = db.entrepreneurs.find({}, {"_id": 0}).sort([("featured", -1), ("created_at", -1)]).limit(limit)
    items = [public_entrepreneur(d) async for d in cursor]
    total = await db.entrepreneurs.count_documents({})
    return {"total": total, "items": items}

@api.get("/entrepreneurs/{eid}")
async def get_entrepreneur(eid: str, current=Depends(get_current_user)):
    doc = await db.entrepreneurs.find_one({"id": eid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Entrepreneur not found")
    # Track profile view (don't track owner viewing own profile)
    if doc.get("user_id") != current.get("id"):
        await db.entrepreneurs.update_one({"id": eid}, {"$inc": {"view_count": 1}})
        await db.profile_views.insert_one({
            "id": str(uuid.uuid4()),
            "entrepreneur_id": eid,
            "viewer_id": current.get("id"),
            "viewer_email": current.get("email"),
            "viewer_role": current.get("role"),
            "created_at": now_iso(),
        })
        doc["view_count"] = (doc.get("view_count") or 0) + 1
    return public_entrepreneur(doc)

@api.post("/entrepreneurs/{eid}/contact-click")
async def track_contact_click(eid: str, kind: str = Query("contact"), current=Depends(get_current_user)):
    doc = await db.entrepreneurs.find_one({"id": eid}, {"_id": 0, "user_id": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Entrepreneur not found")
    if doc.get("user_id") == current.get("id"):
        return {"ok": True, "skipped": "owner"}
    await db.entrepreneurs.update_one({"id": eid}, {"$inc": {"contact_click_count": 1}})
    await db.contact_clicks.insert_one({
        "id": str(uuid.uuid4()),
        "entrepreneur_id": eid,
        "kind": kind,  # contact | phone | whatsapp | email | website | facebook | instagram
        "viewer_id": current.get("id"),
        "viewer_email": current.get("email"),
        "created_at": now_iso(),
    })
    return {"ok": True}

@api.put("/entrepreneurs/me")
async def update_my_profile(payload: EntrepreneurUpdate, current=Depends(get_current_user)):
    if current.get("role") != "entrepreneur":
        raise HTTPException(status_code=403, detail="Only entrepreneurs can edit profile")
    update = {k: v for k, v in payload.model_dump().items() if v is not None and k != "featured"}
    if "category" in update and update["category"] not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    update["updated_at"] = now_iso()
    res = await db.entrepreneurs.find_one_and_update(
        {"user_id": current["id"]}, {"$set": update}, return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Profile not found")
    res.pop("_id", None)
    return public_entrepreneur(res)

# ---------------- Contact ----------------
@api.post("/contact")
async def contact(payload: ContactIn):
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "role": payload.role or "",
        "contribution": payload.contribution or "",
        "message": payload.message.strip(),
        "read": False,
        "created_at": now_iso(),
    }
    await db.contact_messages.insert_one(doc)
    return {"ok": True, "id": doc["id"]}

# ---------------- Admin ----------------
@api.get("/admin/stats")
async def admin_stats(_=Depends(require_admin)):
    total_ents = await db.entrepreneurs.count_documents({})
    total_clients = await db.users.count_documents({"role": "client"})
    total_messages = await db.contact_messages.count_documents({})
    unread = await db.contact_messages.count_documents({"read": False})
    featured = await db.entrepreneurs.count_documents({"featured": True})
    total_views = await db.profile_views.count_documents({})
    total_clicks = await db.contact_clicks.count_documents({})
    return {
        "entrepreneurs": total_ents,
        "clients": total_clients,
        "messages": total_messages,
        "unread_messages": unread,
        "featured": featured,
        "total_views": total_views,
        "total_contact_clicks": total_clicks,
    }

@api.get("/admin/entrepreneurs/{eid}/activity")
async def admin_entrepreneur_activity(eid: str, _=Depends(require_admin)):
    views_cur = db.profile_views.find({"entrepreneur_id": eid}, {"_id": 0}).sort("created_at", -1).limit(200)
    views = [d async for d in views_cur]
    clicks_cur = db.contact_clicks.find({"entrepreneur_id": eid}, {"_id": 0}).sort("created_at", -1).limit(200)
    clicks = [d async for d in clicks_cur]
    return {"views": views, "clicks": clicks, "view_count": len(views), "click_count": len(clicks)}

@api.get("/admin/entrepreneurs")
async def admin_list_entrepreneurs(q: Optional[str] = None, _=Depends(require_admin)):
    filt = {}
    if q:
        filt["$or"] = [
            {"business_name": {"$regex": q, "$options": "i"}},
            {"owner_name": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.entrepreneurs.find(filt, {"_id": 0}).sort("created_at", -1).limit(500)
    items = [public_entrepreneur(d) async for d in cursor]
    # enrich with email + source of owner
    for item in items:
        u = await db.users.find_one({"id": item["user_id"]}, {"_id": 0, "email": 1, "source": 1})
        item["email"] = (u or {}).get("email", "")
        item["source"] = (u or {}).get("source", "")
    return {"items": items, "total": len(items)}

@api.patch("/admin/entrepreneurs/{eid}")
async def admin_update_entrepreneur(eid: str, payload: EntrepreneurUpdate, _=Depends(require_admin)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "category" in update and update["category"] not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    update["updated_at"] = now_iso()
    res = await db.entrepreneurs.find_one_and_update(
        {"id": eid}, {"$set": update}, return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Entrepreneur not found")
    res.pop("_id", None)
    return public_entrepreneur(res)

@api.delete("/admin/entrepreneurs/{eid}")
async def admin_delete_entrepreneur(eid: str, _=Depends(require_admin)):
    doc = await db.entrepreneurs.find_one({"id": eid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Entrepreneur not found")
    await db.entrepreneurs.delete_one({"id": eid})
    # Also delete user
    await db.users.delete_one({"id": doc["user_id"], "role": "entrepreneur"})
    return {"ok": True}

@api.get("/admin/clients")
async def admin_list_clients(q: Optional[str] = None, _=Depends(require_admin)):
    filt = {"role": "client"}
    if q:
        filt["$or"] = [
            {"full_name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.users.find(filt, {"_id": 0, "password_hash": 0}).sort("created_at", -1).limit(500)
    items = [public_user(d) async for d in cursor]
    return {"items": items, "total": len(items)}

@api.delete("/admin/clients/{uid}")
async def admin_delete_client(uid: str, _=Depends(require_admin)):
    res = await db.users.delete_one({"id": uid, "role": "client"})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"ok": True}

@api.get("/admin/messages")
async def admin_list_messages(_=Depends(require_admin)):
    cursor = db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).limit(500)
    items = [d async for d in cursor]
    return {"items": items, "total": len(items)}

@api.patch("/admin/messages/{mid}/read")
async def admin_mark_read(mid: str, _=Depends(require_admin)):
    res = await db.contact_messages.find_one_and_update({"id": mid}, {"$set": {"read": True}}, return_document=True)
    if not res:
        raise HTTPException(status_code=404, detail="Message not found")
    res.pop("_id", None)
    return res

@api.delete("/admin/messages/{mid}")
async def admin_delete_message(mid: str, _=Depends(require_admin)):
    res = await db.contact_messages.delete_one({"id": mid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"ok": True}

def _csv_response(rows: List[dict], fieldnames: List[str], filename: str):
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for r in rows:
        writer.writerow({k: r.get(k, "") for k in fieldnames})
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api.get("/admin/export/entrepreneurs.csv")
async def admin_export_entrepreneurs(_=Depends(require_admin)):
    cursor = db.entrepreneurs.find({}, {"_id": 0}).sort("created_at", -1)
    items = []
    async for d in cursor:
        u = await db.users.find_one({"id": d.get("user_id")}, {"_id": 0, "email": 1, "source": 1})
        d["email"] = (u or {}).get("email", "")
        d["source"] = (u or {}).get("source", "")
        items.append(d)
    fields = ["business_name", "owner_name", "email", "category", "phone", "city", "state",
              "country", "website", "instagram", "facebook", "featured", "source", "created_at"]
    return _csv_response(items, fields, "entrepreneurs.csv")

@api.get("/admin/export/clients.csv")
async def admin_export_clients(_=Depends(require_admin)):
    cursor = db.users.find({"role": "client"}, {"_id": 0, "password_hash": 0}).sort("created_at", -1)
    items = []
    async for d in cursor:
        d["interests"] = ",".join(d.get("interests", []))
        items.append(d)
    fields = ["full_name", "email", "phone", "city", "state", "interests", "source", "created_at"]
    return _csv_response(items, fields, "clients.csv")

# ---------------- Lifecycle ----------------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.entrepreneurs.create_index("user_id")
    await db.entrepreneurs.create_index("category")
    await db.entrepreneurs.create_index("city")
    await db.profile_views.create_index("entrepreneur_id")
    await db.profile_views.create_index("viewer_id")
    await db.contact_clicks.create_index("entrepreneur_id")
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@redsolidaridad.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@RED2026")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "full_name": "Administrator",
            "created_at": now_iso(),
        })
        logger.info("Seeded admin user: %s", admin_email)
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
    count = await db.entrepreneurs.count_documents({})
    if count == 0:
        # Sample seed disabled — start clean per user request
        logger.info("entrepreneurs collection is empty (no auto-seed)")

async def seed_sample_data():
    samples = [
        {"email": "maria@elsolcatering.com", "password": "Demo@2026",
         "business_name": "El Sol Catering", "owner_name": "María González",
         "category": "food_beverage", "phone": "+1 432 555 0101", "city": "Odessa", "state": "TX",
         "description": "Auténtica comida latina para eventos familiares y corporativos. Más de 15 años llevando sabor a tu mesa.",
         "website": "https://elsolcatering.com", "instagram": "@elsolcatering",
         "logo_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
         "cover_url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200"},
        {"email": "carlos@reformaspros.com", "password": "Demo@2026",
         "business_name": "Reformas Pro Construction", "owner_name": "Carlos Ramírez",
         "category": "construction", "phone": "+1 432 555 0123", "city": "Midland", "state": "TX",
         "description": "Remodelaciones residenciales y comerciales con licencia y seguro. Calidad garantizada.",
         "website": "https://reformaspros.com", "facebook": "reformaspros",
         "logo_url": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400",
         "cover_url": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200"},
        {"email": "ana@bellaesthetics.com", "password": "Demo@2026",
         "business_name": "Bella Esthetics Studio", "owner_name": "Ana Rivera",
         "category": "beauty", "phone": "+1 432 555 0145", "city": "Odessa", "state": "TX",
         "description": "Faciales, lashes y cuidado de la piel con productos premium. Tu belleza es nuestra pasión.",
         "instagram": "@bellaesthetics", "whatsapp": "+14325550145",
         "logo_url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400",
         "cover_url": "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200"},
        {"email": "juan@techbridge.com", "password": "Demo@2026",
         "business_name": "TechBridge Solutions", "owner_name": "Juan Pérez",
         "category": "technology", "phone": "+1 432 555 0167", "city": "Midland", "state": "TX",
         "description": "Sitios web, automatización y soporte IT para pequeños negocios hispanos. Hablamos tu idioma.",
         "website": "https://techbridge.com",
         "logo_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
         "cover_url": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200"},
        {"email": "lucia@aprendemas.com", "password": "Demo@2026",
         "business_name": "Aprende+ Tutoring", "owner_name": "Lucía Morales",
         "category": "education", "phone": "+1 432 555 0189", "city": "Odessa", "state": "TX",
         "description": "Tutorías bilingües K-12, preparación SAT y ESL para adultos. Empoderamos a tu familia con educación.",
         "website": "https://aprendemas.com", "facebook": "aprendemas",
         "logo_url": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
         "cover_url": "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=1200"},
        {"email": "diego@autosafe.com", "password": "Demo@2026",
         "business_name": "AutoSafe Mechanics", "owner_name": "Diego Vargas",
         "category": "automotive", "phone": "+1 432 555 0202", "city": "Odessa", "state": "TX",
         "description": "Mecánica honesta para tu auto. Diagnóstico gratis, precio justo, atención bilingüe.",
         "logo_url": "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=400",
         "cover_url": "https://images.unsplash.com/photo-1599256871679-d7e7f9c0e2c1?w=1200"},
    ]
    for s in samples:
        uid = str(uuid.uuid4())
        await db.users.insert_one({
            "id": uid, "email": s["email"], "password_hash": hash_password(s["password"]),
            "role": "entrepreneur", "full_name": s["owner_name"],
            "phone": s["phone"], "city": s["city"], "state": s.get("state", ""),
            "interests": [], "created_at": now_iso(),
        })
        profile = {
            "id": str(uuid.uuid4()), "user_id": uid,
            "business_name": s["business_name"], "owner_name": s["owner_name"],
            "category": s["category"], "description": s["description"],
            "phone": s["phone"], "city": s["city"], "state": s.get("state", ""),
            "country": "USA", "address": "",
            "website": s.get("website", ""), "logo_url": s.get("logo_url", ""),
            "cover_url": s.get("cover_url", ""),
            "facebook": s.get("facebook", ""), "instagram": s.get("instagram", ""),
            "twitter": s.get("twitter", ""), "whatsapp": s.get("whatsapp", ""),
            "featured": True,
            "created_at": now_iso(), "updated_at": now_iso(),
        }
        await db.entrepreneurs.insert_one(profile)
    # Seed a demo client too
    await db.users.insert_one({
        "id": str(uuid.uuid4()), "email": "cliente@demo.com",
        "password_hash": hash_password("Demo@2026"),
        "role": "client", "full_name": "Cliente Demo",
        "phone": "+1 432 555 9999", "city": "Odessa", "state": "TX",
        "interests": ["food_beverage", "beauty"], "created_at": now_iso(),
    })
    logger.info("Seeded %d sample entrepreneurs + 1 demo client", len(samples))

@app.on_event("shutdown")
async def on_shutdown():
    client.close()

# ---------------- App wiring ----------------
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)
