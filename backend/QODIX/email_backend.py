from django.core.mail.backends.smtp import EmailBackend
from core_settings.models import EmailConfiguration
from django.conf import settings

class DynamicEmailBackend(EmailBackend):
    def __init__(self, fail_silently=False, **kwargs):
        config = EmailConfiguration.load()
        kwargs['host'] = config.smtp_host or settings.EMAIL_HOST
        kwargs['port'] = config.smtp_port or settings.EMAIL_PORT
        kwargs['username'] = config.smtp_user or settings.EMAIL_HOST_USER
        kwargs['password'] = config.smtp_password or settings.EMAIL_HOST_PASSWORD
        kwargs['use_tls'] = config.use_tls
        super().__init__(fail_silently=fail_silently, **kwargs)
