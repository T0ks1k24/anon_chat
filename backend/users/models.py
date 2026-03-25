from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class User(AbstractUser):
    email = None

    groups = models.ManyToManyField(
        Group,
        blank=True,
        related_name="custom_user_set"
    )
    user_permissions = models.ManyToManyField(
        Permission,
        blank=True,
        related_name="custom_user_permissions_set"
    )

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []
