from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, ProjectTeamMemberViewSet, TaskViewSet,
    TaskAttachmentViewSet, TaskCommentViewSet, ProjectDocumentViewSet,
    DeliverableViewSet, TestBugViewSet, FinancialPaymentViewSet
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'team-members', ProjectTeamMemberViewSet, basename='teammember')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'task-attachments', TaskAttachmentViewSet, basename='taskattachment')
router.register(r'task-comments', TaskCommentViewSet, basename='taskcomment')
router.register(r'documents', ProjectDocumentViewSet, basename='document')
router.register(r'deliverables', DeliverableViewSet, basename='deliverable')
router.register(r'bugs', TestBugViewSet, basename='testbug')
router.register(r'payments', FinancialPaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
]
