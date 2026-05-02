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
import hashlib
import secrets
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

from email_service import send_welcome_entrepreneur, send_welcome_client, send_password_reset

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

ENTITY_TYPES = [
    "ngo", "foundation", "church", "government", "training_center",
    "help_center", "health_center", "legal_migration_center", "chamber_commerce",
    "cultural_center", "food_bank", "informal_network", "other",
]

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
    linkedin: Optional[str] = ""
    tiktok: Optional[str] = ""
    youtube: Optional[str] = ""
    source: Optional[str] = ""
    volunteer: Optional[bool] = False

class RegisterClientIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=4, max_length=40)
    city: str = Field(min_length=2, max_length=120)
    state: Optional[str] = ""
    interests: List[str] = []
    source: Optional[str] = ""
    volunteer: Optional[bool] = False

class RegisterEntityIn(BaseModel):
    # Account
    email: EmailStr
    password: str = Field(min_length=6)
    # Representative
    rep_name: str = Field(min_length=2, max_length=120)
    rep_whatsapp: str = Field(min_length=4, max_length=40)
    # Entity
    entity_name: str = Field(min_length=2, max_length=160)
    entity_email: Optional[str] = ""
    entity_phone: str = Field(min_length=4, max_length=40)
    entity_type: str
    country: str = ""
    state: Optional[str] = ""
    city: str = Field(min_length=2, max_length=120)
    address: Optional[str] = ""
    description: Optional[str] = ""
    website: Optional[str] = ""
    logo_url: Optional[str] = ""
    cover_url: Optional[str] = ""
    facebook: Optional[str] = ""
    instagram: Optional[str] = ""
    source: Optional[str] = ""

class EntityUpdate(BaseModel):
    rep_name: Optional[str] = None
    rep_whatsapp: Optional[str] = None
    entity_name: Optional[str] = None
    entity_email: Optional[str] = None
    entity_phone: Optional[str] = None
    entity_type: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    cover_url: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None

class EventIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    date: str  # ISO date string YYYY-MM-DD
    time: Optional[str] = ""  # HH:MM
    location: str = Field(min_length=2, max_length=200)
    description: Optional[str] = ""
    needs: Optional[str] = ""  # Necesidades / what they need for the event
    cover_url: Optional[str] = ""

class EventUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    needs: Optional[str] = None
    cover_url: Optional[str] = None

class VolunteerToggle(BaseModel):
    volunteer: bool

class RatingIn(BaseModel):
    stars: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default="", max_length=500)

class ForgotPasswordIn(BaseModel):
    email: EmailStr

class ResetPasswordIn(BaseModel):
    token: str
    password: str = Field(min_length=6)

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
    linkedin: Optional[str] = None
    tiktok: Optional[str] = None
    youtube: Optional[str] = None
    featured: Optional[bool] = None
    volunteer: Optional[bool] = None

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
    # Must match the SameSite/Secure attributes used when setting the cookie,
    # otherwise the browser keeps the old cookie and the user stays logged in.
    response.set_cookie(
        key="access_token", value="", httponly=True, secure=True,
        samesite="none", max_age=0, expires=0, path="/",
    )

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
            "linkedin", "tiktok", "youtube",
            "created_at", "updated_at", "featured", "view_count", "contact_click_count",
            "volunteer", "avg_rating", "ratings_count"]
    out = {}
    for k in keep:
        if k.endswith("_count"):
            out[k] = doc.get(k, 0)
        elif k in ("featured", "volunteer"):
            out[k] = bool(doc.get(k, False))
        elif k == "avg_rating":
            out[k] = float(doc.get(k, 0) or 0)
        else:
            out[k] = doc.get(k, "")
    return out

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
        "volunteer": doc.get("volunteer", False),
        "created_at": doc.get("created_at", ""),
    }

def public_entity(doc: dict) -> dict:
    keep = ["id", "user_id", "rep_name", "rep_whatsapp",
            "entity_name", "entity_email", "entity_phone", "entity_type",
            "country", "state", "city", "address", "description",
            "website", "logo_url", "cover_url", "facebook", "instagram",
            "created_at", "updated_at"]
    return {k: doc.get(k, "") for k in keep}

def public_event(doc: dict) -> dict:
    keep = ["id", "entity_id", "entity_name", "name", "date", "time",
            "location", "description", "needs", "cover_url",
            "created_at", "updated_at"]
    return {k: doc.get(k, "") for k in keep}

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
        "volunteer": bool(payload.volunteer),
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
        "linkedin": payload.linkedin or "",
        "tiktok": payload.tiktok or "",
        "youtube": payload.youtube or "",
        "volunteer": bool(payload.volunteer),
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
        "volunteer": bool(payload.volunteer),
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
    entity = None
    if current.get("role") == "entrepreneur":
        p = await db.entrepreneurs.find_one({"user_id": current["id"]}, {"_id": 0})
        if p:
            profile = public_entrepreneur(p)
    elif current.get("role") == "entity":
        e = await db.entities.find_one({"user_id": current["id"]}, {"_id": 0})
        if e:
            entity = public_entity(e)
    return {"user": public_user(current), "profile": profile, "entity": entity}

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
    cursor = db.entrepreneurs.find(filt, {"_id": 0}).sort([("featured", -1), ("avg_rating", -1), ("ratings_count", -1), ("created_at", -1)]).skip(skip).limit(limit)
    items = [public_entrepreneur(d) async for d in cursor]
    return {"total": total, "items": items}

@api.get("/entrepreneurs/preview")
async def preview_entrepreneurs(limit: int = Query(3, ge=1, le=6)):
    """Public teaser preview (without auth) — used to show a few cards on the landing/wall."""
    cursor = db.entrepreneurs.find({}, {"_id": 0}).sort([("featured", -1), ("avg_rating", -1), ("ratings_count", -1), ("created_at", -1)]).limit(limit)
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

# ---------------- Entity Registration ----------------
@api.post("/auth/register-entity")
async def auth_register_entity(payload: RegisterEntityIn, response: Response):
    email = payload.email.lower().strip()
    if payload.entity_type not in ENTITY_TYPES:
        raise HTTPException(status_code=400, detail="Invalid entity type")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    user_doc = {
        "id": uid, "email": email,
        "password_hash": hash_password(payload.password),
        "role": "entity",
        "full_name": payload.rep_name.strip(),
        "phone": payload.rep_whatsapp.strip(),
        "city": payload.city.strip(),
        "state": payload.state or "",
        "interests": [],
        "source": payload.source or "",
        "volunteer": False,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    entity = {
        "id": str(uuid.uuid4()), "user_id": uid,
        "rep_name": payload.rep_name.strip(),
        "rep_whatsapp": payload.rep_whatsapp.strip(),
        "entity_name": payload.entity_name.strip(),
        "entity_email": (payload.entity_email or "").strip().lower(),
        "entity_phone": payload.entity_phone.strip(),
        "entity_type": payload.entity_type,
        "country": payload.country or "",
        "state": payload.state or "",
        "city": payload.city.strip(),
        "address": payload.address or "",
        "description": payload.description or "",
        "website": payload.website or "",
        "logo_url": payload.logo_url or "",
        "cover_url": payload.cover_url or "",
        "facebook": payload.facebook or "",
        "instagram": payload.instagram or "",
        "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.entities.insert_one(entity)
    token = create_access_token(uid, email, "entity")
    set_auth_cookie(response, token)
    return {
        "user": public_user(user_doc),
        "entity": public_entity(entity),
        "access_token": token,
    }

@api.put("/entities/me")
async def update_my_entity(payload: EntityUpdate, current=Depends(get_current_user)):
    if current.get("role") != "entity":
        raise HTTPException(status_code=403, detail="Only entity reps can edit")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "entity_type" in update and update["entity_type"] not in ENTITY_TYPES:
        raise HTTPException(status_code=400, detail="Invalid entity type")
    update["updated_at"] = now_iso()
    res = await db.entities.find_one_and_update(
        {"user_id": current["id"]}, {"$set": update}, return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Entity not found")
    res.pop("_id", None)
    return public_entity(res)

# ---------------- Events ----------------
@api.post("/events")
async def create_event(payload: EventIn, current=Depends(get_current_user)):
    if current.get("role") != "entity":
        raise HTTPException(status_code=403, detail="Only entities can create events")
    entity = await db.entities.find_one({"user_id": current["id"]}, {"_id": 0})
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    event = {
        "id": str(uuid.uuid4()),
        "entity_id": entity["id"],
        "entity_name": entity["entity_name"],
        "name": payload.name.strip(),
        "date": payload.date,
        "time": payload.time or "",
        "location": payload.location.strip(),
        "description": payload.description or "",
        "needs": payload.needs or "",
        "cover_url": payload.cover_url or "",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.events.insert_one(event)
    return public_event(event)

@api.get("/events")
async def list_events(current=Depends(get_current_user)):
    # All events visible to any authenticated user
    cursor = db.events.find({}, {"_id": 0}).sort("date", 1)
    items = [public_event(d) async for d in cursor]
    return {"items": items, "total": len(items)}

@api.get("/events/public")
async def list_events_public():
    """Public endpoint — used for landing /eventos page. Returns ALL events
    sorted by date ascending so users always see something, even if some
    events are in the past."""
    cursor = db.events.find({}, {"_id": 0}).sort("date", 1).limit(500)
    items = [public_event(d) async for d in cursor]
    # Enrich with entity logo for better cards
    for it in items:
        ent = await db.entities.find_one({"id": it["entity_id"]}, {"_id": 0, "logo_url": 1, "entity_type": 1})
        it["entity_logo"] = (ent or {}).get("logo_url", "")
        it["entity_type"] = (ent or {}).get("entity_type", "")
    return {"items": items, "total": len(items)}

@api.get("/events/mine")
async def list_my_events(current=Depends(get_current_user)):
    if current.get("role") != "entity":
        raise HTTPException(status_code=403, detail="Only entities")
    entity = await db.entities.find_one({"user_id": current["id"]}, {"_id": 0})
    if not entity:
        return {"items": [], "total": 0}
    cursor = db.events.find({"entity_id": entity["id"]}, {"_id": 0}).sort("date", -1)
    items = [public_event(d) async for d in cursor]
    return {"items": items, "total": len(items)}

@api.put("/events/{eid}")
async def update_event(eid: str, payload: EventUpdate, current=Depends(get_current_user)):
    if current.get("role") != "entity":
        raise HTTPException(status_code=403, detail="Only entities")
    entity = await db.entities.find_one({"user_id": current["id"]}, {"_id": 0})
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    res = await db.events.find_one_and_update(
        {"id": eid, "entity_id": entity["id"]}, {"$set": update}, return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Event not found")
    res.pop("_id", None)
    return public_event(res)

@api.delete("/events/{eid}")
async def delete_event(eid: str, current=Depends(get_current_user)):
    if current.get("role") not in ("entity", "admin"):
        raise HTTPException(status_code=403, detail="Forbidden")
    filt = {"id": eid}
    if current.get("role") == "entity":
        entity = await db.entities.find_one({"user_id": current["id"]}, {"_id": 0})
        if not entity:
            raise HTTPException(status_code=404, detail="Entity not found")
        filt["entity_id"] = entity["id"]
    res = await db.events.delete_one(filt)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"ok": True}

# ---------------- Volunteer toggle (user / entrepreneur) ----------------
@api.put("/me/volunteer")
async def toggle_volunteer(payload: VolunteerToggle, current=Depends(get_current_user)):
    if current.get("role") not in ("entrepreneur", "client"):
        raise HTTPException(status_code=403, detail="Only entrepreneurs or users")
    await db.users.update_one({"id": current["id"]}, {"$set": {"volunteer": bool(payload.volunteer)}})
    if current.get("role") == "entrepreneur":
        await db.entrepreneurs.update_one({"user_id": current["id"]}, {"$set": {"volunteer": bool(payload.volunteer)}})
    return {"ok": True, "volunteer": bool(payload.volunteer)}

# ---------------- Ratings ----------------
async def _recompute_entrepreneur_rating(entrepreneur_id: str):
    """Aggregate ratings for an entrepreneur and persist avg + count on doc."""
    pipeline = [
        {"$match": {"entrepreneur_id": entrepreneur_id}},
        {"$group": {"_id": "$entrepreneur_id", "avg": {"$avg": "$stars"}, "count": {"$sum": 1}}},
    ]
    result = await db.ratings.aggregate(pipeline).to_list(length=1)
    avg = round(float(result[0]["avg"]), 2) if result else 0.0
    count = int(result[0]["count"]) if result else 0
    await db.entrepreneurs.update_one(
        {"id": entrepreneur_id},
        {"$set": {"avg_rating": avg, "ratings_count": count, "updated_at": now_iso()}},
    )
    return avg, count

@api.post("/entrepreneurs/{eid}/rate")
async def rate_entrepreneur(eid: str, payload: RatingIn, current=Depends(get_current_user)):
    # Prevent entrepreneurs from rating themselves
    ent = await db.entrepreneurs.find_one({"id": eid}, {"_id": 0, "id": 1, "user_id": 1})
    if not ent:
        raise HTTPException(status_code=404, detail="Entrepreneur not found")
    if ent.get("user_id") == current["id"]:
        raise HTTPException(status_code=400, detail="No puedes calificar tu propio perfil")
    # Upsert — one rating per user per entrepreneur
    doc = {
        "entrepreneur_id": eid,
        "user_id": current["id"],
        "user_email": current.get("email", ""),
        "user_name": current.get("full_name", "") or current.get("email", ""),
        "stars": int(payload.stars),
        "comment": (payload.comment or "").strip(),
        "updated_at": now_iso(),
    }
    existing = await db.ratings.find_one({"entrepreneur_id": eid, "user_id": current["id"]}, {"_id": 0, "id": 1})
    if existing:
        await db.ratings.update_one(
            {"entrepreneur_id": eid, "user_id": current["id"]},
            {"$set": doc},
        )
    else:
        doc["id"] = str(uuid.uuid4())
        doc["created_at"] = now_iso()
        await db.ratings.insert_one(doc)
    avg, count = await _recompute_entrepreneur_rating(eid)
    return {"ok": True, "avg_rating": avg, "ratings_count": count}

@api.get("/entrepreneurs/{eid}/ratings")
async def list_ratings(eid: str):
    cursor = db.ratings.find({"entrepreneur_id": eid}, {"_id": 0, "user_id": 0, "user_email": 0}).sort("created_at", -1).limit(100)
    items = await cursor.to_list(length=100)
    ent = await db.entrepreneurs.find_one({"id": eid}, {"_id": 0, "avg_rating": 1, "ratings_count": 1})
    return {
        "items": items,
        "total": len(items),
        "avg_rating": float((ent or {}).get("avg_rating", 0) or 0),
        "ratings_count": int((ent or {}).get("ratings_count", 0) or 0),
    }

@api.get("/entrepreneurs/{eid}/my-rating")
async def my_rating(eid: str, current=Depends(get_current_user)):
    rec = await db.ratings.find_one({"entrepreneur_id": eid, "user_id": current["id"]}, {"_id": 0, "user_id": 0, "user_email": 0})
    return rec or {"stars": 0, "comment": ""}

@api.delete("/entrepreneurs/{eid}/rate")
async def delete_my_rating(eid: str, current=Depends(get_current_user)):
    res = await db.ratings.delete_one({"entrepreneur_id": eid, "user_id": current["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No rating found")
    await _recompute_entrepreneur_rating(eid)
    return {"ok": True}

# ---------------- Password reset ----------------
@api.get("/entrepreneurs/me/stats")
async def my_entrepreneur_stats(current=Depends(get_current_user)):
    if current.get("role") != "entrepreneur":
        raise HTTPException(status_code=403, detail="Only entrepreneurs")
    ent = await db.entrepreneurs.find_one({"user_id": current["id"]}, {"_id": 0})
    if not ent:
        raise HTTPException(status_code=404, detail="Profile not found")
    avg = float(ent.get("avg_rating", 0) or 0)
    count = int(ent.get("ratings_count", 0) or 0)

    # Compute rank: how many entrepreneurs have a strictly better position
    # (featured > me) OR (same featured-status but higher avg)
    # OR (same featured and avg, but more ratings)
    total = await db.entrepreneurs.count_documents({})
    ahead = await db.entrepreneurs.count_documents({
        "$or": [
            {"featured": True, "id": {"$ne": ent["id"]}} if not ent.get("featured") else {"_id": {"$exists": False}},
            {"featured": bool(ent.get("featured", False)), "avg_rating": {"$gt": avg}},
            {"featured": bool(ent.get("featured", False)), "avg_rating": avg, "ratings_count": {"$gt": count}},
        ]
    })
    rank = ahead + 1

    # Load last 20 ratings with comments
    cursor = db.ratings.find(
        {"entrepreneur_id": ent["id"]},
        {"_id": 0, "user_id": 0, "user_email": 0}
    ).sort("created_at", -1).limit(20)
    reviews = await cursor.to_list(length=20)

    return {
        "avg_rating": avg,
        "ratings_count": count,
        "view_count": int(ent.get("view_count", 0) or 0),
        "contact_click_count": int(ent.get("contact_click_count", 0) or 0),
        "rank": rank,
        "total": total,
        "featured": bool(ent.get("featured", False)),
        "reviews": reviews,
    }

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

@api.post("/auth/forgot-password")
async def auth_forgot_password(payload: ForgotPasswordIn):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email}, {"_id": 0, "id": 1, "full_name": 1, "email": 1})
    # ALWAYS return the same message (prevents account enumeration)
    generic = {"ok": True, "message": "Si tu email está registrado, recibirás un enlace para restablecer la contraseña."}
    if not user:
        return generic

    raw_token = secrets.token_urlsafe(48)
    token_hash = _hash_token(raw_token)
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    await db.password_resets.insert_one({
        "user_id": user["id"],
        "email": email,
        "token_hash": token_hash,
        "expires_at": expires.isoformat(),
        "used": False,
        "created_at": now_iso(),
    })
    site = os.environ.get("SITE_URL", "").rstrip("/")
    reset_url = f"{site}/reset-password?token={raw_token}" if site else f"/reset-password?token={raw_token}"
    asyncio.create_task(send_password_reset(email, user.get("full_name", ""), reset_url))
    return generic

@api.post("/auth/reset-password")
async def auth_reset_password(payload: ResetPasswordIn):
    token_hash = _hash_token(payload.token)
    record = await db.password_resets.find_one({"token_hash": token_hash, "used": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired link")
    try:
        expires_at = datetime.fromisoformat(record["expires_at"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid link")
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Link expired")
    new_hash = hash_password(payload.password)
    await db.users.update_one({"id": record["user_id"]}, {"$set": {"password_hash": new_hash}})
    await db.password_resets.update_one({"token_hash": token_hash}, {"$set": {"used": True, "used_at": now_iso()}})
    # Invalidate any other outstanding tokens for this user
    await db.password_resets.update_many(
        {"user_id": record["user_id"], "used": False, "token_hash": {"$ne": token_hash}},
        {"$set": {"used": True, "used_at": now_iso()}},
    )
    return {"ok": True}

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
    total_entities = await db.entities.count_documents({})
    total_events = await db.events.count_documents({})
    total_messages = await db.contact_messages.count_documents({})
    unread = await db.contact_messages.count_documents({"read": False})
    featured = await db.entrepreneurs.count_documents({"featured": True})
    total_views = await db.profile_views.count_documents({})
    total_clicks = await db.contact_clicks.count_documents({})
    total_volunteers = await db.users.count_documents({"volunteer": True})
    return {
        "entrepreneurs": total_ents,
        "clients": total_clients,
        "entities": total_entities,
        "events": total_events,
        "messages": total_messages,
        "unread_messages": unread,
        "featured": featured,
        "total_views": total_views,
        "total_contact_clicks": total_clicks,
        "volunteers": total_volunteers,
    }

@api.get("/admin/stats/charts")
async def admin_stats_charts(days: int = Query(30, ge=7, le=180), _=Depends(require_admin)):
    """Aggregated chart data: signups by day, by referral source, by role."""
    from datetime import timedelta as _td
    end = datetime.now(timezone.utc)
    start = end - _td(days=days)
    start_iso = start.isoformat()

    # Signups by day (entrepreneurs + clients + entities)
    by_day: dict = {}
    for i in range(days + 1):
        d = (start + _td(days=i)).strftime("%Y-%m-%d")
        by_day[d] = {"date": d, "entrepreneurs": 0, "clients": 0, "entities": 0}

    async for u in db.users.find({"created_at": {"$gte": start_iso}}, {"_id": 0, "created_at": 1, "role": 1}):
        day = (u.get("created_at") or "")[:10]
        if day in by_day:
            r = u.get("role")
            if r == "entrepreneur":
                by_day[day]["entrepreneurs"] += 1
            elif r == "client":
                by_day[day]["clients"] += 1
            elif r == "entity":
                by_day[day]["entities"] += 1

    signups_series = sorted(by_day.values(), key=lambda x: x["date"])

    # By referral source (all users in range)
    src_counts: dict = {k: 0 for k in REFERRAL_SOURCES}
    src_counts[""] = 0
    async for u in db.users.find({"created_at": {"$gte": start_iso}}, {"_id": 0, "source": 1}):
        s = u.get("source") or ""
        if s in src_counts:
            src_counts[s] += 1
        else:
            src_counts[s] = src_counts.get(s, 0) + 1
    by_source = [{"source": k or "Sin fuente", "count": v} for k, v in src_counts.items() if v > 0]

    # By role (pie)
    roles_dist = [
        {"role": "entrepreneurs", "count": await db.entrepreneurs.count_documents({})},
        {"role": "clients", "count": await db.users.count_documents({"role": "client"})},
        {"role": "entities", "count": await db.entities.count_documents({})},
    ]

    return {
        "range_days": days,
        "signups_by_day": signups_series,
        "by_source": by_source,
        "by_role": roles_dist,
    }

@api.get("/admin/entities")
async def admin_list_entities(q: Optional[str] = None, _=Depends(require_admin)):
    filt = {}
    if q:
        filt["$or"] = [
            {"entity_name": {"$regex": q, "$options": "i"}},
            {"rep_name": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.entities.find(filt, {"_id": 0}).sort("created_at", -1).limit(500)
    items = [public_entity(d) async for d in cursor]
    for item in items:
        u = await db.users.find_one({"id": item["user_id"]}, {"_id": 0, "email": 1, "source": 1})
        item["email"] = (u or {}).get("email", "")
        item["source"] = (u or {}).get("source", "")
    return {"items": items, "total": len(items)}

@api.delete("/admin/entities/{eid}")
async def admin_delete_entity(eid: str, _=Depends(require_admin)):
    doc = await db.entities.find_one({"id": eid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Entity not found")
    await db.entities.delete_one({"id": eid})
    await db.users.delete_one({"id": doc["user_id"], "role": "entity"})
    await db.events.delete_many({"entity_id": eid})
    return {"ok": True}

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
        u = await db.users.find_one({"id": item["user_id"]}, {"_id": 0, "email": 1, "source": 1, "volunteer": 1})
        item["email"] = (u or {}).get("email", "")
        item["source"] = (u or {}).get("source", "")
        item["volunteer"] = bool((u or {}).get("volunteer", False))
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
    await db.entities.create_index("user_id")
    await db.events.create_index("entity_id")
    await db.events.create_index("date")
    await db.ratings.create_index([("entrepreneur_id", 1), ("user_id", 1)], unique=True)
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
         "cover_url": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200"},
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
