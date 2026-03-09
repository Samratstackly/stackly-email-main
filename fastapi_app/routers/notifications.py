from fastapi import APIRouter, Depends, HTTPException
from django.contrib.auth import get_user_model
from django_backend.models import Notification
from fastapi_app.schemas.notification_schemas import NotificationRead, NotificationUpdate
from fastapi_app.dependencies.permissions import get_current_user
from asgiref.sync import sync_to_async

router = APIRouter()
User = get_user_model()

@router.get("/", response_model=list[NotificationRead])
async def get_my_notifications(current_user: User = Depends(get_current_user)):
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    @sync_to_async
    def fetch_notifications():
        return list(Notification.objects.filter(recipient_id=current_user.id).order_by("-created_at"))
    
    return await fetch_notifications()
    

@router.patch("/{notification_id}", response_model=NotificationRead)
async def mark_as_read(
    notification_id: int, 
    data: NotificationUpdate,
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def update_notification():
        try:
            notif = Notification.objects.get(id=notification_id, recipient=current_user)
            notif.is_read = data.is_read
            notif.save()
            return notif
        except Notification.DoesNotExist:
            return None
        
    updated_notif = await update_notification()
    
    if not updated_notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return updated_notif    
        
def create_notification(recipient, message, type_choice="general"):
    Notification.objects.create(
        recipient=recipient,
        message=message,
        notification_type=type_choice
    )