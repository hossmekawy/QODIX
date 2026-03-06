from django.db import models
from django.core.exceptions import ValidationError

class SingletonModel(models.Model):
    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.pk and self.__class__.objects.exists():
            # if you'll not check for self.pk 
            # then error will also raised in update of exists model
            raise ValidationError('There can be only one instance of this settings class')
        return super(SingletonModel, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

class CompanySettings(SingletonModel):
    name = models.CharField(max_length=255, default='QODIX PORTAL')
    logo = models.TextField(blank=True, null=True, help_text="Base64 encoded image")
    phone_number = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    whatsapp_number = models.CharField(max_length=50, blank=True)
    instagram_link = models.URLField(blank=True)
    linkedin_link = models.URLField(blank=True)
    currency = models.CharField(max_length=10, default='EGP')
    time_zone = models.CharField(max_length=50, default='UTC')

    def __str__(self):
        return "Company Settings"

class EmailConfiguration(SingletonModel):
    smtp_host = models.CharField(max_length=255, blank=True)
    smtp_port = models.IntegerField(default=587)
    smtp_user = models.CharField(max_length=255, blank=True)
    smtp_password = models.CharField(max_length=255, blank=True)
    use_tls = models.BooleanField(default=True)
    default_from_email = models.EmailField(blank=True)

    def __str__(self):
        return "Email Configuration"

class SecuritySettings(SingletonModel):
    ip_whitelist = models.TextField(blank=True, help_text="Comma separated IPs")
    login_attempt_limits = models.IntegerField(default=5)
    audit_log_retention_days = models.IntegerField(default=30)

    def __str__(self):
        return "Security Settings"

class BackupSettings(SingletonModel):
    automated_backup_schedule = models.CharField(max_length=100, default='0 0 * * *', help_text="Cron format")
    backup_storage_location = models.CharField(max_length=255, default='/var/backups/qodix')

    def __str__(self):
        return "Backup Settings"

class NotificationRule(models.Model):
    event_type = models.CharField(max_length=100, unique=True, help_text="e.g. Task Assigned, Contract Expiring")
    roles_to_notify = models.TextField(blank=True, help_text="Comma separated roles: admin, manager, user")
    email_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=True)

    def __str__(self):
        return f"Rule: {self.event_type}"
