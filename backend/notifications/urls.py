from django.urls import path
from .views import (
    NotificationListView, UnreadNotificationCountView,
    MarkNotificationsReadView, MarkAllNotificationsReadView,
    NotificationPreferenceView
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification_list'),
    path('unread-count/', UnreadNotificationCountView.as_view(), name='notification_unread_count'),
    path('mark-read/', MarkNotificationsReadView.as_view(), name='notification_mark_read'),
    path('mark-all-read/', MarkAllNotificationsReadView.as_view(), name='notification_mark_all_read'),
    path('preferences/', NotificationPreferenceView.as_view(), name='notification_preferences'),
]
