from rest_framework import serializers
from accounts.serializers import UserSerializer
from crm.serializers import CustomerSerializer
from infrastructure.serializers import ServerSerializer
from .models import (
    Project, ProjectTeamMember, Task, TaskAttachment, TaskComment,
    ProjectDocument, Deliverable, TestBug, FinancialPayment
)

class ProjectTeamMemberSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = ProjectTeamMember
        fields = ['id', 'project', 'user', 'user_details', 'role', 'allocation_hours']

class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_details = UserSerializer(source='uploaded_by', read_only=True)
    
    class Meta:
        model = TaskAttachment
        fields = ['id', 'task', 'file', 'uploaded_by', 'uploaded_by_details', 'uploaded_at']

class TaskCommentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'user', 'user_details', 'text', 'timestamp']

class TaskSerializer(serializers.ModelSerializer):
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    assignees_details = UserSerializer(source='assignees', many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'

class ProjectDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectDocument
        fields = '__all__'

class DeliverableSerializer(serializers.ModelSerializer):
    associated_server_details = ServerSerializer(source='associated_server', read_only=True)
    class Meta:
        model = Deliverable
        fields = '__all__'

class TestBugSerializer(serializers.ModelSerializer):
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    class Meta:
        model = TestBug
        fields = '__all__'

class FinancialPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialPayment
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    customer_details = CustomerSerializer(source='customer', read_only=True)
    team_members = ProjectTeamMemberSerializer(many=True, read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)
    documents = ProjectDocumentSerializer(many=True, read_only=True)
    deliverables = DeliverableSerializer(many=True, read_only=True)
    bugs = TestBugSerializer(many=True, read_only=True)
    payments = FinancialPaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'
