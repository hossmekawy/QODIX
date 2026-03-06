from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CompanySettingsView, EmailConfigurationView,
    SecuritySettingsView, BackupSettingsView,
    NotificationRuleListCreateView, NotificationRuleDetailView,
    SystemDashboardViewSet
)

router = DefaultRouter()
router.register(r'system-analytics', SystemDashboardViewSet, basename='system-analytics')

urlpatterns = [
    path('', include(router.urls)),
    path('company/', CompanySettingsView.as_view(), name='company_settings'),
    path('email/', EmailConfigurationView.as_view(), name='email_settings'),
    path('security/', SecuritySettingsView.as_view(), name='security_settings'),
    path('backup/', BackupSettingsView.as_view(), name='backup_settings'),
    path('notification-rules/', NotificationRuleListCreateView.as_view(), name='notification_rules_list'),
    path('notification-rules/<int:pk>/', NotificationRuleDetailView.as_view(), name='notification_rules_detail'),
]
