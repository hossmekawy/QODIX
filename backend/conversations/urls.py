from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, MessageViewSet, UsersListViewSet

router = DefaultRouter()
router.register(r'chats', ConversationViewSet, basename='conversations')
router.register(r'messages', MessageViewSet, basename='messages')
router.register(r'users', UsersListViewSet, basename='chat-users')

urlpatterns = [
    path('', include(router.urls)),
]
