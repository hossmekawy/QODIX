from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Project, ProjectTeamMember, Task, TaskAttachment, TaskComment,
    ProjectDocument, Deliverable, TestBug, FinancialPayment
)
from .serializers import (
    ProjectSerializer, ProjectTeamMemberSerializer, TaskSerializer, 
    TaskAttachmentSerializer, TaskCommentSerializer, ProjectDocumentSerializer,
    DeliverableSerializer, TestBugSerializer, FinancialPaymentSerializer
)

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'priority', 'project_type', 'customer']
    search_fields = ['name', 'description']

class ProjectTeamMemberViewSet(viewsets.ModelViewSet):
    queryset = ProjectTeamMember.objects.all()
    serializer_class = ProjectTeamMemberSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['project', 'user']

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('due_date')
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['project', 'status', 'priority', 'assignees']
    search_fields = ['title', 'description']

class TaskAttachmentViewSet(viewsets.ModelViewSet):
    queryset = TaskAttachment.objects.all().order_by('-uploaded_at')
    serializer_class = TaskAttachmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['task']

    def create(self, request, *args, **kwargs):
        task_id = request.data.get('task')
        
        # Enforce max 10 files per task
        if task_id:
            current_count = TaskAttachment.objects.filter(task_id=task_id).count()
            if current_count >= 10:
                return Response({'detail': 'Maximum of 10 attachments per task allowed.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Enforce 10MB limit
        if 'file' in request.FILES:
            file_obj = request.FILES['file']
            if file_obj.size > 10 * 1024 * 1024:
                return Response({'detail': 'File size exceeds 10MB limit.'}, status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)

class TaskCommentViewSet(viewsets.ModelViewSet):
    queryset = TaskComment.objects.all().order_by('-timestamp')
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['task']

class ProjectDocumentViewSet(viewsets.ModelViewSet):
    queryset = ProjectDocument.objects.all().order_by('-uploaded_at')
    serializer_class = ProjectDocumentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['project', 'category']

class DeliverableViewSet(viewsets.ModelViewSet):
    queryset = Deliverable.objects.all().order_by('expected_date')
    serializer_class = DeliverableSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['project', 'status']

class TestBugViewSet(viewsets.ModelViewSet):
    queryset = TestBug.objects.all().order_by('-created_at')
    serializer_class = TestBugSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['project', 'status', 'priority', 'assigned_to']

class FinancialPaymentViewSet(viewsets.ModelViewSet):
    queryset = FinancialPayment.objects.all().order_by('due_date')
    serializer_class = FinancialPaymentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['project', 'status']
