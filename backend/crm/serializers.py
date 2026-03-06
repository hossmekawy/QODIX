from rest_framework import serializers
from .models import Tag, Customer, CustomerAttachment, Interaction
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'

class InteractionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Interaction
        fields = ['id', 'user', 'user_name', 'interaction_type', 'notes', 'date', 'next_followup_date']
        read_only_fields = ['id', 'date', 'user_name']

class CustomerAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAttachment
        fields = ['id', 'file', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

class CustomerSerializer(serializers.ModelSerializer):
    attachments = CustomerAttachmentSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    interactions = InteractionSerializer(many=True, read_only=True)
    projects = serializers.SerializerMethodField()
    interaction_ytd = serializers.SerializerMethodField()
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), 
        write_only=True, 
        many=True, 
        source='tags',
        required=False
    )

    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'company_name', 'industry', 'phone', 'email', 
            'address', 'last_contact_date', 'next_followup_date', 'website', 
            'notes', 'tags', 'tag_ids', 'attachments', 'interactions', 'projects', 'interaction_ytd', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'attachments', 'tags', 'interactions']

    def get_projects(self, obj):
        # We perform a safe import to avoid circular dependencies
        try:
            from projects.models import Project
            # Get projects associated with this customer
            projects = Project.objects.filter(customer=obj).order_by('-created_at')
            return [{
                'id': p.id,
                'name': p.name,
                'status': p.status,
                'deadline': p.deadline,
                'progress': int((p.tasks.filter(status='Completed').count() / p.tasks.count() * 100)) if p.tasks.count() > 0 else 0
            } for p in projects]
        except Exception as e:
            return []
            
    def get_interaction_ytd(self, obj):
        # Calculate trailing 6 months interactions grouped by month
        today = timezone.now().date()
        history = []
        for i in range(5, -1, -1):
            m = today.month - i
            y = today.year
            if m <= 0:
                m += 12
                y -= 1
            
            from datetime import date
            start_date = date(y, m, 1)
            if m == 12:
                end_date = date(y+1, 1, 1)
            else:
                end_date = date(y, m+1, 1)
                
            count = obj.interactions.filter(date__gte=start_date, date__lt=end_date).count()
            history.append({
                'month': start_date.strftime('%b'),
                'interactions': count
            })
        return history
