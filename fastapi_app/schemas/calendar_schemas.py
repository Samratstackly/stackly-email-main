
from pydantic import BaseModel,field_validator
from datetime import datetime,date
from typing import List, Optional
from typing import Dict
import bleach
from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import List, Optional, Literal, Dict, Any

def sanitize_rich_text(value: Optional[str]) -> Optional[str]:
    if not value:         
        return value      
    allowed_tags = ['b', 'i', 'u', 'ul', 'li', 'p', 'br']      
    return bleach.clean(value, tags=allowed_tags, strip=True)

class AvailabilityRequest(BaseModel):
    date: date
    user_ids: List[int]

class TimeBlock(BaseModel):
    start: str
    end: str

AvailabilityResponse = Dict[int, List[TimeBlock]]
AttendanceType = Literal["required", "optional"]

class AttendeeRead(BaseModel):
    user_id: int
    full_name: str
    avatar: str | None = None
    attendance_type: AttendanceType
    status: str
    permissions: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True


class AttendeeInput(BaseModel):
    user_id: int = Field(..., alias="user", description="User ID")
    attendance_type: AttendanceType = Field("required", description="required | optional")
    permissions: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        populate_by_name = True

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = ""

    start_datetime: datetime
    end_datetime: datetime

    is_all_day: bool = False
    location: Optional[str] = ""
    url: Optional[str] = None
    attendees: List[int] = []           
    
    can_modify_event: bool = False
    can_invite_others: bool = False
    can_see_guest_list: bool = False
 
    attendees: List[AttendeeInput] = Field(default_factory=list)

    color: Optional[str] = "blue"
    repeat_rule: Optional[str] = None
    timezone: str = "UTC"
    reminders: List[int] = []       
    category_name: Optional[str] = None      
    
    @field_validator('description')
    @classmethod
    def clean_description(cls, v):
       return sanitize_rich_text(v)
 
    reminders: List[int] = Field(default_factory=list)

class EventUpdate(BaseModel):
    # Core event fields (optional for PATCH)
    title: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    description: Optional[str] = None
    location: Optional[str] = None
    url: Optional[str] = None
    attendees: Optional[List[int]] = None

    can_modify_event: Optional[bool] = None
    can_invite_others: Optional[bool] = None
    can_see_guest_list: Optional[bool] = None

    attendees: Optional[List[AttendeeInput]] = None

    color: Optional[str] = None
    repeat_rule: Optional[str] = None
    timezone: Optional[str] = None
    reminders: Optional[List[int]] = None
    category_name: Optional[str] = None

@field_validator('description')
@classmethod
def clean_description(cls, v):
    return sanitize_rich_text(v)
 
class EventRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = ""

    start_datetime: datetime
    end_datetime: datetime

    is_all_day: bool
    location: Optional[str] = None
    url: Optional[str] = None
    color: Optional[str] = None
    repeat_rule: Optional[str] = None
    timezone: str
    category_name: Optional[str] = None



    created_by_id: int
    attendees: List[AttendeeRead]

    class Config:
        from_attributes = True
        
        
class AttendeeRead(BaseModel):
    user_id: int
    status: str     
    can_modify_event: bool
    can_invite_others: bool
    can_see_guest_list: bool

    attendees: List[AttendeeRead] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ReminderRead(BaseModel):
    id: int
    minutes_before: int

    class Config:
        from_attributes = True


class HolidayCreate(BaseModel):
    name: str
    date: date
    description: Optional[str] = None


class HolidayRead(BaseModel):
    id: int
    name: str
    date: date
    description: Optional[str]

    class Config:
        from_attributes = True


class CalendarDayView(BaseModel):
    date: date
    events: List[EventRead]
    holidays: List[HolidayRead]


class CalendarWeekView(BaseModel):
    start_date: date
    end_date: date
    events: List[EventRead]
    holidays: List[HolidayRead]


class CalendarMonthView(BaseModel):
    year: int
    month: int
    events: List[EventRead]
    holidays: List[HolidayRead]

class CalendarCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    reminder_minutes: Optional[int] = 15