from datetime import date,datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from django.contrib.auth import get_user_model
from typing import Optional, Union
from django.utils import timezone
from django.core.files.base import ContentFile
from django_backend.models import Email, User, Attachment
from django.db.models import Q
from fastapi_app.schemas.email_schemas import EmailCreate, EmailReply, EmailUpdate, DraftCreate, BulkReadRequest
from fastapi_app.dependencies.permissions import get_current_user 
from asgiref.sync import sync_to_async 
from fastapi_app.schemas.email_schemas import EmailRead
from fastapi_app.routers.notifications import create_notification
from fastapi import UploadFile, File
from pathlib import Path
import shutil
import os
from fastapi_app.tasks import send_email_task, send_scheduled_email


schedule_at: Optional[datetime] = Form(None),

from fastapi import  Query

from ..schemas.email_schemas import  SnoozeRequest


from fastapi import UploadFile

from fastapi_app.utils.file_convert import docx_to_pdf
from fastapi_app.utils.email_utils import smtp_send


router = APIRouter()
User = get_user_model()

def ensure_stackly_email(email: str):
    if "@" not in email:
        raise HTTPException(
            status_code=400,
            detail="Invalid email format"
        )

    local_part, domain = email.rsplit("@", 1)

    if domain.lower() != "thestackly.com":
        raise HTTPException(
            status_code=400,
            detail="Only thestackly.com email addresses are allowed"
        )
        
def get_attachments(email_obj):
    return [
        {"filename": a.file.name, "url": a.file.url} 
        for a in email_obj.attachments.all()
    ]        

@router.post("/send")
def send_email(
    receiver_email: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    schedule_at: Optional[str] = Form(default=None),
    file: Union[UploadFile, str, None] = File(None),
    current_user: User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication failed or user context lost.")
    
    if isinstance(file, str):
        file = None

    if schedule_at == "":
        schedule_at = None

    schedule_dt = None
    if schedule_at is not None:
        try:
            schedule_dt = datetime.fromisoformat(schedule_at)
        except ValueError:
            raise HTTPException(
                status_code=422,
                detail="schedule_at must be ISO format: YYYY-MM-DDTHH:MM:SS"
            )

    ensure_stackly_email(current_user.email)
    ensure_stackly_email(receiver_email)

    try:
        receiver = User.objects.get(email__iexact=receiver_email)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Receiver does not exist")

    email_obj = Email.objects.create(
        sender=current_user,
        receiver=receiver,
        subject=subject,
        body=body,
        status="SCHEDULED" if schedule_dt else "SENT",
        scheduled_at=schedule_dt,
        is_deleted_by_receiver=False,
        is_archived=False
    )

    if not schedule_dt:
        try:
            smtp_send(email_obj)
            email_obj.status = "SENT"
            email_obj.save(update_fields=['status'])

            create_notification(
                recipient=receiver,
                message=f"New email from {current_user.first_name} {current_user.last_name}: {subject}",
                type_choice="email"
            )
        except Exception as e:
            email_obj.status = "FAILED"
            email_obj.save(update_fields=['status'])
            print(f"SMTP Error: {e}") 

    return {
        "message": "Email scheduled successfully" if schedule_dt else "Email sent successfully",
        "id": email_obj.id
    }

def process_scheduled_emails():
    now = timezone.now()

    scheduled_emails = Email.objects.filter(
        status="SCHEDULED",
        scheduled_at__lte=now
    )

    for email in scheduled_emails:
        try:
            email.status = "OUTBOX"
            email.save()

            smtp_send(email)
            email.status = "SENT"
        except Exception:
            email.status = "FAILED"

        email.save()

@router.post("/reply")
def reply_email(
    data: EmailReply,
    current_user: User = Depends(get_current_user)
):
    ensure_stackly_email(current_user.email)

    try:
        parent = Email.objects.get(id=data.email_id)
    except Email.DoesNotExist:
        raise HTTPException(status_code=404, detail="Email not found")

    
    reply = Email.objects.create(
        sender=current_user,
        receiver=parent.sender,
        subject=f"Re: {parent.subject}" if not parent.subject.startswith("Re:") else parent.subject,
        body=data.body,
        parent=parent,
        status='OUTBOX'
    )
    
    try:
        smtp_send(reply)      
        reply.status = "SENT"  
        reply.save()           
    except Exception:
        reply.status = "FAILED"
        reply.save()
        raise HTTPException(status_code=500, detail="Failed to send email")
    
    return {"message": "Reply sent successfully", "id": reply.id}


@router.get("/inbox")
def inbox(
    q: Optional[str] = None,
    sender: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    
    current_user: User = Depends(get_current_user)
):
    
    msgs = Email.objects.filter(
        receiver=current_user
    ).exclude(
        status='DRAFT'
    ).exclude(
        status='SCHEDULED'
    )
    msgs = msgs.exclude(is_deleted_by_receiver=True)
    msgs = msgs.exclude(is_archived=True)

    if q:
        msgs = msgs.filter(
            Q(subject__icontains=q) | Q(body__icontains=q)
        )

    if sender:
        msgs = msgs.filter(sender__email__icontains=sender)

    if date_from:
        msgs = msgs.filter(created_at__date__gte=date_from) 
    if date_to:
        msgs = msgs.filter(created_at__date__lte=date_to)   

    msgs = msgs.order_by("-created_at")

    return [
        {
            "id": m.id,
            "from": f"{m.sender.first_name} {m.sender.last_name}".strip(),
            "subject": m.subject,
            "body": m.body,
            "date": m.created_at,
            "is_important": m.is_important,
            "is_favorite": m.is_favorite,
            "is_archived": m.is_archived,
            "attachments": get_attachments(m)
        }
        for m in msgs
    ]

@router.get("/outbox", response_model=List[EmailRead])
def get_outbox(current_user: User = Depends(get_current_user)):
    return Email.objects.filter(
        sender=current_user,
        status__in=['OUTBOX', 'FAILED']
    ).order_by("-created_at")


@router.get("/sent")
def sent(current_user: User = Depends(get_current_user)):

    msgs = Email.objects.select_related("sender", "receiver").filter(
        sender=current_user,
        is_deleted_by_sender=False
    ).order_by("-created_at")

    return [
        {
            "id": m.id,
            "to": f"{m.receiver.first_name} {m.receiver.last_name}".strip() if m.receiver else "",
            "subject": m.subject,
            "body": m.body,
            "date": m.created_at,
        }
        for m in msgs
    ]


@router.get("/drafts", response_model=List[EmailRead])
def list_drafts(current_user: User = Depends(get_current_user)):
    """
    Get all emails with status='DRAFT' created by the current user.
    """
    emails = Email.objects.select_related("sender", "receiver").filter(
    sender=current_user,
    status='DRAFT',
    is_archived=False,
    is_deleted_by_sender=False  
     ).order_by("-created_at")
  
    return list(emails)

@router.get("/thread/{email_id}")
def email_thread(
    email_id: int,
    current_user: User = Depends(get_current_user)
):
    try:
        root = Email.objects.get(id=email_id)
    except Email.DoesNotExist:
        raise HTTPException(status_code=404, detail="Email not found")
    if current_user == root.receiver and not root.is_read:
        root.is_read = True
        root.save()
    thread = [root] + list(root.replies.all())

    return [
        {
            "id": m.id,
            "sender": f"{m.sender.first_name} {m.sender.last_name}".strip(),
            "receiver": f"{m.receiver.first_name} {m.receiver.last_name}".strip() if m.receiver else "",
            "subject": m.subject,
            "body": m.body,
            "date": m.created_at,
            "attachments": get_attachments(m)
        }
        for m in thread
    ]
    
   
@router.delete("/{email_id}", status_code=204)
def delete_email(email_id: int, current_user: User = Depends(get_current_user)):
    try:
        email_obj = Email.objects.get(id=email_id)
    except Email.DoesNotExist:
        raise HTTPException(status_code=404, detail="Email not found")

    
    if current_user == email_obj.sender:
        email_obj.is_deleted_by_sender = True
    elif current_user == email_obj.receiver:
        email_obj.is_deleted_by_receiver = True
    else:
        raise HTTPException(status_code=403, detail="Not authorized to delete this email")

    email_obj.save()
    return None    

@router.patch("/{email_id}")
def update_email_flags(
    email_id: int, 
    data: EmailUpdate, 
    current_user: User = Depends(get_current_user)
):
    try:
        email_obj = Email.objects.get(id=email_id)
    except Email.DoesNotExist:
        raise HTTPException(status_code=404, detail="Email not found")

    if current_user != email_obj.receiver:
        raise HTTPException(status_code=403, detail="You can only flag emails in your inbox")

    update_data = data.model_dump(exclude_unset=True) 

    for key, value in update_data.items():
        setattr(email_obj, key, value)    
    
    email_obj.save()
    return {"message": "Email updated", "id": email_obj.id, "is_read": email_obj.is_read, "is_important": email_obj.is_important, "is_favorite": email_obj.is_favorite, "is_archived": email_obj.is_archived}


@router.post("/draft")
def save_draft(
    data: DraftCreate,
    current_user: User = Depends(get_current_user)
):
    ensure_stackly_email(current_user.email)
    
    receiver = None
    if data.receiver_email:
        ensure_stackly_email(data.receiver_email)
        try:
            receiver = User.objects.get(email=data.receiver_email)
        except User.DoesNotExist:
            raise HTTPException(status_code=404, detail="Receiver not found")

    draft = Email.objects.create(
        sender=current_user,
        receiver=receiver,
        subject=data.subject or "(No Subject)",
        body=data.body or "",
        status='DRAFT' 
    )

    return {"message": "Draft saved", "id": draft.id, "status": "DRAFT"}


@router.post("/{email_id}/publish")
def publish_draft(
    email_id: int,
    current_user: User = Depends(get_current_user)
):
    try:
        email_obj = Email.objects.get(id=email_id)
    except Email.DoesNotExist:
        raise HTTPException(status_code=404, detail="Email not found")

    
    if email_obj.sender != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    if email_obj.status != 'DRAFT':
        raise HTTPException(status_code=400, detail="This email is already sent")
    if not email_obj.receiver:
         raise HTTPException(status_code=400, detail="Cannot send email without a receiver")

    
    email_obj.status = 'SENT'
    email_obj.created_at = timezone.now() 
    email_obj.save()

    return {"message": "Email sent successfully", "id": email_obj.id, "status": "SENT"}

@router.patch("/draft/{email_id}")
def edit_draft(
    email_id: int,
    data: DraftCreate,  
    current_user: User = Depends(get_current_user)
):
    
    try:
        email_obj = Email.objects.get(id=email_id)
    except Email.DoesNotExist:
        raise HTTPException(status_code=404, detail="Draft not found")

    if email_obj.sender != current_user:
        raise HTTPException(status_code=403, detail="Not authorized to edit this draft")

    if email_obj.status != 'DRAFT':
        raise HTTPException(status_code=400, detail="Cannot edit an email that has already been sent")

    if data.receiver_email is not None:
        if data.receiver_email == "":
            email_obj.receiver = None
        else:
            ensure_stackly_email(data.receiver_email)
            try:
                email_obj.receiver = User.objects.get(email=data.receiver_email)
            except User.DoesNotExist:
                 raise HTTPException(status_code=404, detail="Receiver not found")
    
    if data.subject is not None:
        email_obj.subject = data.subject
    
    if data.body is not None:
        email_obj.body = data.body

    email_obj.save()
    
    return {
        "message": "Draft updated", 
        "id": email_obj.id, 
        "subject": email_obj.subject,
        "receiver": f"{email_obj.receiver.first_name} {email_obj.receiver.last_name}".strip() if email_obj.receiver else None
    }

@router.post("/{email_id}/forward")
def forward_email(
    email_id: int,
    new_receiver_email: str = Form(...), 
    current_user: User = Depends(get_current_user)
):
    try:
        original = Email.objects.get(id=email_id)
    except Email.DoesNotExist:
        raise HTTPException(status_code=404, detail="Original email not found")

    ensure_stackly_email(new_receiver_email)
    try:
        new_receiver = User.objects.get(email=new_receiver_email)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Receiver does not exist")

    new_subject = f"Fwd: {original.subject}"
    new_body = f"\n\n---------- Forwarded message ----------\nFrom: {original.sender.first_name} {original.sender.last_name}\nDate: {original.created_at}\n\n{original.body}"

    forwarded_email = Email.objects.create(
        sender=current_user,
        receiver=new_receiver,
        subject=new_subject,
        body=new_body,
        status='SENT'
    )
    
    for attachment in original.attachments.all():
        Attachment.objects.create(
            email=forwarded_email,
            file=attachment.file 
        )

    return {"message": "Email forwarded", "id": forwarded_email.id}


@router.get("/archived")
def archived(current_user: User = Depends(get_current_user)):
    msgs = Email.objects.filter(
        receiver=current_user, 
        is_deleted_by_receiver=False,
        is_archived=True 
    ).order_by("-created_at")

    return [
        {
            "id": m.id,
            "from": f"{m.sender.first_name} {m.sender.last_name}".strip(),
            "subject": m.subject,
            "body": m.body,
            "date": m.created_at,
            "is_important": m.is_important,
            "is_favorite": m.is_favorite,
            "is_archived": m.is_archived, 
            "attachments": get_attachments(m)
        }
        for m in msgs
    ]
    

@router.get("/starred")
def starred(current_user: User = Depends(get_current_user)):
    
    msgs = Email.objects.filter(
        Q(receiver=current_user, is_deleted_by_receiver=False, is_favorite=True) |
        Q(sender=current_user, is_deleted_by_sender=False, is_favorite=True)
    ).order_by("-created_at")

    return [
        {
            "id": m.id,
            "from": f"{m.sender.first_name} {m.sender.last_name}".strip(),
            "subject": m.subject,
            "body": m.body,
            "date": m.created_at,
            "is_important": m.is_important,
            "is_favorite": m.is_favorite,
            "is_archived": m.is_archived,
            "attachments": get_attachments(m)
        }
        for m in msgs
    ]      
    

@router.get("/important")
def important(current_user: User = Depends(get_current_user)):
    msgs = Email.objects.filter(
        Q(receiver=current_user, is_deleted_by_receiver=False, is_important=True) |
        Q(sender=current_user, is_deleted_by_sender=False, is_important=True)
    ).order_by("-created_at")

    return [
        {
            "id": m.id,
            "from": f"{m.sender.first_name} {m.sender.last_name}".strip(),
            "subject": m.subject,
            "body": m.body,
            "date": m.created_at,
            "is_important": m.is_important,
            "is_favorite": m.is_favorite,
            "is_archived": m.is_archived,
            "attachments": get_attachments(m)
        }
        for m in msgs
    ]    


@router.get("/trash")
def trash(current_user: User = Depends(get_current_user)):
    msgs = Email.objects.filter(
        Q(receiver=current_user, is_deleted_by_receiver=True) | 
        Q(sender=current_user, is_deleted_by_sender=True)
    ).order_by("-created_at")

    return [
        {
            "id": m.id,
            "from": f"{m.sender.first_name} {m.sender.last_name}".strip(),
            "subject": m.subject,
            "body": m.body,
            "date": m.created_at,
            "is_important": m.is_important,
            "is_favorite": m.is_favorite,
            "is_archived": m.is_archived,
            "attachments": get_attachments(m)
        }
        for m in msgs
    ]
    

@router.post("/{email_id}/restore")
def restore_email(email_id: int, current_user: User = Depends(get_current_user)):
    try:
        email_obj = Email.objects.get(id=email_id)
    except Email.DoesNotExist:
        raise HTTPException(status_code=404, detail="Email not found")

    restored = False
    
    if current_user == email_obj.sender:
        email_obj.is_deleted_by_sender = False
        restored = True
        
    if current_user == email_obj.receiver:
        email_obj.is_deleted_by_receiver = False
        restored = True
        
    if not restored:
        raise HTTPException(status_code=403, detail="Not authorized to restore this email")

    email_obj.save()
    return {"message": "Email restored successfully", "id": email_obj.id}    

@router.patch("/{email_id}/spam", response_model=EmailRead)
async def mark_email_as_spam(
    email_id: int,
    current_user: User = Depends(get_current_user),
):
    email = await sync_to_async(
        Email.objects.filter(id=email_id, receiver=current_user).first
    )()

    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found",
        )

    email.is_spam = True
    await sync_to_async(email.save)()

    return email

@router.get("/spam", response_model=List[EmailRead])
async def list_spam_emails(current_user: User = Depends(get_current_user)):
    emails = await sync_to_async(list)(
    Email.objects.select_related("sender", "receiver").filter(
        receiver=current_user,
        is_spam=True,
        is_deleted_by_receiver=False,
    ).order_by("-created_at")
    )
    return emails


@router.get("/unread", response_model=List[EmailRead])
def list_unread(current_user: User = Depends(get_current_user)):
    """
    Get all emails that haven't been opened yet.
    """
    emails = Email.objects.select_related("sender", "receiver").filter(
        receiver=current_user,
        is_read=False,             
        is_deleted_by_receiver=False,
        is_spam=False,
        status='SENT'
    ).order_by("-created_at")
    
    return list(emails)

@router.post("/mark-read")
def mark_all_read(
    data: BulkReadRequest, 
    current_user: User = Depends(get_current_user)
):
    """
    Mark multiple emails as read in one go.
    Optimized for performance.
    """
    qs = Email.objects.filter(
        id__in=data.ids, 
        receiver=current_user
    )
    
    updated_count = qs.update(is_read=True)

    return {
        "message": "Emails updated", 
        "count": updated_count
    }


@router.patch("/{email_id}/snooze", response_model=EmailRead)
async def snooze_mail(
    email_id: int,
    payload: SnoozeRequest,
    current_user=Depends(get_current_user),
):
    email = await sync_to_async(
        Email.objects.filter(
            id=email_id,
            receiver=current_user
        ).first
    )()

    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    # Unsnooze
    if payload.snoozed_until is None:
        email.snoozed_until = None
        email.snoozed_by = None
        await sync_to_async(email.save)()
        return email

    # Validate future time
    if payload.snoozed_until <= timezone.now():
        raise HTTPException(
            status_code=400,
            detail="snoozed_until must be future time"
        )

    # Snooze
    email.snoozed_until = payload.snoozed_until
    email.snoozed_by = current_user
    await sync_to_async(email.save)()

    return email



@router.get("/snoozed", response_model=list[EmailRead])
async def snoozed_list(current_user=Depends(get_current_user)):
    now = timezone.now()

    qs = Email.objects.filter(
        receiver=current_user,
        snoozed_until__gt=now
    ).order_by("snoozed_until")

    emails = await sync_to_async(list)(qs[:200])
    return emails                                          