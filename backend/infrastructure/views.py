from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import SocialAccount, SocialAccountAccessLog, Server, HostedProject, ProviderInvoice, Domain, SSLCertificate, APIKey, Prompt
from .serializers import (
    SocialAccountSerializer, SocialAccountAccessLogSerializer,
    ServerSerializer, HostedProjectSerializer, ProviderInvoiceSerializer,
    DomainSerializer, SSLCertificateSerializer, APIKeySerializer, PromptSerializer
)
from datetime import timedelta
from django.utils import timezone

class SocialAccountViewSet(viewsets.ModelViewSet):
    queryset = SocialAccount.objects.all().order_by('-created_at')
    serializer_class = SocialAccountSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post', 'get'])
    def access_log(self, request, pk=None):
        account = self.get_object()
        
        if request.method == 'POST':
            # Create a log entry indicating the user viewed the password
            log = SocialAccountAccessLog.objects.create(
                social_account=account,
                user=request.user,
                action="Revealed Password"
            )
            serializer = SocialAccountAccessLogSerializer(log)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        elif request.method == 'GET':
            # Get the access history
            logs = account.access_logs.all()
            serializer = SocialAccountAccessLogSerializer(logs, many=True)
            return Response(serializer.data)

class ServerViewSet(viewsets.ModelViewSet):
    queryset = Server.objects.all().order_by('-created_at')
    serializer_class = ServerSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def metrics(self, request):
        # Calculate cost and renewal metrics across all servers
        servers = self.queryset
        total_monthly_cost = sum([s.cost for s in servers if s.billing_cycle == 'Monthly'])
        total_yearly_cost = sum([s.cost for s in servers if s.billing_cycle == 'Yearly'])
        
        today = timezone.now().date()
        renewals_30 = servers.filter(renewal_date__lte=today + timedelta(days=30), renewal_date__gte=today).count()
        renewals_15 = servers.filter(renewal_date__lte=today + timedelta(days=15), renewal_date__gte=today).count()
        renewals_7 = servers.filter(renewal_date__lte=today + timedelta(days=7), renewal_date__gte=today).count()
        
        return Response({
            'total_monthly_usd': total_monthly_cost,
            'total_yearly_usd': total_yearly_cost,
            'renewals_within_30_days': renewals_30,
            'renewals_within_15_days': renewals_15,
            'renewals_within_7_days': renewals_7,
            'total_servers': servers.count()
        })

class HostedProjectViewSet(viewsets.ModelViewSet):
    queryset = HostedProject.objects.all().order_by('-created_at')
    serializer_class = HostedProjectSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['server']

class ProviderInvoiceViewSet(viewsets.ModelViewSet):
    queryset = ProviderInvoice.objects.all().order_by('-invoice_date')
    serializer_class = ProviderInvoiceSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['server']

class DomainViewSet(viewsets.ModelViewSet):
    queryset = Domain.objects.all().order_by('-created_at')
    serializer_class = DomainSerializer
    permission_classes = [IsAuthenticated]

class SSLCertificateViewSet(viewsets.ModelViewSet):
    queryset = SSLCertificate.objects.all().order_by('-created_at')
    serializer_class = SSLCertificateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['domain']

class APIKeyViewSet(viewsets.ModelViewSet):
    queryset = APIKey.objects.all().order_by('-created_at')
    serializer_class = APIKeySerializer
    permission_classes = [IsAuthenticated]

class PromptViewSet(viewsets.ModelViewSet):
    queryset = Prompt.objects.all().order_by('-created_at')
    serializer_class = PromptSerializer
    permission_classes = [IsAuthenticated]
