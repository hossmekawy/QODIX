from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SocialAccountViewSet, ServerViewSet, HostedProjectViewSet,
    ProviderInvoiceViewSet, DomainViewSet, SSLCertificateViewSet, APIKeyViewSet, PromptViewSet
)

router = DefaultRouter()
router.register(r'social-accounts', SocialAccountViewSet, basename='socialaccount')
router.register(r'servers', ServerViewSet, basename='server')
router.register(r'hosted-projects', HostedProjectViewSet, basename='hostedproject')
router.register(r'invoices', ProviderInvoiceViewSet, basename='invoice')
router.register(r'domains', DomainViewSet, basename='domain')
router.register(r'ssl-certificates', SSLCertificateViewSet, basename='sslcertificate')
router.register(r'api-keys', APIKeyViewSet, basename='apikey')
router.register(r'prompts', PromptViewSet, basename='prompt')

urlpatterns = [
    path('', include(router.urls)),
]
