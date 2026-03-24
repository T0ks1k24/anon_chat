import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from chat.models import Message
from django.contrib.auth import get_user_model

User = get_user_model()

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

        await self.set_online_status(True)
        await self.accept()

        # Sync existing online users to the newly connected client
        online_users = await self.get_online_users()
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
            await self.set_online_status(False)
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
        
        # Ping/pong heartbeat
        if data.get("type") == "ping":
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
    def get_online_users(self):
        # Fetch directly to avoid DB sync issues, ensuring latest state
        return list(User.objects.filter(is_online=True).values_list('username', flat=True))

    @database_sync_to_async
    def set_online_status(self, is_online):
        self.user.is_online = is_online
        self.user.save(update_fields=['is_online'])

    @database_sync_to_async
    def save_message(self, content):
        return Message.objects.create(sender=self.user, content=content)
