from fastapi import WebSocket
from typing import List, Dict
from django.utils import timezone
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
import redis.asyncio as redis
import json
import asyncio

User = get_user_model()
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self.user_connection_counts: Dict[int, int] = {} 

    async def connect(self, websocket: WebSocket, room_id: int, user_id: int):
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        current_count = self.user_connection_counts.get(user_id, 0)
        self.user_connection_counts[user_id] = current_count + 1
        
        if current_count == 0:
            await self.update_user_presence(user_id, True)
        await self.broadcast_to_all({
            "type": "USER_STATUS",
            "user_id": user_id,
            "status": "online"
        })

    async def disconnect(self, websocket: WebSocket, room_id: int, user_id: int):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]    
                
        if user_id in self.user_connection_counts:
            self.user_connection_counts[user_id] -= 1
            
            if self.user_connection_counts[user_id] <= 0:
                del self.user_connection_counts[user_id]
                
                await self.update_user_presence(user_id, False)

                await self.broadcast_to_all({
                    "type": "USER_STATUS",
                    "user_id": user_id,
                    "status": "offline",
                    "last_seen": str(timezone.now())
                })

    @sync_to_async
    def update_user_presence(self, user_id: int, is_online: bool):
        
        try:
            user = User.objects.select_related('profile').get(id=user_id)
            if hasattr(user, 'profile'):
                user.profile.is_online = is_online
                user.profile.last_seen = timezone.now()
                user.profile.save(update_fields=['is_online', 'last_seen'])
        except User.DoesNotExist:
            pass

    async def broadcast(self, message: dict, room_id: int):
        """Send a message to everyone in the room"""
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id][:]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def broadcast_to_all(self, message: dict):
        
        for room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass
    
    def get_online_users(self) -> List[int]:
        
        return list(self.user_connection_counts.keys())
    
    async def start_redis_listener(self):
        
        print("Redis Listener Started...")
        r = redis.from_url("redis://localhost:6379/0")
        pubsub = r.pubsub()
        await pubsub.subscribe("status_updates")

        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    await self.broadcast_to_all(data)
                except Exception as e:
                    print(f"Error broadcasting redis message: {e}")
    
manager = ConnectionManager()

    