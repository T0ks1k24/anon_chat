import json
import os
import redis.asyncio as aioredis
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from chat.models import Message
from django.contrib.auth import get_user_model

User = get_user_model()

# Dedicated Redis connection for ultra-fast presence tracking TTLs
redis_client = aioredis.from_url(
    f"redis://{os.environ.get('REDIS_HOST', '127.0.0.1')}:6379/1",
    decode_responses=True
)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')

        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        self.room = 'global_chat'

        await self.channel_layer.group_add(
            self.room,
            self.channel_name
        )

        # Mark user as online in Redis with a 60 sec TTL
        await redis_client.set(f"online_user:{self.user.username}", "1", ex=60)
        await self.accept()

        # Sync existing online users based on active Redis keys
        keys = await redis_client.keys("online_user:*")
        online_users = [k.replace("online_user:", "") for k in keys]
        
        await self.send(text_data=json.dumps({
            "type": "sync_presence",
            "users": online_users
        }))

        await self.channel_layer.group_send(
            self.room,
            {
                "type": "presence",
                "user": self.user.username,
                "status": "online"
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and self.user.is_authenticated:
            # Graceful disconnect immediately cleans up the Redis key
            await redis_client.delete(f"online_user:{self.user.username}")
            
            await self.channel_layer.group_send(
                self.room,
                {
                    "type": "presence",
                    "user": self.user.username,
                    "status": "offline"
                }
            )

            await self.channel_layer.group_discard(
                self.room,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        # Ping/pong heartbeat helps us refresh the 60 sec TTL for presence
        if data.get("type") == "ping":
            await redis_client.expire(f"online_user:{self.user.username}", 60)
            await self.send(text_data=json.dumps({"type": "pong"}))
            return

        message_content = data.get("message")
        if not message_content:
            return

        msg = await self.save_message(message_content)

        await self.channel_layer.group_send(
            self.room,
            {
                "type": "chat_message",
                "message": msg.content,
                "user": self.user.username,
                "created_at": msg.created_at.isoformat()
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"],
            "user": event["user"],
            "created_at": event.get("created_at")
        }))

    async def presence(self, event):
        await self.send(text_data=json.dumps({
            "type": "presence",
            "user": event["user"],
            "status": event["status"]
        }))

    @database_sync_to_async
    def save_message(self, content):
        return Message.objects.create(sender=self.user, content=content)
