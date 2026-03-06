from rest_framework import generics, permissions
from .models import CompanySettings, EmailConfiguration, SecuritySettings, BackupSettings, NotificationRule
from .serializers import (
    CompanySettingsSerializer, EmailConfigurationSerializer,
    SecuritySettingsSerializer, BackupSettingsSerializer, NotificationRuleSerializer
)

class IsAdminOrSuperuser(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'superuser'] or request.user.is_superuser

# Singleton Views (Retrieve/Update single object)
class SingletonAPIView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated] # Let any authenticated user read, but update is handled by permissions or overridden.

    def get_object(self):
        return self.queryset.model.load()

class CompanySettingsView(SingletonAPIView):
    queryset = CompanySettings.objects.all()
    serializer_class = CompanySettingsSerializer
    permission_classes = [permissions.AllowAny] # Allow any to read for logo/name

    def put(self, request, *args, **kwargs):
        if not IsAdminOrSuperuser().has_permission(request, self):
            self.permission_denied(request)
        return super().put(request, *args, **kwargs)

class EmailConfigurationView(SingletonAPIView):
    queryset = EmailConfiguration.objects.all()
    serializer_class = EmailConfigurationSerializer
    permission_classes = [IsAdminOrSuperuser]

class SecuritySettingsView(SingletonAPIView):
    queryset = SecuritySettings.objects.all()
    serializer_class = SecuritySettingsSerializer
    permission_classes = [IsAdminOrSuperuser]

class BackupSettingsView(SingletonAPIView):
    queryset = BackupSettings.objects.all()
    serializer_class = BackupSettingsSerializer
    permission_classes = [IsAdminOrSuperuser]

class NotificationRuleListCreateView(generics.ListCreateAPIView):
    queryset = NotificationRule.objects.all()
    serializer_class = NotificationRuleSerializer
    permission_classes = [IsAdminOrSuperuser]

class NotificationRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = NotificationRule.objects.all()
    serializer_class = NotificationRuleSerializer
    permission_classes = [IsAdminOrSuperuser]

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum

class SystemDashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def overview(self, request):
        from crm.models import Customer
        from projects.models import Project, Task
        from finance.models import Invoice, Expense
        from notifications.models import Notification
        from django.contrib.auth import get_user_model
        import datetime
        
        User = get_user_model()
        today = timezone.now().date()
        first_day_of_month = today.replace(day=1)

        # CRM Metrics
        total_customers = Customer.objects.count()
        
        # Project Metrics
        active_projects = Project.objects.exclude(status__in=['Completed', 'Cancelled'])
        active_projects_count = active_projects.count()
        
        # Calculate progress for up to 5 most recent active projects
        recent_projects_progress = []
        for project in active_projects.order_by('-updated_at')[:5]:
            total_tasks = project.tasks.count()
            completed_tasks = project.tasks.filter(status='Completed').count()
            progress = int((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0
            
            recent_projects_progress.append({
                'id': project.id,
                'name': project.name,
                'customer': project.customer.name,
                'status': project.status,
                'progress': progress,
                'due_date': project.deadline,
            })
            
        # Finance Metrics
        revenue_this_month = Invoice.objects.filter(
            issue_date__gte=first_day_of_month,
            status__in=['Sent', 'Partial', 'Paid']
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        expenses_this_month = Expense.objects.filter(
            date__gte=first_day_of_month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        ar_invoices = Invoice.objects.exclude(status__in=['Draft', 'Cancelled', 'Paid'])
        outstanding_ar = sum(inv.outstanding_balance for inv in ar_invoices)
        
        # Calculate trailing 6 months revenue for the chart
        revenue_history = []
        for i in range(5, -1, -1):
            m = today.month - i
            y = today.year
            if m <= 0:
                m += 12
                y -= 1
            
            start_date = datetime.date(y, m, 1)
            if m == 12:
                end_date = datetime.date(y+1, 1, 1)
            else:
                end_date = datetime.date(y, m+1, 1)
                
            rev_total = Invoice.objects.filter(
                issue_date__gte=start_date,
                issue_date__lt=end_date,
                status__in=['Sent', 'Partial', 'Paid']
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            revenue_history.append({
                'name': start_date.strftime('%b'),
                'value': float(rev_total)
            })
        
        # System Health & Alerts
        active_users = User.objects.filter(is_active=True).count()
        
        # Get 5 recent unread alerts for this user (or global system alerts if admin)
        recent_alerts = Notification.objects.filter(
            user=request.user, 
            is_read=False
        ).order_by('-created_at')[:5]
        
        alerts_data = [{
            'id': alert.id,
            'title': alert.title,
            'message': alert.message,
            'type': alert.type,
            'time': alert.created_at
        } for alert in recent_alerts]
        
        return Response({
            'crm': {
                'total_customers': total_customers,
            },
            'projects': {
                'active_projects': active_projects_count,
                'recent_progress': recent_projects_progress,
            },
            'finance': {
                'revenue_this_month': float(revenue_this_month),
                'expenses_this_month': float(expenses_this_month),
                'outstanding_ar': float(outstanding_ar),
                'revenue_history': revenue_history,
            },
            'system': {
                'active_users': active_users,
                'status': 'Healthy',
                'alerts': alerts_data
            }
        })
