from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TagViewSet, CustomerViewSet, InteractionViewSet

router = DefaultRouter()
router.register(r'tags', TagViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'interactions', InteractionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
