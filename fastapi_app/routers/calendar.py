from __future__ import annotations
from typing import TYPE_CHECKING, List, Optional, Any, Dict, Tuple
from datetime import datetime, date, timedelta
import secrets
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel
from asgiref.sync import sync_to_async
from django.db import transaction
from django.db.models import Q, Prefetch
from django.contrib.auth import get_user_model
from django.utils import timezone
from django_backend.models import Event, EventAttendee, EventReminder, Meeting, ChatRoom 
from fastapi_app.dependencies.auth import get_current_user
from fastapi_app.tasks import process_event_invites, send_event_reminder
from fastapi_app.schemas.calendar_schemas import EventCreate, EventRead, EventUpdate, AvailabilityRequest,AvailabilityResponse, AttendeeInput
from fastapi_app.routers.auth import get_current_user

if TYPE_CHECKING:
    from fastapi_app.schemas.calendar_schemas import CalendarCreate

router = APIRouter( tags=["Calendar"])
class AvailabilityRequest(BaseModel):
    date: date
    user_ids: List[int]


@router.post("/events/check-availability")
async def check_availability(payload: AvailabilityRequest):

    @sync_to_async
    def get_busy_blocks():
 
        result = {}

        for user_id in payload.user_ids:
            events = Event.objects.filter(
                Q(created_by_id=user_id) | Q(eventattendee__user_id=user_id),
                start_datetime__date=payload.date
            ).distinct() 
        
            result[str(user_id)] = [
                {
                    "start": event.start_datetime.strftime("%H:%M"),
                    "end": event.end_datetime.strftime("%H:%M")
                }
                for event in events
            ]
            
        return result
 
    return await get_busy_blocks()

User = get_user_model()
router = APIRouter()

@router.get("/events", response_model=List[EventRead])
async def get_events():

    events = await sync_to_async(
        lambda: list(
            Event.objects.prefetch_related("attendees__user__profile")
        )
    )()

    result = []

    for event in events:
        attendees_list = []

        for attendee in event.attendees.all():
            user = attendee.user

           
            attendees_list.append({
                "id": user.id,
                "full_name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "profile_image": (
                    user.profile.avatar.url
                    if hasattr(user, "profile") and user.profile.avatar
                    else None
                ),
                "role": attendee.role,
                "status": attendee.status
            })

        result.append({
            "id": event.id,
            "title": event.title,
            "start_datetime": event.start_datetime,
            "end_datetime": event.end_datetime,
            "description": event.description,
            "location": event.location,
            "created_by_id": event.created_by_id,
            "attendees": attendees_list
        })

    return result
   

# -----------------------------
# Helpers: date utils
# -----------------------------
def _start_of_week(d: date) -> date:
    return d - timedelta(days=d.weekday())


def _end_of_week(d: date) -> date:
    return _start_of_week(d) + timedelta(days=6)


# -----------------------------
# Helpers: user fields safe
# -----------------------------
def _full_name(user) -> str:
    first = (getattr(user, "first_name", "") or "").strip()
    last = (getattr(user, "last_name", "") or "").strip()
    name = f"{first} {last}".strip()
    if name:
        return name

    email = (getattr(user, "email", "") or "").strip()
    return email.split("@", 1)[0] if "@" in email else email


def _user_profile_picture(user) -> Optional[str]:
    """
    Tries profile.profile_picture.url, user.profile_picture.url, etc.
    Returns string URL if possible.
    """
    # profile.profile_picture
    prof = getattr(user, "profile", None)
    if prof and getattr(prof, "profile_picture", None):
        pic = prof.profile_picture
        try:
            return pic.url
        except Exception:
            return str(pic)

    # user.profile_picture
    pic2 = getattr(user, "profile_picture", None)
    if pic2:
        try:
            return pic2.url
        except Exception:
            return str(pic2)

    # fallback keys (if your user model has avatar/image)
    for k in ("avatar", "image", "photo"):
        v = getattr(user, k, None)
        if v:
            try:
                return v.url
            except Exception:
                return str(v)

    return None


def _prefetch_attendees():
    """
    Prefetch EventAttendee + join user -> avoids N+1.
    """
    ea_qs = EventAttendee.objects.select_related("user", "user__profile")
    return Prefetch(
        "event_attendees",
        queryset=ea_qs,
        to_attr="prefetched_event_attendees",
    )


def _serialize_event(event: Event) -> Dict[str, Any]:
    attendees_out: List[Dict[str, Any]] = []

    rows = getattr(event, "event_attendees", None)
    if rows is None:
         rows = event.eventattendee_set

    for row in rows.all():

        u = row.user
        attendees_out.append({
            "user_id": u.id,
            "full_name": _full_name(u),
            "avatar": _user_profile_picture(u),  
            "attendance_type": getattr(row, "attendance_type", "required"),
            "status": row.status,
            "permissions": getattr(row, "permissions", {}) or {},  
        })

    return {
        "id": event.id,
        "title": event.title,
        "description": event.description or "",
        "start_datetime": event.start_datetime,
        "end_datetime": event.end_datetime,
        "is_all_day": event.is_all_day,
        "location": event.location,
        "url": event.url,
        "color": getattr(event, "color", None),
        "repeat_rule": getattr(event, "repeat_rule", None),
        "timezone": getattr(event, "timezone", "UTC"),
        "created_by_id": event.created_by_id,

        "can_modify_event": getattr(event, "can_modify_event", False),
        "can_invite_others": getattr(event, "can_invite_others", False),
        "can_see_guest_list": getattr(event, "can_see_guest_list", False),

        "attendees": attendees_out,
    }

async def _get_event_or_404(event_id: int) -> Event:
    ev = await sync_to_async(
        Event.objects.filter(id=event_id)
        .select_related("created_by")
        .prefetch_related(_prefetch_attendees())
        .first
    )()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev


def _normalize_attendees(payload_attendees: Any) -> List[Tuple[int, str]]:
    """
    Supports BOTH formats:
    1) New format: attendees: [{id: 2, attendance_type:"optional"}]
    2) Old format: attendees: [2, 3, 4]
    Returns list of (user_id, attendance_type)
    """
def _normalize_attendees(payload_attendees: Any) -> List[Tuple[int, str, Dict[str, Any]]]:
    out: List[Tuple[int, str, Dict[str, Any]]] = []
    if not payload_attendees:
        return out

    for a in payload_attendees:
        # allow [42, 43] format too
        if isinstance(a, int):
            out.append((a, "required", {}))
            continue

        # accept Pydantic object or dict
        uid = (
            getattr(a, "user_id", None)
            or getattr(a, "user", None)
            or (a.get("user") if isinstance(a, dict) else None)
            or (a.get("user_id") if isinstance(a, dict) else None)
            or getattr(a, "id", None)  # backward compatibility
            or (a.get("id") if isinstance(a, dict) else None)
        )

        at = (
            getattr(a, "attendance_type", None)
            or (a.get("attendance_type") if isinstance(a, dict) else None)
            or "required"
        )

        perms = (
            getattr(a, "permissions", None)
            or (a.get("permissions") if isinstance(a, dict) else None)
            or {}
        )

        out.append((int(uid), str(at), perms))

    return out



# -----------------------------
# Endpoints
# -----------------------------

@router.get("/events", response_model=List[EventRead])
async def list_events(
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
):
    """
    Generic list (grid fetch). If start/end provided, filter by overlap.
    Returns events where user is creator OR attendee.
    """

    def _sync():
       qs = (
    Event.objects.all()
    .select_related("created_by")
    )
       
       if start and end:
            if end <= start:
                raise HTTPException(status_code=400, detail="end must be greater than start")
            qs = qs.filter(start_datetime__lt=end, end_datetime__gt=start)
            attendee_event_ids = EventAttendee.objects.filter(user=current_user).values_list("event_id", flat=True)
            qs = qs.filter(created_by=current_user) | qs.filter(id__in=attendee_event_ids)
            qs = (
            qs.distinct()
            .select_related("created_by")
            .prefetch_related(_prefetch_attendees())
            .order_by("start_datetime")
        )
            return [_serialize_event(e) for e in qs]

    return await sync_to_async(_sync)()


@router.get("/events/{event_id:int}", response_model=EventRead)
async def get_event(event_id: int, current_user: User = Depends(get_current_user)):
    event = await _get_event_or_404(event_id)

    is_creator = event.created_by_id == current_user.id
    is_attendee = await sync_to_async(
        EventAttendee.objects.filter(event=event, user=current_user).exists
    )()

    if not (is_creator or is_attendee):
        raise HTTPException(status_code=403, detail="Not allowed to view this event")

    return await sync_to_async(_serialize_event)(event)


@router.post("/events", response_model=EventRead, status_code=201)
async def create_event(
    payload: EventCreate,
    current_user: User = Depends(get_current_user),
    create_meeting_link: bool = Query(False),
):
  
    overlapping_event = await sync_to_async(
    Event.objects.filter(
        created_by=current_user,
        start_datetime__lt=payload.end_datetime,
        end_datetime__gt=payload.start_datetime
    ).exists
)()
    
    event = await sync_to_async(Event.objects.create)(
        title=payload.title,
        description=payload.description,
        start_datetime=payload.start_datetime,
        end_datetime=payload.end_datetime,
        is_all_day=payload.is_all_day,
        location=payload.location,
        url=payload.url,
        color=payload.color or "blue",
        repeat_rule=payload.repeat_rule,
        timezone=payload.timezone or "UTC",
        created_by=current_user,
    )

    """
    Create event with:
    - guest permissions toggles
    - attendees with required/optional
    - optional meeting link creation
    """

    @transaction.atomic
    def _sync():
        event = Event.objects.create(
            title=payload.title,
            description=payload.description or "",
            start_datetime=payload.start_datetime,
            end_datetime=payload.end_datetime,
            is_all_day=payload.is_all_day,
            location=payload.location or "",
            url=payload.url,
            color=getattr(payload, "color", None) or "blue",
            repeat_rule=getattr(payload, "repeat_rule", None),
            timezone=getattr(payload, "timezone", None) or "UTC",
            created_by=current_user,

            # ✅ Task #2 persist
            can_modify_event=getattr(payload, "can_modify_event", False),
            can_invite_others=getattr(payload, "can_invite_others", False),
            can_see_guest_list=getattr(payload, "can_see_guest_list", False),
        )

        # Optional: create meeting link + chat room
        if create_meeting_link:
            chat_room = ChatRoom.objects.create(name=f"Chat: {payload.title}", is_group=True)
            chat_room.participants.add(current_user)

            # add attendees to chat room (if exist)
        for uid, _atype, perms in _normalize_attendees(getattr(payload, "attendees", None)):
            if uid == current_user.id:
                continue
            u = User.objects.filter(id=uid).first()
            if u:
                chat_room.participants.add(u)


            meeting_code = secrets.token_urlsafe(8)
            meeting, created = Meeting.objects.update_or_create(
                chat_room=chat_room,   
                defaults={
                     "host": current_user,
                     "title": payload.title,
                     "meeting_code": meeting_code,
                     "call_type": "video",
                     },
                     )

            event.meeting = meeting
            event.url = f"https://meet.jit.si/Stackly-Meeting-{meeting_code}"
            event.save()

      
        EventAttendee.objects.update_or_create(
            event=event,
            user=current_user,
            defaults={
                "status": "accepted",
                "attendance_type": "required",
                "permissions": {}, 
                },
                )
        # Add other attendees with type
        for uid, atype, perms in _normalize_attendees(getattr(payload, "attendees", None)):
            if uid == current_user.id:
                continue
            u = User.objects.filter(id=uid).first()
            if not u:
                continue
            EventAttendee.objects.update_or_create(
                event=event,
                user=u,
                defaults={
                      "status": "pending",
                      "attendance_type": atype,
                      "permissions": perms or {},
                        }
                        )

@router.get("/events/day", response_model=List[EventRead])
async def list_events_for_day(
    date_str: Optional[str] = Query(None, description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user)):
    
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        target_date = datetime.utcnow().date()
    
    @sync_to_async
    def get_day_events():
        final_qs = Event.objects.filter(
            Q(created_by=current_user) | Q(eventattendee__user=current_user),
            start_datetime__date=target_date
        ).select_related("created_by").distinct().order_by("start_datetime")
        
        return list(final_qs)
 
    return await get_day_events()
 
@router.get("/events/week", response_model=List[EventRead])
async def list_events_for_week(start_date: Optional[str] = Query(None, description="YYYY-MM-DD"), current_user: User = Depends(get_current_user)):
    """
    Provide start_date (YYYY-MM-DD) to choose week-start. Defaults to current week.
    """
    if start_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d").date()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        sd = datetime.utcnow().date()

    week_start = _start_of_week(sd)
    week_end = _end_of_week(sd)

    start_dt = datetime.combine(week_start, datetime.min.time())
    end_dt = datetime.combine(week_end, datetime.max.time())

    qs = Event.objects.filter(start_datetime__lte=end_dt, end_datetime__gte=start_dt).distinct()
    created_qs = qs.filter(created_by=current_user)
    attendee_event_ids = EventAttendee.objects.filter(user=current_user).values_list("event_id", flat=True)
    attendee_qs = qs.filter(id__in=attendee_event_ids)
    final_qs = (created_qs | attendee_qs).select_related("created_by").order_by("start_datetime")

    events = await sync_to_async(list)(final_qs)
    return events

@router.get("/events/month", response_model=List[EventRead])
async def list_events_for_month(year: Optional[int] = Query(None), month: Optional[int] = Query(None), current_user: User = Depends(get_current_user)):
    """
    List events for a given year/month. Defaults to current month.
    """
    today = datetime.utcnow().date()
    if not year:
        year = today.year
    if not month:
        month = today.month

    try:
        month_start = date(year, month, 1)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid year/month")

    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)

    start_dt = datetime.combine(month_start, datetime.min.time())
    end_dt = datetime.combine(next_month - timedelta(days=1), datetime.max.time())

    qs = Event.objects.filter(start_datetime__lte=end_dt, end_datetime__gte=start_dt).distinct()
    created_qs = qs.filter(created_by=current_user)
    attendee_event_ids = EventAttendee.objects.filter(user=current_user).values_list("event_id", flat=True)
    attendee_qs = qs.filter(id__in=attendee_event_ids)
    final_qs = (created_qs | attendee_qs).select_related("created_by").order_by("start_datetime")

    events = await sync_to_async(list)(final_qs)
    return events

@router.post("/events/meeting", response_model=EventRead, status_code=201)
async def create_meeting(
    payload: EventCreate,
    current_user: User = Depends(get_current_user),
):
    def _sync():
        event = Event.objects.create(
            title=payload.title,
            description=payload.description,
            start_datetime=payload.start_datetime,
            end_datetime=payload.end_datetime,
            created_by=current_user,
        )

        reminders = getattr(payload, "reminders", None)
        if reminders:
            for mins in reminders:
                EventReminder.objects.get_or_create(
                    event=event,
                    minutes_before=int(mins),
                )

        event = (
            Event.objects.filter(id=event.id)
            .select_related("created_by")
            .prefetch_related(_prefetch_attendees())
            .first()
        )

        return event

    event = await sync_to_async(_sync)()

    try:
        process_event_invites.delay(event.id, current_user.id)
    except Exception:
        pass  

    return _serialize_event(event)


@router.patch("/events/{event_id:int}", response_model=EventRead)
async def update_event(
    event_id: int,
    payload: EventUpdate,
    current_user: User = Depends(get_current_user),
):
    """
    Update event fields + guest permissions + attendees required/optional.
    attendees:
      - None => no change
      - []   => clear all attendees (except creator will be re-added accepted)
      - list => replace with new list
    """
    event = await _get_event_or_404(event_id)
@router.patch("/events/{event_id}", response_model=EventRead)
async def update_event(
    event_id: int,
    payload: EventUpdate,
    current_user: User = Depends(get_current_user)
):
    event = await sync_to_async(Event.objects.filter(id=event_id).first)()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can edit the event")

    @transaction.atomic
    def _sync():
        # scalar fields
        for f in (
            "title", "description", "start_datetime", "end_datetime",
            "is_all_day", "location", "url", "color", "repeat_rule", "timezone",
            "can_modify_event", "can_invite_others", "can_see_guest_list",
        ):
            if hasattr(payload, f):
                val = getattr(payload, f)
                if val is not None and hasattr(event, f):
                    setattr(event, f, val)

        if event.end_datetime <= event.start_datetime:
            raise HTTPException(status_code=400, detail="end_datetime must be greater than start_datetime")

        event.save()

        # attendees replace
        if payload.attendees is not None:
            EventAttendee.objects.filter(event=event).exclude(user=current_user).delete()

            # keep creator accepted required
            EventAttendee.objects.update_or_create(
                event=event,
                user=current_user,
                defaults={"status": "accepted", "attendance_type": "required"},
            )

            for uid, atype, _ in _normalize_attendees(payload.attendees):
                if uid == current_user.id:
                    continue
                u = User.objects.filter(id=uid).first()
                if not u:
                    continue
                EventAttendee.objects.update_or_create(
                    event=event,
                    user=u,
                    defaults={"status": "pending", "attendance_type": atype},
                )

        # reload with prefetch
        fresh = (
            Event.objects.filter(id=event.id)
            .select_related("created_by")
            .prefetch_related(_prefetch_attendees())
            .first()
        )
        return _serialize_event(fresh)

    return await sync_to_async(_sync)()


@router.delete("/events/{event_id:int}", status_code=204)
async def delete_event(event_id: int, current_user: User = Depends(get_current_user)):
    event = await _get_event_or_404(event_id)

    if event.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can delete the event")

    await sync_to_async(event.delete)()
    return {}

@router.post("/events/{event_id}/attendees", status_code=201)
async def add_attendees(event_id: int, user_ids: List[int], current_user: User = Depends(get_current_user)):
    """
    Add attendees by user id array (JSON body). Only creator can add attendees.
    """
    event = await _get_event_or_404(event_id)
    if event.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can add attendees")

@router.post("/events/{event_id:int}/attendees", response_model=EventRead, status_code=201)
async def add_or_update_attendee(
    event_id: int,
    attendee: AttendeeInput = Body(...),
    current_user: User = Depends(get_current_user),
): 
    """
    Add/update single attendee required/optional.
    Body should be: {"id": 2, "attendance_type": "optional"}
    """
    event = await _get_event_or_404(event_id)

    if event.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can add attendees")

    # try reading fields from pydantic or dict
    uid = attendee.user_id
    atype = attendee.attendance_type

    @transaction.atomic
    def _sync():
        u = User.objects.filter(id=int(uid)).first()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")

        EventAttendee.objects.update_or_create(
            event=event,
            user=u,
            defaults={"status": "pending", "attendance_type": str(atype)},
        )

        fresh = (
            Event.objects.filter(id=event.id)
            .select_related("created_by")
            .prefetch_related(_prefetch_attendees())
            .first()
        )
        return _serialize_event(fresh)

    return await sync_to_async(_sync)()


# --- OPTIONAL: Day/Week/Month endpoints (kept from your file, but N+1 safe) ---

@router.get("/events/by-day", response_model=List[EventRead])
async def list_events_for_day(
    date_str: Optional[str] = Query(None, description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
):
    if date_str:
        try:
            d = datetime.strptime(date_str, "%Y-%m-%d").date()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        d = datetime.utcnow().date()

    start = datetime.combine(d, datetime.min.time())
    end = datetime.combine(d, datetime.max.time())

    def _sync():
        qs = Event.objects.filter(start_datetime__lte=end, end_datetime__gte=start).distinct()

        attendee_event_ids = EventAttendee.objects.filter(user=current_user).values_list("event_id", flat=True)
        qs = qs.filter(created_by=current_user) | qs.filter(id__in=attendee_event_ids)

        qs = (
            qs.distinct()
            .select_related("created_by")
            .prefetch_related(_prefetch_attendees())
            .order_by("start_datetime")
        )
        return [_serialize_event(e) for e in qs]

    return await sync_to_async(_sync)()


@router.get("/events/week", response_model=List[EventRead])
async def list_events_for_week(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
):
    if start_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d").date()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        sd = datetime.utcnow().date()

    week_start = _start_of_week(sd)
    week_end = _end_of_week(sd)

    start_dt = datetime.combine(week_start, datetime.min.time())
    end_dt = datetime.combine(week_end, datetime.max.time())

    def _sync():
        qs = Event.objects.filter(start_datetime__lte=end_dt, end_datetime__gte=start_dt).distinct()

        attendee_event_ids = EventAttendee.objects.filter(user=current_user).values_list("event_id", flat=True)
        qs = qs.filter(created_by=current_user) | qs.filter(id__in=attendee_event_ids)

        qs = (
            qs.distinct()
            .select_related("created_by")
            .prefetch_related(_prefetch_attendees())
            .order_by("start_datetime")
        )
        return [_serialize_event(e) for e in qs]

    return await sync_to_async(_sync)()


@router.get("/events/month", response_model=List[EventRead])
async def list_events_for_month(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
):
    today = datetime.utcnow().date()
    year = year or today.year
    month = month or today.month

    try:
        month_start = date(year, month, 1)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid year/month")

    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)

    start_dt = datetime.combine(month_start, datetime.min.time())
    end_dt = datetime.combine(next_month - timedelta(days=1), datetime.max.time())

    def _sync():
        qs = Event.objects.filter(start_datetime__lte=end_dt, end_datetime__gte=start_dt).distinct()

        attendee_event_ids = EventAttendee.objects.filter(user=current_user).values_list("event_id", flat=True)
        qs = qs.filter(created_by=current_user) | qs.filter(id__in=attendee_event_ids)

        qs = (
            qs.distinct()
            .select_related("created_by")
            .prefetch_related(_prefetch_attendees())
            .order_by("start_datetime")
        )
        return [_serialize_event(e) for e in qs]

    return await sync_to_async(_sync)()

    return {"added": added}


@router.post("/events/{event_id}/respond")
async def respond_event(event_id: int, status: str = Query(..., description="accepted|declined|maybe"), current_user: User = Depends(get_current_user)):
    """
    Attendee responds to an invitation.
    """
    if status not in ("accepted", "declined", "maybe"):
        raise HTTPException(status_code=400, detail="Invalid status")

    event = await _get_event_or_404(event_id)
    attendee = await sync_to_async(EventAttendee.objects.filter(event=event, user=current_user).first)()
    if not attendee:
        await sync_to_async(EventAttendee.objects.create)(event=event, user=current_user, status=status)
    else:
        attendee.status = status
        await sync_to_async(attendee.save)()

    return {"status": "ok", "new_state": status}

@router.post("/calendar/events", response_model=EventRead, status_code=201)
async def create_event_calendar(
    payload: EventCreate,                      
    current_user: User = Depends(get_current_user),
    create_meeting_link: bool = Query(False),  
):
    @transaction.atomic
    def _sync():
        event = Event.objects.create(
            created_by=current_user,
            title=payload.title,
            description=payload.description or "",
            start_datetime=payload.start_datetime,
            end_datetime=payload.end_datetime,
            is_all_day=payload.is_all_day,
            location=payload.location or "",
            url=payload.url,
            color=getattr(payload, "color", None) or "blue",
            repeat_rule=getattr(payload, "repeat_rule", None),
            timezone=getattr(payload, "timezone", None) or "UTC",
            can_modify_event=getattr(payload, "can_modify_event", False),
            can_invite_others=getattr(payload, "can_invite_others", False),
            can_see_guest_list=getattr(payload, "can_see_guest_list", False),
        )

        if create_meeting_link:
            chat_room = ChatRoom.objects.create(
                name=f"Chat: {payload.title}",
                is_group=True
            )
            chat_room.participants.add(current_user)

            meeting_code = secrets.token_urlsafe(8)
            meeting = Meeting.objects.create(
                host=current_user,
                title=payload.title,
                meeting_code=meeting_code,
                call_type="video",
                chat_room=chat_room
            )

            event.meeting = meeting
            event.url = f"https://meet.jit.si/Stackly-Meeting-{meeting_code}"
            event.save()

        EventAttendee.objects.update_or_create(
            event=event,
            user=current_user,
            defaults={"status": "accepted", "attendance_type": "required"},
        )

        if getattr(payload, "attendees", None):
            for a in payload.attendees:
                uid = a.user_id
                atype = a.attendance_type or "required"
                if uid == current_user.id:
                    continue
                u = User.objects.filter(id=uid).first()
                if not u:
                    continue
                EventAttendee.objects.update_or_create(
                    event=event,
                    user=u,
                    defaults={"status": "pending", "attendance_type": atype},
                )

        if getattr(payload, "reminders", None):
            for mins in payload.reminders:
                EventReminder.objects.get_or_create(
                    event=event,
                    minutes_before=int(mins),
                )

        event = (
            Event.objects.filter(id=event.id)
            .select_related("created_by")
            .prefetch_related(_prefetch_attendees())
            .first()
        )
        return _serialize_event(event)

    return await sync_to_async(_sync)()


