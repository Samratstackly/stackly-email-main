from pydantic import BaseModel
from typing import List
from datetime import datetime
from typing import Optional
from .user_schemas import UserNameOut

class EmailCreate(BaseModel):
    receiver_email: str
    subject: str
    body: str
    scheduled_at: Optional[datetime] = None


class EmailReply(BaseModel):
    email_id: int
    body: str

class EmailUpdate(BaseModel):
    is_important: bool | None = None
    is_favorite: bool | None = None
    is_archived: bool | None = None
    is_spam: bool | None = None   
    is_read: bool | None = None

class DraftCreate(BaseModel):
    receiver_email: str | None = None
    subject: str | None = None
    body: str | None = None


class EmailRead(BaseModel):
    id: int
    sender_id: int
    receiver_id: Optional[int] = None
    sender: UserNameOut
    receiver: Optional[UserNameOut] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    date: Optional[datetime] = None
    attachments: List[dict] = []

    is_important: bool = False
    is_favorite: bool = False
    is_archived: bool = False
    is_spam: bool = False
    is_read: bool = False

    snoozed_until: Optional[datetime] = None
    is_snoozed: bool = False

    class Config:
        from_attributes = True

class SnoozeRequest(BaseModel):
    snoozed_until: Optional[datetime] = None
        
class BulkReadRequest(BaseModel):
    ids: List[int]        

