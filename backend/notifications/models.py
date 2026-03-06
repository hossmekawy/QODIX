from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Notification(models.Model):
    TYPE_CHOICES = (
        ('task', 'Task'),
        ('payment', 'Payment'),
        ('deadline', 'Deadline'),
        ('system', 'System'),
        ('milestone', 'Milestone'),
        ('message', 'Message'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='system')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    related_link = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.type}] {self.title} to {self.user}"

class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preference')
    email_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=True)

    def __str__(self):
        return f"Prefs for {self.user.username}"
