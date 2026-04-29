import threading
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import timedelta
from django.utils import timezone

from .models import (
    SocialAccount, SocialAccountAccessLog, Server, HostedProject,
    ProviderInvoice, Domain, SSLCertificate, APIKey, Prompt, PortLabel
)
from .serializers import (
    SocialAccountSerializer, SocialAccountAccessLogSerializer,
    ServerSerializer, HostedProjectSerializer, ProviderInvoiceSerializer,
    DomainSerializer, SSLCertificateSerializer, APIKeySerializer,
    PromptSerializer, PortLabelSerializer
)
from . import ssh_utils


# ─────────────────────────────────────────────────────
# Social Accounts
# ─────────────────────────────────────────────────────

class SocialAccountViewSet(viewsets.ModelViewSet):
    queryset = SocialAccount.objects.all().order_by('-created_at')
    serializer_class = SocialAccountSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post', 'get'])
    def access_log(self, request, pk=None):
        account = self.get_object()
        if request.method == 'POST':
            log = SocialAccountAccessLog.objects.create(
                social_account=account,
                user=request.user,
                action="Revealed Password"
            )
            return Response(SocialAccountAccessLogSerializer(log).data, status=status.HTTP_201_CREATED)
        logs = account.access_logs.all()
        return Response(SocialAccountAccessLogSerializer(logs, many=True).data)


# ─────────────────────────────────────────────────────
# Servers
# ─────────────────────────────────────────────────────

class ServerViewSet(viewsets.ModelViewSet):
    queryset = Server.objects.all().order_by('-created_at')
    serializer_class = ServerSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def metrics(self, request):
        servers = self.queryset
        total_monthly_cost = sum([s.cost for s in servers if s.billing_cycle == 'Monthly'])
        total_yearly_cost = sum([s.cost for s in servers if s.billing_cycle == 'Yearly'])
        today = timezone.now().date()
        return Response({
            'total_monthly_usd': total_monthly_cost,
            'total_yearly_usd': total_yearly_cost,
            'renewals_within_30_days': servers.filter(
                renewal_date__lte=today + timedelta(days=30), renewal_date__gte=today).count(),
            'renewals_within_15_days': servers.filter(
                renewal_date__lte=today + timedelta(days=15), renewal_date__gte=today).count(),
            'renewals_within_7_days': servers.filter(
                renewal_date__lte=today + timedelta(days=7), renewal_date__gte=today).count(),
            'total_servers': servers.count()
        })

    # ── Port scanning ──────────────────────────────────

    @action(detail=True, methods=['get'], url_path='ports')
    def ports(self, request, pk=None):
        """SSH into this server and return its listening ports merged with saved labels."""
        server = self.get_object()
        result = ssh_utils.scan_ports(server)

        # Merge saved labels into each port entry
        labels = {pl.port: pl for pl in PortLabel.objects.filter(server=server)}
        for p in result.get('ports', []):
            lbl = labels.get(p['port'])
            p['label'] = lbl.label if lbl else ''
            p['notes'] = lbl.notes if lbl else ''
            p['label_id'] = lbl.id if lbl else None

        return Response({
            'server_id': server.id,
            'server_name': server.name,
            'ip_address': str(server.ip_address or ''),
            'ports': result.get('ports', []),
            'cached_at': result.get('cached_at'),
            'error': result.get('error'),
        })

    @action(detail=True, methods=['post'], url_path='ports/refresh')
    def ports_refresh(self, request, pk=None):
        """Force-clear the port cache for this server and re-scan."""
        server = self.get_object()
        ssh_utils.cache_clear_server(server.id)
        result = ssh_utils.scan_ports(server)

        labels = {pl.port: pl for pl in PortLabel.objects.filter(server=server)}
        for p in result.get('ports', []):
            lbl = labels.get(p['port'])
            p['label'] = lbl.label if lbl else ''
            p['notes'] = lbl.notes if lbl else ''
            p['label_id'] = lbl.id if lbl else None

        return Response({
            'server_id': server.id,
            'server_name': server.name,
            'ip_address': str(server.ip_address or ''),
            'ports': result.get('ports', []),
            'cached_at': result.get('cached_at'),
            'error': result.get('error'),
        })

    @action(detail=True, methods=['get', 'put'], url_path=r'ports/(?P<port_num>\d+)/label')
    def port_label(self, request, pk=None, port_num=None):
        """GET or PUT a label/notes for a specific port on this server."""
        server = self.get_object()
        port = int(port_num)

        if request.method == 'GET':
            try:
                lbl = PortLabel.objects.get(server=server, port=port)
                return Response(PortLabelSerializer(lbl).data)
            except PortLabel.DoesNotExist:
                return Response({'server': server.id, 'port': port, 'label': '', 'notes': ''})

        # PUT — upsert
        data = request.data
        lbl, _ = PortLabel.objects.get_or_create(server=server, port=port)
        lbl.label = data.get('label', lbl.label)
        lbl.notes = data.get('notes', lbl.notes)
        lbl.save()
        return Response(PortLabelSerializer(lbl).data)

    # ── Nginx inspection ───────────────────────────────

    @action(detail=True, methods=['get'], url_path='nginx')
    def nginx(self, request, pk=None):
        """SSH into server and return parsed Nginx virtual hosts."""
        server = self.get_object()
        result = ssh_utils.scan_nginx(server)
        return Response({
            'server_id': server.id,
            'server_name': server.name,
            'vhosts': result.get('vhosts', []),
            'cached_at': result.get('cached_at'),
            'error': result.get('error'),
        })

    @action(detail=True, methods=['post'], url_path='nginx/refresh')
    def nginx_refresh(self, request, pk=None):
        """Force-clear nginx cache and re-inspect."""
        server = self.get_object()
        ssh_utils.cache_clear_server(server.id)
        result = ssh_utils.scan_nginx(server)
        return Response({
            'server_id': server.id,
            'server_name': server.name,
            'vhosts': result.get('vhosts', []),
            'cached_at': result.get('cached_at'),
            'error': result.get('error'),
        })


# ─────────────────────────────────────────────────────
# All Ports (across all active servers) — for Port Map page
# ─────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_servers_ports(request):
    """
    Scan all Active servers in parallel and return aggregated port data.
    Query params: ?refresh=1 to force cache clear
    """
    refresh = request.query_params.get('refresh', '0') == '1'
    servers = Server.objects.filter(status='Active')

    results = []
    lock = threading.Lock()

    def scan_one(server):
        if refresh:
            ssh_utils.cache_clear_server(server.id)
        result = ssh_utils.scan_ports(server)
        labels = {pl.port: pl for pl in PortLabel.objects.filter(server=server)}
        for p in result.get('ports', []):
            lbl = labels.get(p['port'])
            p['label'] = lbl.label if lbl else ''
            p['notes'] = lbl.notes if lbl else ''
            p['label_id'] = lbl.id if lbl else None
        entry = {
            'server_id': server.id,
            'server_name': server.name,
            'ip_address': str(server.ip_address or ''),
            'provider': server.provider,
            'ports': result.get('ports', []),
            'cached_at': result.get('cached_at'),
            'error': result.get('error'),
        }
        with lock:
            results.append(entry)

    threads = [threading.Thread(target=scan_one, args=(s,)) for s in servers]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=20)

    results.sort(key=lambda x: x['server_name'])
    return Response(results)


# ─────────────────────────────────────────────────────
# Other ViewSets (unchanged)
# ─────────────────────────────────────────────────────

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
