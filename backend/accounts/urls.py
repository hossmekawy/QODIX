from django.urls import path
from .views import (
    RegisterView, LoginView, PINLoginView, UserProfileView,
    UserListView, UserDetailView, UserUpdateView, UserDeleteView,
    ChangePasswordView, ChangePINView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('pin-login/', PINLoginView.as_view(), name='auth_pin_login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='auth_profile'),
    path('profile/change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('profile/change-pin/', ChangePINView.as_view(), name='auth_change_pin'),
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('users/<int:pk>/update/', UserUpdateView.as_view(), name='user_update'),
    path('users/<int:pk>/delete/', UserDeleteView.as_view(), name='user_delete'),
]
