from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlanViewSet, PlanItemViewSet

router = DefaultRouter()
router.register(r'plans', PlanViewSet)
router.register(r'items', PlanItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
