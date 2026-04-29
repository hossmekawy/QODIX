from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SocialAccountViewSet, ServerViewSet, HostedProjectViewSet,
    ProviderInvoiceViewSet, DomainViewSet, SSLCertificateViewSet,
    APIKeyViewSet, PromptViewSet, all_servers_ports
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
    path('ports/all/', all_servers_ports, name='all-servers-ports'),
]
