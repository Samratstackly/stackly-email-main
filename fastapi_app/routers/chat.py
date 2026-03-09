from django.db.models import Prefetch, Count
from django.db.models import Q
from jose import JWTError, jwt
from fastapi import status
from fastapi_app.core.config import settings
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, File, UploadFile, Query, status
import json
import re
import secrets
from django.core.files.base import ContentFile
from django.utils import timezone
from typing import List, Optional
from datetime import datetime, timezone as dt_timezone
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from django_backend.models import ChatRoom, ChatMessage, Email, MessageReaction, Notification, Call
from fastapi_app.schemas.chat_schemas import ChatRoomCreate, ChatRoomRead, MessageRead, ChatMemberUpdate, MessageUpdate, ForwardRequest, TextMessageCreate
from fastapi_app.core.socket_manager import manager
from fastapi_app.dependencies.permissions import get_current_user

router = APIRouter()
User = get_user_model()

async def get_current_user_ws(token: str = Query(...)):
    """
    Validates the token passed in the WebSocket URL.
    """
    credentials_exception = status.WS_1008_POLICY_VIOLATION
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise WebSocketDisconnect(code=credentials_exception)
    except JWTError:
        raise WebSocketDisconnect(code=credentials_exception)
    
    try:
        user = await sync_to_async(User.objects.get)(email=email)
        return user
    except User.DoesNotExist:
        raise WebSocketDisconnect(code=credentials_exception)
    

@router.post("/rooms", response_model=ChatRoomRead)
def create_room(data: ChatRoomCreate, current_user = Depends(get_current_user)):
    
    if data.email_id:
        existing_email_room = ChatRoom.objects.filter(related_email_id=data.email_id).first()
        if existing_email_room:
            return format_room_response(existing_email_room)
        
    related_email_obj = None
    initial_participants = set(data.participant_emails) 

    if data.email_id:
        try:
            related_email_obj = Email.objects.select_related('sender', 'receiver').get(id=data.email_id)
            initial_participants.add(related_email_obj.sender.email)
            
            if related_email_obj.receiver:
                initial_participants.add(related_email_obj.receiver.email)
                
        except Email.DoesNotExist:
            raise HTTPException(status_code=404, detail="Linked email not found")
        
    initial_participants.add(current_user.email)    
    
    users_to_add = list(User.objects.filter(email__in=initial_participants))
    
    if not data.is_group:
        existing_rooms = ChatRoom.objects.filter(
            is_group=False
        ).annotate(
            num_participants=Count('participants')
        ).filter(num_participants=len(users_to_add))
        
        for user in users_to_add:
            existing_rooms = existing_rooms.filter(participants=user)
            
        existing_room = existing_rooms.first()
        
        if existing_room:
            return format_room_response(existing_room)
    
    room = ChatRoom.objects.create(
        name=data.name,
        is_group=data.is_group,
        related_email=related_email_obj
    )
        
    room.participants.add(*users_to_add)
            
    return format_room_response(room)

@router.get("/search", response_model=List[MessageRead])
def search_messages(
    q: str = Query(..., min_length=1, description="Search term"),
    current_user = Depends(get_current_user)
):
    user_room_ids = current_user.chat_rooms.values_list('id', flat=True)
    
    msgs = ChatMessage.objects.filter(
        room__id__in=user_room_ids,   
        is_deleted=False,             
        content__icontains=q         
    ).select_related(
        'sender', 'parent', 'parent__sender'
    ).prefetch_related(
        'reactions', 'reactions__user', 'read_by', 'starred_by'
    ).order_by("-timestamp")
        
    results = []
    for m in msgs:
        url = None
        if m.attachment:
            try:
                url = m.attachment.url
            except ValueError:
                url = None  

        reaction_map = {}
        for r in m.reactions.all():
            if r.emoji not in reaction_map:
                reaction_map[r.emoji] = {"count": 0, "emails": []}
            reaction_map[r.emoji]["count"] += 1
            reaction_map[r.emoji]["emails"].append(r.user.email)

        reactions_list = [
            {"emoji": k, "count": v["count"], "user_emails": v["emails"]}
            for k, v in reaction_map.items()
        ]

        results.append({
            "id": m.id,
            "sender_email": m.sender.email,
            "sender_first_name": m.sender.first_name,
            "sender_last_name": m.sender.last_name,
            "content": m.content,
            "attachment_url": url,
            "timestamp": m.timestamp,
            "read_count": len(m.read_by.all()),
            "is_starred": current_user in m.starred_by.all(),
            "parent_id": m.parent.id if m.parent else None,
            "parent_content": m.parent.content if m.parent else None,
            "parent_sender": m.parent.sender.email if m.parent else None,
            "reactions": reactions_list,
            "is_forwarded": m.is_forwarded
        })

    return results

@router.get("/rooms", response_model=List[ChatRoomRead])
def list_rooms(current_user = Depends(get_current_user)):
    valid_messages_prefetch = Prefetch(
        'messages',
        queryset=ChatMessage.objects.filter(is_deleted=False).order_by('-timestamp').select_related('sender', 'parent', 'parent__sender').prefetch_related('read_by', 'starred_by'),        to_attr='prefetched_messages')
    rooms = current_user.chat_rooms.all().prefetch_related(valid_messages_prefetch, 'participants')

    results = []
    for room in rooms:
        messages_list = room.prefetched_messages
        unread_count = sum(1 for m in messages_list if current_user not in m.read_by.all())

        last_msg_obj = messages_list[0] if messages_list else None
        
        last_message_data = None
        if last_msg_obj:
            last_message_data = {
                "id": last_msg_obj.id,
                "sender_email": last_msg_obj.sender.email,
                "sender_first_name": last_msg_obj.sender.first_name,
                "sender_last_name": last_msg_obj.sender.last_name,
                "content": last_msg_obj.content,
                "attachment_url": last_msg_obj.attachment.url if last_msg_obj.attachment else None,
                "timestamp": last_msg_obj.timestamp,
                "read_count": len(last_msg_obj.read_by.all()),
                "is_starred": current_user in last_msg_obj.starred_by.all(),
                "parent_id": last_msg_obj.parent.id if last_msg_obj.parent else None,
                "parent_content": last_msg_obj.parent.content if last_msg_obj.parent else None,
                "parent_sender": last_msg_obj.parent.sender.email if last_msg_obj.parent else None,
                "reactions": [],
                "is_forwarded": last_msg_obj.is_forwarded 
            }

        results.append({
            "id": room.id,
            "name": room.name,
            "is_group": room.is_group,
            "unread_count": unread_count,       
            "last_message": last_message_data,
            "participants": [u.email for u in room.participants.all()] 
        })
    
    results.sort(
        key=lambda x: x["last_message"]["timestamp"] if x["last_message"] else datetime.min.replace(tzinfo=dt_timezone.utc), 
        reverse=True
    )
    
    return results

class OfflineUser(BaseModel):
    id: int
    name: str
    email: str
    profile_image: Optional[str] = None
    last_seen: Optional[datetime] = None

@router.get("/online", response_model=List[OfflineUser]) 

async def get_online_users(

    limit: int = Query(20, description="Max number of online users", le=100),

    current_user: User = Depends(get_current_user)

):

    if not current_user:

        raise HTTPException(status_code=401, detail="Authentication failed")

    

    requester_id = current_user.id

    active_user_ids = list(manager.user_connection_counts.keys())

    if not active_user_ids:

        return []

    @sync_to_async

    def fetch_active_profiles_from_db():

        users = User.objects.select_related('profile').filter(

            id__in=active_user_ids

        ).exclude(id=requester_id)[:limit]

        

        result = []

        for u in users:

            full_name = f"{u.first_name} {u.last_name}".strip()

            if not full_name:

                full_name = u.email.split('@')[0]

                

            profile_img = None

            if hasattr(u, 'profile') and u.profile is not None:

                if hasattr(u.profile, 'avatar') and u.profile.avatar: 

                    profile_img = u.profile.avatar.url

                    

            result.append({
                "id": u.id,
                "name": full_name,
                "email": u.email,
                "profile_image": profile_img,
                "last_seen": None 

            })

        return result

    return await fetch_active_profiles_from_db()


@router.get("/rooms/{room_id}/messages", response_model=List[MessageRead])
def get_messages(
    room_id: int, 
    q: Optional[str] = Query(None, description="Search within this room"), 
    limit: int = Query(50, ge=1, le=100, description="Number of messages to return"), 
    offset: int = Query(0, ge=0, description="Number of messages to skip"),
    current_user = Depends(get_current_user)
):
    try:
        room = ChatRoom.objects.prefetch_related('participants').get(id=room_id)
        if current_user not in room.participants.all():
             raise HTTPException(status_code=403, detail="Not a participant")
    except ChatRoom.DoesNotExist:
        raise HTTPException(status_code=404, detail="Room not found")

    msgs = room.messages.filter(is_deleted=False).select_related('sender','parent', 'parent__sender').prefetch_related('reactions', 'reactions__user', 'read_by', 'starred_by')
    
    if q:
        msgs = msgs.filter(content__icontains=q)
        
    msgs = msgs.order_by("-timestamp")
    paginated_msgs = msgs[offset : offset + limit]
    
    results = []
    for m in paginated_msgs:
        url = None
        if m.attachment:
            try:
                url = m.attachment.url
            except ValueError:
                url = None  

        reaction_map = {}
        for r in m.reactions.all():
            if r.emoji not in reaction_map:
                reaction_map[r.emoji] = {"count": 0, "emails": []}
            reaction_map[r.emoji]["count"] += 1
            reaction_map[r.emoji]["emails"].append(r.user.email)

        reactions_list = [
            {"emoji": k, "count": v["count"], "user_emails": v["emails"]}
            for k, v in reaction_map.items()
        ]
        read_users = m.read_by.all()
        starred_users = m.starred_by.all() 
        
        results.append({
            "id": m.id,
            "sender_email": m.sender.email,
            "sender_first_name": m.sender.first_name,
            "sender_last_name": m.sender.last_name,
            "content": m.content,
            "attachment_url": url,
            "timestamp": m.timestamp,
            "read_count": len(read_users),
            "is_starred": current_user in starred_users,
            
            "parent_id": m.parent.id if m.parent else None,
            "parent_content": m.parent.content if m.parent else None,
            "parent_sender": m.parent.sender.email if m.parent else None,
            "reactions": reactions_list,
            "is_forwarded": m.is_forwarded    
        })
        
    results.reverse()    

    return results

@router.patch("/messages/{message_id}", response_model=MessageRead)
async def edit_message(
    message_id: int,
    data: MessageUpdate,
    current_user = Depends(get_current_user)
):
    @sync_to_async
    def process_edit():
        try:
            msg = ChatMessage.objects.select_related(
                'sender', 'parent', 'parent__sender'
            ).prefetch_related(
                'reactions', 'reactions__user', 'read_by', 'starred_by'
            ).get(id=message_id)
        except ChatMessage.DoesNotExist:
            return None, None, "Message not found"

        if msg.sender_id != current_user.id:
            return None, None, "You can only edit your own messages"

        msg.content = data.content
        msg.save(update_fields=['content']) 

        reaction_map = {}
        for r in msg.reactions.all():
            if r.emoji not in reaction_map:
                reaction_map[r.emoji] = {"count": 0, "emails": []}
            reaction_map[r.emoji]["count"] += 1
            reaction_map[r.emoji]["emails"].append(r.user.email)

        reactions_list = [
            {"emoji": k, "count": v["count"], "user_emails": v["emails"]}
            for k, v in reaction_map.items()
        ]

        url = None
        if msg.attachment:
            try:
                url = msg.attachment.url
            except ValueError:
                pass

        response_data = {
            "id": msg.id,
            "sender_email": msg.sender.email,
            "sender_first_name": msg.sender.first_name,
            "sender_last_name": msg.sender.last_name,
            "content": msg.content,
            "attachment_url": url,
            "timestamp": msg.timestamp,
            "read_count": len(msg.read_by.all()),
            "is_starred": current_user in msg.starred_by.all(),
            "parent_id": msg.parent.id if msg.parent else None,
            "parent_content": msg.parent.content if msg.parent else None,
            "parent_sender": msg.parent.sender.email if msg.parent else None,
            "reactions": reactions_list,
            "is_forwarded": msg.is_forwarded
        }
        
        return response_data, msg.room_id, None

    response_data, room_id, error_msg = await process_edit()

    if error_msg == "Message not found":
        raise HTTPException(status_code=404, detail=error_msg)
    if error_msg == "You can only edit your own messages":
        raise HTTPException(status_code=403, detail=error_msg)

    socket_message = {
        "type": "MESSAGE_UPDATE",
        "id": response_data["id"],
        "room_id": room_id,
        "content": response_data["content"],
        "timestamp": str(response_data["timestamp"])
    }
    await manager.broadcast(socket_message, room_id)

    return response_data

@router.post("/rooms/{room_id}/read")
async def mark_room_as_read(
    room_id: int, 
    current_user = Depends(get_current_user)
):
    
    @sync_to_async
    def process_read_receipts():
        try:
            room = ChatRoom.objects.get(id=room_id)
            if not room.participants.filter(id=current_user.id).exists():
                raise PermissionError("Not a participant")
            
            unread_msgs = list(room.messages.exclude(read_by=current_user).exclude(sender=current_user))
            count = len(unread_msgs)
            
            msg_ids = []
            if count > 0:
                for msg in unread_msgs:
                    msg.read_by.add(current_user)
                    msg_ids.append(msg.id)
                
            return count, msg_ids
            
        except ChatRoom.DoesNotExist:
            return None, None

    try:
        count, msg_ids = await process_read_receipts()
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not a participant")

    if count is None:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if count > 0:
        socket_message = {
            "type": "MESSAGES_READ",
            "room_id": room_id,
            "reader_email": current_user.email,
            "message_ids": msg_ids
        }
        await manager.broadcast(socket_message, room_id)

    return {"message": "Messages marked as read", "updated_count": count}


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(message_id: int, current_user = Depends(get_current_user)):
    @sync_to_async
    def process_delete():
        try:
            msg = ChatMessage.objects.get(id=message_id)
        except ChatMessage.DoesNotExist:
            return None, "Message not found"

        if msg.sender_id != current_user.id:
            return None, "You can only delete your own messages"

        msg.is_deleted = True
        msg.save(update_fields=['is_deleted'])
        
        return msg.room_id, None

    room_id, error_msg = await process_delete()

    if error_msg == "Message not found":
        raise HTTPException(status_code=404, detail=error_msg)
    if error_msg == "You can only delete your own messages":
        raise HTTPException(status_code=403, detail=error_msg)

    socket_message = {
        "type": "MESSAGE_DELETE",
        "id": message_id,
        "room_id": room_id
    }
    await manager.broadcast(socket_message, room_id)

    return None


@router.get("/trash", response_model=List[MessageRead])
def chat_trash(current_user = Depends(get_current_user)):
    msgs = ChatMessage.objects.filter(
        sender=current_user, 
        is_deleted=True
    ).select_related(
        'sender', 'parent', 'parent__sender'
    ).prefetch_related(
        'reactions', 'reactions__user', 'read_by', 'starred_by'
    ).order_by("-timestamp")

    results = []
    for m in msgs:
        url = None
        if m.attachment:
            try:
                url = m.attachment.url
            except ValueError:
                pass
            
        reaction_map = {}
        for r in m.reactions.all():
            if r.emoji not in reaction_map:
                reaction_map[r.emoji] = {"count": 0, "emails": []}
            reaction_map[r.emoji]["count"] += 1
            reaction_map[r.emoji]["emails"].append(r.user.email)
        
        reactions_list = [
            {"emoji": k, "count": v["count"], "user_emails": v["emails"]}
            for k, v in reaction_map.items()
        ]

        results.append({
            "id": m.id,
            "sender_email": m.sender.email,
            "sender_first_name": m.sender.first_name,
            "sender_last_name": m.sender.last_name,
            "content": m.content,
            "attachment_url": url,
            "timestamp": m.timestamp,
            "read_count":len(m.read_by.all()),
            "is_starred": current_user in m.starred_by.all(),
            "parent_id": m.parent.id if m.parent else None,
            "parent_content": m.parent.content if m.parent else None,
            "parent_sender": m.parent.sender.email if m.parent else None,
            "reactions": reactions_list,
            "is_forwarded": m.is_forwarded
        })
    return results


@router.post("/messages/{message_id}/star")
async def star_message(message_id: int, current_user = Depends(get_current_user)):
    @sync_to_async
    def process_star():
        try:
            msg = ChatMessage.objects.select_related('room').get(id=message_id)
        except ChatMessage.DoesNotExist:
            return None, "Message not found"

        if not msg.room.participants.filter(id=current_user.id).exists():
            return None, "Not authorized"

        if msg.starred_by.filter(id=current_user.id).exists():
            msg.starred_by.remove(current_user)
            is_starred = False
        else:
            msg.starred_by.add(current_user)
            is_starred = True

        return is_starred, None

    is_starred, error_msg = await process_star()

    if error_msg == "Message not found":
        raise HTTPException(status_code=404, detail=error_msg)
    if error_msg == "Not authorized":
        raise HTTPException(status_code=403, detail=error_msg)

    return {"message": "Star updated", "is_starred": is_starred}


def format_room_response(room, current_user=None):
    
    last_msg_obj = room.messages.select_related(
        'sender', 'parent', 'parent__sender'
    ).prefetch_related(
        'read_by', 'starred_by', 'reactions', 'reactions__user'
    ).order_by("-timestamp").first()
    
    last_msg = None
    if last_msg_obj:
        url = None
        if last_msg_obj.attachment:
            try:
                url = last_msg_obj.attachment.url
            except ValueError:
                pass

        reaction_map = {}
        for r in last_msg_obj.reactions.all():
            if r.emoji not in reaction_map:
                reaction_map[r.emoji] = {"count": 0, "emails": []}
            reaction_map[r.emoji]["count"] += 1
            reaction_map[r.emoji]["emails"].append(r.user.email)

        reactions_list = [
            {"emoji": k, "count": v["count"], "user_emails": v["emails"]}
            for k, v in reaction_map.items()
        ]

        is_starred = False
        if current_user:
            is_starred = current_user in last_msg_obj.starred_by.all()

        last_msg = {
            "id": last_msg_obj.id,
            "sender_email": last_msg_obj.sender.email,
            "sender_first_name": last_msg_obj.sender.first_name,
            "sender_last_name": last_msg_obj.sender.last_name,
            "content": last_msg_obj.content,
            "attachment_url": url,
            "timestamp": last_msg_obj.timestamp,
            "read_count": len(last_msg_obj.read_by.all()),
            "is_starred": is_starred,
            "parent_id": last_msg_obj.parent.id if last_msg_obj.parent else None,
            "parent_content": last_msg_obj.parent.content if last_msg_obj.parent else None,
            "parent_sender": last_msg_obj.parent.sender.email if last_msg_obj.parent else None,
            "reactions": reactions_list,
            "is_forwarded": last_msg_obj.is_forwarded
        }

    return {
        "id": room.id,
        "name": room.name,
        "is_group": room.is_group,
        "participants": [u.email for u in room.participants.all()],
        "last_message": last_msg
    }


@router.get("/starred", response_model=List[MessageRead])
def get_my_starred_messages(current_user = Depends(get_current_user)):
    msgs = ChatMessage.objects.filter(
        starred_by=current_user,
        is_deleted=False
    ).select_related(
        'sender', 'parent', 'parent__sender'
    ).prefetch_related(
        'reactions', 'reactions__user', 'read_by', 'starred_by'
    ).order_by("-timestamp")
    
    results = []
    for m in msgs:
        # FIX 1: Safely handle missing attachments
        url = None
        if m.attachment:
            try:
                url = m.attachment.url
            except ValueError:
                pass
            
        reaction_map = {}
        for r in m.reactions.all():
            if r.emoji not in reaction_map:
                reaction_map[r.emoji] = {"count": 0, "emails": []}
            reaction_map[r.emoji]["count"] += 1
            reaction_map[r.emoji]["emails"].append(r.user.email)
            
        reactions_list = [
            {"emoji": k, "count": v["count"], "user_emails": v["emails"]}
            for k, v in reaction_map.items()
        ]
                
    results.append({
            "id": m.id,
            "sender_email": m.sender.email,
            "sender_first_name": m.sender.first_name,
            "sender_last_name": m.sender.last_name,
            "content": m.content,
            "attachment_url": url,
            "timestamp": m.timestamp,
            "read_count": len(m.read_by.all()),
            "is_starred": True,
            "parent_id": m.parent.id if m.parent else None,
            "parent_content": m.parent.content if m.parent else None,
            "parent_sender": m.parent.sender.email if m.parent else None,
            "reactions": reactions_list,
            "is_forwarded": m.is_forwarded
        })
        
    return results
 
@router.post("/rooms/{room_id}/upload")
async def upload_chat_attachment(
    room_id: int,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    file_content = await file.read()
    
    @sync_to_async
    def save_attachment_to_db():
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return None, "Room not found", None
            
        if not room.participants.filter(id=current_user.id).exists():
                return None, "Not a participant", None
            
        msg = ChatMessage.objects.create(
            room=room,
            sender=current_user,
            content=f"Sent a file: {file.filename}",
        )
        
        msg.attachment.save(file.filename, ContentFile(file_content))
        

        for participant in room.participants.exclude(id=current_user.id):
            create_notification(
                recipient=participant,
                message=f"{current_user.email} sent a file in {room.name or 'Chat'}",
                type_choice="chat"
            )

        socket_message = {
            "type": "MESSAGE_NEW",  
            "id": msg.id,
            "sender_email": current_user.email,
            "sender_first_name": current_user.first_name,
            "sender_last_name": current_user.last_name,
            "content": msg.content,
            "attachment_url": msg.attachment.url, 
            "timestamp": str(msg.timestamp),
            "read_count": 0,
            "is_starred": False,
            "parent_id": None,
            "parent_content": None,
            "parent_sender": None,
            "reactions": [],
            "is_forwarded": False
        }
        
        return socket_message, None, msg.attachment.url
    
    socket_message, error_msg, url = await save_attachment_to_db()

    if error_msg == "Not a participant":
        raise HTTPException(status_code=403, detail=error_msg)
    if error_msg == "Room not found":
        raise HTTPException(status_code=404, detail=error_msg)

    await manager.broadcast(socket_message, room_id)

    return {"message": "File uploaded", "url": url}

class TextMessageCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

@router.post("/messages/{message_id}/react")
async def toggle_reaction(
    message_id: int, 
    emoji: str = Query(..., min_length=1, description="The emoji character"),
    current_user = Depends(get_current_user)
):

    @sync_to_async
    def toggle_db_reaction():
        try:
            msg = ChatMessage.objects.select_related('sender', 'room').get(id=message_id)
        except ChatMessage.DoesNotExist:
            return None, None, None

        existing = MessageReaction.objects.filter(message=msg, user=current_user, emoji=emoji).first()
        
        if existing:
            existing.delete()
            action = "removed"
        else:
            MessageReaction.objects.create(message=msg, user=current_user, emoji=emoji) # Add
            action = "added"
            
            if msg.sender_id != current_user.id:
                create_notification(
                    recipient=msg.sender,
                    message=f"{current_user.email} reacted {emoji} to your message",
                    type_choice="chat"
                )
        
        return msg.id, action, msg.room_id

    msg_id, action, room_id = await toggle_db_reaction()
    
    if not msg_id:
        raise HTTPException(status_code=404, detail="Message not found")

    socket_message = {
        "type": "REACTION_UPDATE",
        "message_id": msg_id,
        "emoji": emoji,
        "action": action, 
        "user_email": current_user.email
    }
    await manager.broadcast(socket_message, room_id)

    return {"message": f"Reaction {action}", "emoji": emoji}

@router.post("/messages/{message_id}/forward")
async def forward_message(
    message_id: int,
    request: ForwardRequest,
    current_user = Depends(get_current_user)
):
    
    @sync_to_async
    def process_forward():
        try:
            original_msg = ChatMessage.objects.get(id=message_id)
        except ChatMessage.DoesNotExist:
            return None, "Original message not found", None
        try :    
            target_room = ChatRoom.objects.get(id=request.target_room_id)
        except ChatRoom.DoesNotExist:
            return None, "Target room not found", None
            
        if not target_room.participants.filter(id=current_user.id).exists():
            return None, "You are not a member of the target room", None

        new_msg = ChatMessage.objects.create(
            room=target_room,
            sender=current_user,
            content=original_msg.content, 
            attachment=original_msg.attachment, 
            is_forwarded=True
            )
            
        for participant in target_room.participants.exclude(id=current_user.id):
                
            create_notification(
                recipient=participant,
                message=f"Forwarded message from {current_user.email}",
                type_choice="chat"
                
                )
            url = None
        if new_msg.attachment:
            try:
                url = new_msg.attachment.url
            except ValueError:
                pass
        
        socket_message = {
            "type": "MESSAGE_NEW",  
            "id": new_msg.id,
            "sender_email": current_user.email,
            "sender_first_name": current_user.first_name,
            "sender_last_name": current_user.last_name,
            "content": new_msg.content,
            "attachment_url": url,
            "timestamp": str(new_msg.timestamp),
            "read_count": 0,
            "is_starred": False,
            "parent_id": None, 
            "parent_content": None,
            "parent_sender": None,
            "reactions": [],
            "is_forwarded": True 
        }    

        return socket_message, None, new_msg.id
    socket_message, error_msg, new_msg_id = await process_forward()

    if error_msg == "You are not a member of the target room":
         raise HTTPException(status_code=403, detail=error_msg)
    if error_msg:
        raise HTTPException(status_code=404, detail=error_msg)

    await manager.broadcast(socket_message, request.target_room_id)

    return {"message": "Message forwarded", "new_message_id": new_msg_id}

@router.post("/rooms/{room_id}/message")
async def send_text_message(
    room_id: int,
    data: TextMessageCreate,
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def save_text_message():
        try:
            room = ChatRoom.objects.prefetch_related('participants').get(id=room_id)
            if current_user not in room.participants.all():
                raise PermissionError("Not a participant")
            
            parent_msg = None
            if data.parent_id:
                try:
                    parent_msg = ChatMessage.objects.select_related('sender').get(id=data.parent_id, room=room)
                except ChatMessage.DoesNotExist:
                    pass 

            msg = ChatMessage.objects.create(
                room=room,
                sender=current_user,
                content=data.content,
                parent=parent_msg
            )
            process_mentions(msg)

            recipients = [p for p in room.participants.all() if p.id != current_user.id]
            
            notifications_to_create = [
                Notification(
                    recipient=participant,
                    message=f"New message from {current_user.first_name or current_user.email}",
                    notification_type="chat" 
                ) for participant in recipients
            ]
            
            if notifications_to_create:
                Notification.objects.bulk_create(notifications_to_create)

            parent_info = None
            if parent_msg:
                parent_info = {
                    "id": parent_msg.id,
                    "content": parent_msg.content,
                    "sender": parent_msg.sender.email
                }
                
            socket_payload = {
                "id": msg.id,
                "sender_email": current_user.email,
                "sender_first_name": current_user.first_name,
                "sender_last_name": current_user.last_name,
                
                "content": msg.content,
                "timestamp": str(msg.timestamp),
                "parent_id": parent_info["id"] if parent_info else None,
                "parent_content": parent_info["content"] if parent_info else None,
                "parent_sender": parent_info["sender"] if parent_info else None,
                
                "read_count": 0,
                "is_starred": False,
                "reactions": [],
                "is_forwarded": False
            }
            
            return socket_payload        

        except ChatRoom.DoesNotExist:
            return None

    try:
        socket_message = await save_text_message()
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not a participant")
        
    if not socket_message:
        raise HTTPException(status_code=404, detail="Room not found")

    await manager.broadcast(socket_message, room_id)

    return {"message": "Message sent", "id": socket_message["id"]}


@router.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: int, user_id: int):
    await manager.connect(websocket, room_id, user_id)
    
    @sync_to_async
    def save_message(room_id, user_id, content, parent_id=None):
        room = ChatRoom.objects.get(id=room_id)
        sender = User.objects.get(id=user_id)
        
        parent_msg = None
        if parent_id:
            try:
                parent_msg = ChatMessage.objects.get(id=parent_id, room=room)
            except ChatMessage.DoesNotExist:
                pass

        msg = ChatMessage.objects.create(
            room=room, 
            sender=sender, 
            content=content,
            parent=parent_msg 
        )
        process_mentions(msg)

        parent_info = None
        if parent_msg:
            parent_info = {
                "id": parent_msg.id,
                "content": parent_msg.content,
                "sender": parent_msg.sender.email
            }

        return msg, sender.email, parent_info

    try:
        while True:
            text_data = await websocket.receive_text()
            
            try:
                payload = json.loads(text_data)
            except json.JSONDecodeError:
                payload = {"content": text_data}

            if payload.get("type") == "typing":
                await manager.broadcast({
                    "type": "typing",
                    "user_id": user_id,
                    "room_id": room_id
                }, room_id)
                continue 
            
            if payload.get("type") == "SCREEN_SHARE_STATUS":
                is_sharing = payload.get("is_sharing")
                
                user = await sync_to_async(User.objects.get)(id=user_id)
                action_text = "started sharing their screen" if is_sharing else "stopped sharing"
                content = f" {user.first_name} {action_text}"

                msg_obj = await sync_to_async(ChatMessage.objects.create)(
                    room_id=room_id,
                    sender=user,
                    content=content,
                    message_type='SYSTEM' 
                )

                response = {
                    "type": "system_alert",
                    "content": content,
                    "is_sharing": is_sharing,
                    "sharer_id": user_id,
                    "timestamp": str(msg_obj.timestamp)
                }
                await manager.broadcast(response, room_id)
                continue
            
            if payload.get("type") == "CALL_ACCEPTED":
                call_id = payload.get("call_id")
                
                @sync_to_async
                def accept_call():
                    Call.objects.filter(id=call_id).update(status="ONGOING")
                await accept_call()

                await manager.broadcast({
                    "type": "CALL_STARTED",
                    "call_id": call_id,
                    "message": "Call connected."
                }, room_id)
                continue

            if payload.get("type") == "CALL_REJECTED":
                call_id = payload.get("call_id")
                
                @sync_to_async
                def reject_call():
                    Call.objects.filter(id=call_id).update(status="MISSED", ended_at=timezone.now())
                await reject_call()

                await manager.broadcast({
                    "type": "CALL_DECLINED",
                    "call_id": call_id
                }, room_id)
                continue

            if payload.get("type") == "CALL_ENDED":
                call_id = payload.get("call_id")
                
                @sync_to_async
                def end_call():
                    Call.objects.filter(id=call_id).update(status="ENDED", ended_at=timezone.now())
                await end_call()

                await manager.broadcast({
                    "type": "CALL_FINISHED",
                    "call_id": call_id
                }, room_id)
                continue
            
            content = payload.get("content")
            parent_id = payload.get("parent_id")
            
            if not content:
                continue

            msg_obj, sender_email, parent_info = await save_message(room_id, user_id, content, parent_id)
    
            response = {
                "type": "new_message", 
                "id": msg_obj.id,
                "sender": sender_email,
                "content": content,
                "timestamp": str(msg_obj.timestamp),
                "parent_id": parent_info["id"] if parent_info else None,
                "parent_content": parent_info["content"] if parent_info else None,
                "parent_sender": parent_info["sender"] if parent_info else None,
                "is_forwarded": False 
            }
            await manager.broadcast(response, room_id)
            
    except WebSocketDisconnect:
        await manager.disconnect(websocket, room_id, user_id) 
             
@router.post("/rooms/{room_id}/members")
async def add_members(
    room_id: int,
    data: ChatMemberUpdate,
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def perform_add():
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            raise HTTPException(status_code=404, detail="Room not found")

        if not room.participants.filter(id=current_user.id).exists():
            raise HTTPException(status_code=403, detail="Not a participant")

        users_to_add = list(User.objects.filter(email__in=data.user_emails))
        
        existing_emails = set(
            room.participants.filter(email__in=data.user_emails).values_list("email", flat=True)
        )
        new_users = [u for u in users_to_add if u.email not in existing_emails]

        if new_users:
            room.participants.add(*new_users)

        return [u.email for u in new_users]

    added_emails = await perform_add()
    
    return {"message": "Members added", "added": added_emails}

@router.post("/rooms/{room_id}/leave")
async def leave_room(
    room_id: int,
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def perform_leave():
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            raise HTTPException(status_code=404, detail="Room not found")

        if room.participants.filter(id=current_user.id).exists():
            
            room.participants.remove(current_user)
            
        else:
            pass

    await perform_leave()
    
    return {"message": "You have left the group"}     

@router.post("/rooms/{room_id}/call")
async def start_call(
    room_id: int,
    current_user = Depends(get_current_user)
):
    @sync_to_async
    def get_room_and_check_access():
        try:
            r = ChatRoom.objects.get(id=room_id)
            if current_user not in r.participants.all():
                raise PermissionError("Not a participant")
            return r
        except ChatRoom.DoesNotExist:
            return None

    try:
        room = await get_room_and_check_access()
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not a participant")
        
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    code = secrets.token_urlsafe(8)
    jitsi_id = f"Stackly-Chat-{code}"
    join_url = f"https://meet.jit.si/{jitsi_id}"

    @sync_to_async
    def create_call_record():
        call_obj = Call.objects.create(
            room=room,
            caller=current_user,
            jitsi_meeting_id=jitsi_id,
            status='RINGING'
        )
        return call_obj

    call_obj = await create_call_record()
    caller_display_name = f"{current_user.first_name} {current_user.last_name}".strip()
    if not caller_display_name:
        caller_display_name = current_user.email
        
    socket_message = {
        "type": "INCOMING_CALL",
        "call_id": call_obj.id,
        "caller_email": current_user.email,
        "caller_name": caller_display_name,
        "jitsi_meeting_id": jitsi_id,
        "link": join_url,
        "timestamp": str(call_obj.started_at)
    }
    
    await manager.broadcast(socket_message, room_id)

    return {
        "message": "Call ringing initiated", 
        "call_id": call_obj.id,
        "link": join_url
    }


def process_mentions(message_obj):
    
    if not message_obj.content:
        return

    potential_emails = re.findall(r'@([\w\.-]+@[\w\.-]+)', message_obj.content)

    if not potential_emails:
        return

    users_to_mention = list(User.objects.filter(email__in=potential_emails))

    if users_to_mention:
        message_obj.mentions.add(*users_to_mention)
            

@router.get("/mentions", response_model=List[MessageRead])
async def get_my_mentions(current_user: User = Depends(get_current_user)):
    
    @sync_to_async
    def fetch_optimized_mentions():
        msgs = current_user.mentioned_in_messages.filter(
            is_deleted=False
        ).select_related(
            "sender"
        ).prefetch_related(
            "read_by", "starred_by"
        ).order_by("-timestamp")
        
        results = []
        for m in msgs:
            url = None
            if m.attachment:
                try:
                    url = m.attachment.url
                except ValueError:
                    pass
 
            read_count = len(m.read_by.all())
            is_starred = current_user in m.starred_by.all()

            results.append({
                "id": m.id,
                "sender_email": m.sender.email,
                "content": m.content,
                "attachment_url": url,
                "timestamp": m.timestamp,
                "read_count": read_count,
                "is_starred": is_starred
            })
            
        return results

    return await fetch_optimized_mentions()            

@router.websocket("/ws/{user_id}")
async def status_websocket(
    websocket: WebSocket, 
    user_id: int, 
    current_user: User = Depends(get_current_user_ws) 
):
    
    if current_user.id != user_id:
        print(f"Security Alert: User {current_user.id} tried to listen to User {user_id}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user_id, user_id)
    
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
       await manager.disconnect(websocket, user_id, user_id)
       
       
class UserStatusResponse(BaseModel):
    user_id: int
    is_online: bool
    last_seen: Optional[datetime] = None       
       
@router.get("/users/{target_id}/status", response_model=UserStatusResponse)
async def get_user_status(
    target_id: int, 
    current_user = Depends(get_current_user)
):
    
    User = get_user_model()
    
    try:
        user = await sync_to_async(User.objects.select_related('profile').get)(id=target_id)
        
        if not hasattr(user, 'profile'):
            return {
                "user_id": target_id,
                "is_online": False,
                "last_seen": None
            }

        return {
            "user_id": user.id,
            "is_online": user.profile.is_online,
            "last_seen": user.profile.last_seen
        }

    except User.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )       
        

    
@router.get("/offline", response_model=List[OfflineUser])
async def get_offline_users(
    limit: int = Query(20, description="Max number of offline users to return", le=100),
    current_user: User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Authentication failed or user context lost."
        )
    requester_id = current_user.id
    
    active_user_ids = list(manager.user_connection_counts.keys())
    
    @sync_to_async
    def fetch_offline_users_from_db():
        users = User.objects.select_related('profile').exclude(
            id=requester_id
        ).exclude(
            id__in=active_user_ids 
        ).order_by('-profile__last_seen')[:limit]
        
        result = []
        for u in users:
            full_name = f"{u.first_name} {u.last_name}".strip()
            if not full_name:
                full_name = u.email.split('@')[0]
                
            profile_img = None
            last_seen_time = None
            
            if hasattr(u, 'profile') and u.profile is not None:
                last_seen_time = u.profile.last_seen
                if hasattr(u.profile, 'avatar') and u.profile.avatar: 
                    profile_img = u.profile.avatar.url
                
                    
            result.append({
                "id": u.id,
                "name": full_name,
                "email": u.email,
                "profile_image": profile_img,
                "last_seen": last_seen_time
            })
            
        return result

    return await fetch_offline_users_from_db()            