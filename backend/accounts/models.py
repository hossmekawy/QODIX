import base64
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'superuser')
        return self.create_user(username, email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True)
    pin = models.CharField(max_length=10, blank=True, null=True, help_text="PIN for quick sign-in")
    picture = models.TextField(blank=True, null=True, help_text="Base64 encoded image")
    
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('superuser', 'Superuser'),
        ('manager', 'Manager'),
        ('hr', 'HR'),
        ('user', 'User'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    
    last_signin = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

    @property
    def avg_signin(self):
        logs = self.signin_logs.order_by('timestamp')
        if logs.count() > 1:
            first_log = logs.first().timestamp
            last_log = logs.last().timestamp
            total_duration = (last_log - first_log).total_seconds()
            avg_seconds = total_duration / (logs.count() - 1)
            return f"{round(avg_seconds / 3600, 2)} hours"
        return "Not enough data"

class SignInLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='signin_logs')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} signed in at {self.timestamp}"
