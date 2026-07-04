from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import asyncio
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict

import bcrypt
import jwt
import resend
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr

from db import Database


# ============== Config ==============
JWT_ALGORITHM = "HS256"
ACCESS_TTL_MIN = 60 * 24  # 24h
REFRESH_TTL_DAYS = 7

db = Database(os.environ["DATABASE_URL"])

resend.api_key = os.environ.get("RESEND_API_KEY", "")

app = FastAPI()
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ============== Helpers ==============
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TTL_MIN),
        "type": "access",
    }
    return jwt.encode(payload, jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TTL_DAYS),
        "type": "refresh",
    }
    return jwt.encode(payload, jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none",
                        max_age=ACCESS_TTL_MIN * 60, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none",
                        max_age=REFRESH_TTL_DAYS * 86400, path="/")


def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if token:
        try:
            payload = jwt.decode(token, jwt_secret(), algorithms=[JWT_ALGORITHM])
            if payload.get("type") == "access":
                user = await db.get_user_by_id(payload["sub"])
                if user:
                    user.pop("password_hash", None)
                    return user
        except jwt.PyJWTError:
            pass

    raise HTTPException(status_code=401, detail="Not authenticated")


# ============== Auth Models ==============
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class PricingIn(BaseModel):
    currency: str = "USD"
    price_per_day: float = 0
    sleepover_fee: float = 0
    own_bed_fee: float = 0
    per_pet_daily: float = 0
    species_pricing: Dict[str, float] = {}
    extra_walks_daily: float = 0
    lawn_mow_fee: float = 0
    chore_pricing: Dict[str, float] = {}
    wifi_discount_enabled: bool = False
    wifi_discount_amount: float = 0


DEFAULT_PRICING = {
    "currency": "USD",
    "price_per_day": 50,
    "sleepover_fee": 25,
    "own_bed_fee": 10,
    "per_pet_daily": 5,
    "species_pricing": {},
    "extra_walks_daily": 8,
    "lawn_mow_fee": 30,
    "chore_pricing": {},
    "wifi_discount_enabled": False,
    "wifi_discount_amount": 0,
}


class ProfileIn(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    picture: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    languages: Optional[str] = None
    years_experience: Optional[int] = None
    services: Optional[List[str]] = None
    certifications: Optional[str] = None


import re as _re
def _normalize_username(s: str) -> str:
    s = (s or "").strip().lower()
    s = _re.sub(r"[^a-z0-9_-]+", "-", s)
    s = _re.sub(r"-+", "-", s).strip("-")
    return s[:32]


def _default_username_for(user_id: str, name: str) -> str:
    base = _normalize_username(name) or "sitter"
    return f"{base}-{user_id[-6:]}"


# ============== Form Models ==============
class TaskIn(BaseModel):
    task_id: str = Field(default_factory=lambda: f"task_{uuid.uuid4().hex[:8]}")
    type: str
    custom_type: Optional[str] = None
    count: int = 1
    details: str = ""


class EmergencyContactIn(BaseModel):
    name: str = ""
    phone: str = ""
    relation: str = ""


class VetInfoIn(BaseModel):
    name: str = ""
    phone: str = ""
    address: str = ""
    notes: str = ""


class PetIn(BaseModel):
    pet_id: str = Field(default_factory=lambda: f"pet_{uuid.uuid4().hex[:8]}")
    type: str
    name: str
    custom_type: Optional[str] = None
    feeding_schedule: List[dict] = []
    walk_frequency: Optional[str] = None
    walk_notes: Optional[str] = None
    vet: Optional[VetInfoIn] = None


class FormCreateIn(BaseModel):
    """Sitter creates a new intake form to send to their client."""
    title: str = "House-sitting intake"
    client_name: str = ""
    client_email: str = ""


class FormMetaUpdateIn(BaseModel):
    title: Optional[str] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None


class FormSubmitIn(BaseModel):
    """Payload the client submits to fill out the form."""
    date_start: Optional[str] = None
    date_end: Optional[str] = None
    selected_dates: List[str] = []
    home_address: str = ""
    stay_required: bool = True
    bed_provided: bool = True
    stay_notes: str = ""
    pets: List[PetIn] = []
    same_vet_for_all: bool = True
    vet_shared: Optional[VetInfoIn] = None
    tasks: List[TaskIn] = []
    owner_name: str = ""
    owner_phone: str = ""
    owner_email: str = ""
    emergency_contacts: List[EmergencyContactIn] = []
    water_shutoff: str = ""
    wifi_password: str = ""
    wifi_shared: bool = False
    guests_allowed: bool = False
    guests_notes: str = ""
    other_notes: str = ""


class SendEmailIn(BaseModel):
    recipient_email: Optional[EmailStr] = None  # defaults to form.client_email
    personal_note: Optional[str] = None


# ============== Auth Endpoints ==============
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower().strip()
    existing = await db.get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": email,
        "name": body.name,
        "password_hash": hash_password(body.password),
        "auth_provider": "password",
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.insert_user(doc)

    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"user_id": user_id, "email": email, "name": body.name, "picture": None, "auth_provider": "password"}


@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower().strip()
    user = await db.get_user_by_email(email)
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access = create_access_token(user["user_id"], email)
    refresh = create_refresh_token(user["user_id"])
    set_auth_cookies(response, access, refresh)
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "auth_provider": user.get("auth_provider", "password"),
    }


@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    clear_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "auth_provider": user.get("auth_provider", "password"),
    }


@api.get("/me/pricing")
async def get_pricing(user: dict = Depends(get_current_user)):
    pricing = user.get("pricing") or DEFAULT_PRICING
    return {**DEFAULT_PRICING, **pricing}


@api.put("/me/pricing")
async def update_pricing(body: PricingIn, user: dict = Depends(get_current_user)):
    patch = body.model_dump()
    await db.update_user(user["user_id"], {"pricing": patch})
    return patch


def _safe_profile(user: dict) -> dict:
    return {
        "name": user.get("name", ""),
        "bio": user.get("bio", "") or "",
        "picture": user.get("picture") or "",
        "phone": user.get("phone", "") or "",
        "location": user.get("location", "") or "",
        "languages": user.get("languages", "") or "",
        "years_experience": user.get("years_experience") or 0,
        "services": user.get("services") or [],
        "certifications": user.get("certifications", "") or "",
        "verified_sits": int(user.get("verified_sits") or 0),
    }


@api.get("/me/profile")
async def get_my_profile(user: dict = Depends(get_current_user)):
    return _safe_profile(user)


@api.put("/me/profile")
async def update_my_profile(body: ProfileIn, user: dict = Depends(get_current_user)):
    patch = {}
    if body.name is not None:
        cleaned = body.name.strip()[:80]
        if not cleaned:
            raise HTTPException(status_code=400, detail="Name can't be blank")
        patch["name"] = cleaned
    if body.bio is not None:
        patch["bio"] = body.bio.strip()[:600]
    if body.picture is not None:
        pic = body.picture.strip()
        # Protect Mongo: data-URL photos are limited to ~1.5MB (post-base64).
        # Plain http(s) URLs are fine at any reasonable length.
        if pic.startswith("data:") and len(pic) > 1_500_000:
            raise HTTPException(status_code=413, detail="Profile photo is too large. Please use a smaller image.")
        patch["picture"] = pic
    if body.phone is not None:
        patch["phone"] = body.phone.strip()[:40]
    if body.location is not None:
        patch["location"] = body.location.strip()[:120]
    if body.languages is not None:
        patch["languages"] = body.languages.strip()[:120]
    if body.years_experience is not None:
        try:
            patch["years_experience"] = max(0, min(80, int(body.years_experience)))
        except (TypeError, ValueError):
            patch["years_experience"] = 0
    if body.services is not None:
        patch["services"] = [s.strip()[:60] for s in body.services if s and s.strip()][:20]
    if body.certifications is not None:
        patch["certifications"] = body.certifications.strip()[:600]

    if patch:
        await db.update_user(user["user_id"], patch)
    fresh = await db.get_user_by_id(user["user_id"])
    return _safe_profile(fresh)


# ============== Forms Endpoints ==============
def _empty_submission() -> dict:
    return {
        "date_start": None,
        "date_end": None,
        "selected_dates": [],
        "home_address": "",
        "stay_required": True,
        "bed_provided": True,
        "stay_notes": "",
        "pets": [],
        "tasks": [],
        "owner_name": "",
        "owner_phone": "",
        "owner_email": "",
        "emergency_contacts": [],
        "same_vet_for_all": True,
        "vet_shared": None,
        "water_shutoff": "",
        "wifi_password": "",
        "wifi_shared": False,
        "guests_allowed": False,
        "guests_notes": "",
        "other_notes": "",
    }


def _strip_form(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


@api.post("/forms")
async def create_form(body: FormCreateIn, user: dict = Depends(get_current_user)):
    form_id = f"form_{uuid.uuid4().hex[:12]}"
    share_token = secrets.token_urlsafe(16)
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "form_id": form_id,
        "user_id": user["user_id"],
        "sitter_name": user.get("name", ""),
        "sitter_email": user.get("email", ""),
        "share_token": share_token,
        "title": body.title or "House-sitting intake",
        "client_name": body.client_name or "",
        "client_email": (body.client_email or "").strip().lower(),
        "status": "pending",
        "completed_at": None,
        "sitter_confirmed": False,
        "confirmed_at": None,
        "created_at": now,
        "updated_at": now,
        **_empty_submission(),
    }
    await db.insert_form(dict(doc))
    return _strip_form(doc)


@api.get("/forms")
async def list_forms(user: dict = Depends(get_current_user)):
    return await db.list_forms_by_user(user["user_id"])


@api.get("/forms/{form_id}")
async def get_form(form_id: str, user: dict = Depends(get_current_user)):
    doc = await db.get_form(form_id, user_id=user["user_id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Form not found")
    return doc


@api.put("/forms/{form_id}")
async def update_form_meta(form_id: str, body: FormMetaUpdateIn, user: dict = Depends(get_current_user)):
    """Sitter can update title / client info."""
    doc = await db.get_form(form_id, user_id=user["user_id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Form not found")
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    if "client_email" in patch:
        patch["client_email"] = (patch["client_email"] or "").strip().lower()
    patch["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.update_form(form_id, patch)
    merged = {**doc, **patch}
    return merged


@api.delete("/forms/{form_id}")
async def delete_form(form_id: str, user: dict = Depends(get_current_user)):
    deleted = await db.delete_form(form_id, user["user_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Form not found")
    return {"ok": True}


@api.post("/forms/{form_id}/confirm")
async def confirm_form(form_id: str, user: dict = Depends(get_current_user)):
    """Sitter confirms a completed care plan; the dates then show on their public calendar."""
    doc = await db.get_form(form_id, user_id=user["user_id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Form not found")
    if doc.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Only completed care plans can be confirmed")
    if doc.get("sitter_confirmed"):
        raise HTTPException(status_code=400, detail="This care plan is already confirmed")
    now = datetime.now(timezone.utc).isoformat()
    await db.update_form(
        form_id,
        {"sitter_confirmed": True, "confirmed_at": now, "updated_at": now},
        user_id=user["user_id"],
    )
    return {**doc, "sitter_confirmed": True, "confirmed_at": now, "updated_at": now}


# ============== Public (client-facing) Endpoints ==============
def _expand_form_dates(form: dict) -> List[str]:
    """Return list of YYYY-MM-DD strings the form covers (selected_dates if any, else date_start..date_end)."""
    selected = form.get("selected_dates") or []
    if selected:
        return [s for s in selected if isinstance(s, str) and len(s) == 10]
    start = form.get("date_start")
    end = form.get("date_end") or start
    if not start:
        return []
    try:
        s = datetime.strptime(start, "%Y-%m-%d").date()
        e = datetime.strptime(end, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return []
    if e < s:
        return []
    days = []
    cur = s
    while cur <= e:
        days.append(cur.isoformat())
        cur = cur + timedelta(days=1)
    return days


@api.get("/public/sitter/{user_id}")
async def public_sitter_profile(user_id: str):
    """Public-facing sitter profile + calendar of confirmed booking dates."""
    user = await db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Sitter not found")
    user.pop("password_hash", None)
    user.pop("email", None)
    forms = await db.list_confirmed_forms(user_id)
    booked: set = set()
    for f in forms:
        for d in _expand_form_dates(f):
            booked.add(d)
    return {
        "user_id": user_id,
        "profile": _safe_profile(user),
        "booked_dates": sorted(booked),
    }


@api.get("/public/forms/{share_token}")
async def public_form(share_token: str):
    doc = await db.get_form_by_share_token(share_token)
    if not doc:
        raise HTTPException(status_code=404, detail="Form not found")
    doc.pop("sitter_email", None)
    sitter = await db.get_user_by_id(doc.get("user_id"))
    if sitter:
        sitter.pop("password_hash", None)
        sitter.pop("email", None)
    pricing = (sitter or {}).get("pricing") or DEFAULT_PRICING
    doc["pricing"] = {**DEFAULT_PRICING, **pricing}
    if sitter:
        doc["sitter_profile"] = _safe_profile(sitter)

    # Sitter's booked dates from OTHER confirmed care plans (so the client
    # can't pick days the sitter is already committed elsewhere).
    booked: set = set()
    forms = await db.list_confirmed_forms(doc.get("user_id"), exclude_form_id=doc.get("form_id"))
    for f in forms:
        for d in _expand_form_dates(f):
            booked.add(d)
    doc["sitter_booked_dates"] = sorted(booked)

    doc.pop("user_id", None)
    return doc


@api.post("/public/forms/{share_token}/submit")
async def submit_public_form(share_token: str, body: FormSubmitIn):
    """Client submits the filled-out form. No auth required."""
    doc = await db.get_form_by_share_token(share_token)
    if not doc:
        raise HTTPException(status_code=404, detail="Form not found")
    if doc.get("status") == "completed":
        raise HTTPException(status_code=400, detail="This form has already been submitted")

    patch = body.model_dump()
    patch["status"] = "completed"
    patch["completed_at"] = datetime.now(timezone.utc).isoformat()
    patch["updated_at"] = patch["completed_at"]
    await db.update_form_by_share_token(share_token, patch)
    merged = {**doc, **patch}
    # return publicly safe doc
    merged.pop("user_id", None)
    merged.pop("sitter_email", None)
    return merged


# ============== Email ==============
def _build_email_html(form: dict, frontend_url: str, sitter_name: str, personal_note: Optional[str]) -> str:
    share_url = f"{frontend_url}/share/{form['share_token']}"
    note_block = ""
    if personal_note:
        note_block = f"""
        <tr><td style="padding:0 24px 16px 24px">
            <div style="background:#F4F3ED;border-radius:12px;padding:16px;color:#3E3A37;font-family:Nunito,Arial,sans-serif;font-size:15px;line-height:1.55;white-space:pre-wrap">{personal_note}</div>
        </td></tr>
        """

    greeting = f"Hi {form.get('client_name')}," if form.get('client_name') else "Hi,"
    intro = (
        f"I'm {sitter_name}, and I'll be looking after your home while you're away. "
        "To make sure I take wonderful care of everything, could you fill out this short care plan? "
        "It only takes a few minutes."
    )

    return f"""
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FAF9F6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:32px 16px;font-family:Nunito,Arial,sans-serif">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 8px 30px rgba(62,58,55,0.08)">
      <tr><td style="padding:32px 24px 16px 24px">
        <div style="font-family:Manrope,Arial,sans-serif;font-weight:800;font-size:24px;color:#3E3A37">HomeNest</div>
        <div style="color:#76706A;font-size:14px;margin-top:4px">A quick care plan from your house-sitter</div>
      </td></tr>
      <tr><td style="padding:8px 24px 0 24px">
        <h1 style="font-family:Manrope,Arial,sans-serif;font-size:26px;color:#3E3A37;margin:0 0 10px 0;line-height:1.2">{greeting}</h1>
        <p style="color:#3E3A37;font-size:15px;line-height:1.6;margin:0 0 18px 0">{intro}</p>
      </td></tr>
      {note_block}
      <tr><td style="padding:8px 24px 32px 24px">
        <a href="{share_url}" style="display:inline-block;background:#8A9A7A;color:#FFFFFF;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:700;font-family:Manrope,Arial,sans-serif">Fill out the care plan</a>
        <p style="color:#A39E98;font-size:12px;margin-top:16px;word-break:break-all">Or open this link directly: {share_url}</p>
      </td></tr>
      <tr><td style="padding:16px 24px;background:#F4F3ED;color:#76706A;font-size:12px;font-family:Nunito,Arial,sans-serif">
        Sent with warmth by HomeNest — thoughtful care plans from the house-sitters who love their work.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
"""


@api.post("/forms/{form_id}/send-email")
async def send_form_email(form_id: str, body: SendEmailIn, user: dict = Depends(get_current_user)):
    form = await db.get_form(form_id, user_id=user["user_id"])
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    recipient = (str(body.recipient_email) if body.recipient_email else form.get("client_email", "")).strip().lower()
    if not recipient:
        raise HTTPException(status_code=400, detail="Provide a recipient email (or set one on the form).")

    api_key = os.environ.get("RESEND_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Email service is not configured. Please add your RESEND_API_KEY in backend .env to send emails. You can still copy and share the link.",
        )

    sender = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
    frontend_url = os.environ.get("FRONTEND_URL", "")
    html = _build_email_html(form, frontend_url, user.get("name", "your house-sitter"), body.personal_note)

    subject = f"Quick care plan from {user.get('name', 'your house-sitter')}"

    params = {
        "from": f"HomeNest <{sender}>",
        "to": [recipient],
        "subject": subject,
        "html": html,
    }

    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        return {"ok": True, "email_id": result.get("id") if isinstance(result, dict) else None}
    except Exception as e:
        logger.exception("Resend failed")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")


# ============== Startup ==============
@app.on_event("startup")
async def on_startup():
    await db.connect()
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@housesit.app").lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.get_user_by_email(admin_email)
    if not existing:
        await db.insert_user({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": admin_email,
            "name": "Admin",
            "password_hash": hash_password(admin_pw),
            "auth_provider": "password",
            "picture": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin user: {admin_email}")
    elif existing.get("password_hash") and not verify_password(admin_pw, existing["password_hash"]):
        await db.update_user(existing["user_id"], {"password_hash": hash_password(admin_pw)})


@app.on_event("shutdown")
async def on_shutdown():
    await db.close()


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000"), "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_BUILD = ROOT_DIR.parent / "frontend" / "build"
if FRONTEND_BUILD.exists():
    app.mount("/static", StaticFiles(directory=FRONTEND_BUILD / "static"), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        candidate = FRONTEND_BUILD / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_BUILD / "index.html")
