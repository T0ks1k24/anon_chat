from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Message(models.Model):
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )
    receiver = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name="received_messages"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
