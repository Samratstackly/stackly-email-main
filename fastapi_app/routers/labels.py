from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Literal, Set

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr

#  lock symbol (protected endpoints)
from fastapi_app.routers.auth import get_current_user

#  IMPORTANT: main.py already uses prefix="/labels"
router = APIRouter(tags=["Labels"])

#  Only two labels
LabelName = Literal["Friends", "Office"]

#  Office domains
OFFICE_DOMAINS: Set[str] = {"thestackly.com", "stackly.com"}

#  Friends email list
FRIENDS_LIST: Set[str] = {
    "karthik@gmail.com",
    "arun@gmail.com",
    "aishu@gmail.com",
    "sneha@gmail.com",
}

# -----------------------------
# In-memory DB (per user)
# -----------------------------
LABEL_DB: Dict[int, List[Dict[str, str]]] = {}
MAIL_DB: Dict[int, Dict[str, Dict[str, Any]]] = {}

# -----------------------------
# Schemas
# -----------------------------
class LabelOut(BaseModel):
    id: str
    name: LabelName
    color: str


class MailCreateIn(BaseModel):
    from_email: EmailStr
    from_name: str
    to: List[EmailStr]
    subject: str
    body_html: str


class MailOut(BaseModel):
    id: str
    label: LabelName
    from_email: EmailStr
    from_name: str
    to: List[EmailStr]
    subject: str
    body_html: str
    created_at: datetime
    is_read: bool = False


# -----------------------------
# Helpers
# -----------------------------
def _user_id(user: Any) -> int:
    if isinstance(user, dict):
        return int(user.get("id", 0) or 0)
    return int(getattr(user, "id", 0) or 0)


def _user_email(user: Any) -> str:
    if isinstance(user, dict):
        return str(user.get("email") or "")
    return str(getattr(user, "email", "") or "")


def _domain(email: str) -> str:
    email = (email or "").strip().lower()
    if "@" not in email:
        return ""
    return email.split("@")[-1]


def _detect_label(from_email: str) -> LabelName:
    sender = (from_email or "").strip().lower()

    if _domain(sender) in OFFICE_DOMAINS:
        return "Office"

    if sender in FRIENDS_LIST:
        return "Friends"

    return "Friends"


def _seed_demo_mails(uid: int, user_email: str) -> None:
    demo_mails = [
        {
            "from_email": "karthik@gmail.com",
            "from_name": "Karthik",
            "to": [user_email],
            "subject": " Weekend plan?",
            "body_html": "<p>Hi Parvina, shall we meet this weekend?</p>",
        },
        {
            "from_email": "hr@thestackly.com",
            "from_name": "Stackly HR",
            "to": [user_email],
            "subject": " Quarterly Meeting Reminder",
            "body_html": "<p>Quarterly meeting scheduled Friday 4 PM.</p>",
        },
    ]

    for d in demo_mails:
        mid = uuid.uuid4().hex
        MAIL_DB[uid][mid] = {
            "id": mid,
            "label": _detect_label(d["from_email"]),
            "from_email": d["from_email"],
            "from_name": d["from_name"],
            "to": d["to"],
            "subject": d["subject"],
            "body_html": d["body_html"],
            "created_at": datetime.utcnow(),
            "is_read": False,
        }


def _ensure_seed(uid: int, user_email: str) -> None:
    if uid not in MAIL_DB:
        MAIL_DB[uid] = {}

    if uid not in LABEL_DB:
        LABEL_DB[uid] = [
            {"id": uuid.uuid4().hex, "name": "Friends", "color": "#8B5CF6"},
            {"id": uuid.uuid4().hex, "name": "Office", "color": "#22C55E"},
        ]

    if not MAIL_DB[uid]:
        _seed_demo_mails(uid, user_email)


# =========================================================
#  LABEL APIs
# =========================================================

#  GET /labels   (NOT /labels/labels)
@router.get("", response_model=List[LabelOut], summary="List Labels (Friends, Office)")
def list_labels(user=Depends(get_current_user)):
    uid = _user_id(user)
    uemail = _user_email(user) or "parvina@thestackly.com"
    if not uid:
        raise HTTPException(status_code=401, detail="Not authenticated")

    _ensure_seed(uid, uemail)
    return LABEL_DB[uid]


# =========================================================
#  MAIL APIs
# =========================================================

#  POST /labels/mails
@router.post("/mails", response_model=MailOut, summary="Create Mail (Auto Friends/Office)")
def create_mail(payload: MailCreateIn, user=Depends(get_current_user)):
    uid = _user_id(user)
    uemail = _user_email(user) or "parvina@thestackly.com"
    if not uid:
        raise HTTPException(status_code=401, detail="Not authenticated")

    _ensure_seed(uid, uemail)

    mid = uuid.uuid4().hex
    label = _detect_label(str(payload.from_email))

    mail = {
        "id": mid,
        "label": label,
        "from_email": payload.from_email,
        "from_name": payload.from_name,
        "to": payload.to,
        "subject": payload.subject,
        "body_html": payload.body_html,
        "created_at": datetime.utcnow(),
        "is_read": False,
    }
    MAIL_DB[uid][mid] = mail
    return mail


#  GET /labels/mails?label=Friends
#  GET /labels/mails?label=Office
@router.get("/mails", response_model=List[MailOut], summary="List Mails (Filter Friends/Office)")
def list_mails(
    user=Depends(get_current_user),
    label: Optional[LabelName] = Query(default=None, description="Filter: Friends or Office"),
    q: Optional[str] = Query(default=None, description="Search in subject/body"),
):
    uid = _user_id(user)
    uemail = _user_email(user) or "parvina@thestackly.com"
    if not uid:
        raise HTTPException(status_code=401, detail="Not authenticated")

    _ensure_seed(uid, uemail)

    mails = list(MAIL_DB[uid].values())

    if label:
        mails = [m for m in mails if m["label"] == label]

    if q:
        ql = q.lower()
        mails = [m for m in mails if ql in m["subject"].lower() or ql in m["body_html"].lower()]

    mails.sort(key=lambda x: x["created_at"], reverse=True)
    return mails


#  GET /labels/mails/{mail_id}
@router.get("/mails/{mail_id}", response_model=MailOut, summary="Open Mail")
def open_mail(mail_id: str, user=Depends(get_current_user)):
    uid = _user_id(user)
    uemail = _user_email(user) or "parvina@thestackly.com"
    if not uid:
        raise HTTPException(status_code=401, detail="Not authenticated")

    _ensure_seed(uid, uemail)

    mail = MAIL_DB[uid].get(mail_id)
    if not mail:
        raise HTTPException(status_code=404, detail="Mail not found")

    mail["is_read"] = True
    return mail
