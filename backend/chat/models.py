from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Message(models.Model):
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )
    room = models.CharField(max_length=100, default="global")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
