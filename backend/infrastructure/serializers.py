from rest_framework import serializers
from .models import SocialAccount, SocialAccountAccessLog, Server, HostedProject, ProviderInvoice, Domain, SSLCertificate, APIKey, Prompt, PortLabel
from accounts.serializers import UserSerializer

class SocialAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialAccount
        fields = '__all__'

class SocialAccountAccessLogSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = SocialAccountAccessLog
        fields = ['id', 'user', 'user_details', 'accessed_at', 'action', 'social_account']

class HostedProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostedProject
        fields = '__all__'

class ProviderInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderInvoice
        fields = '__all__'

class ServerSerializer(serializers.ModelSerializer):
    projects = HostedProjectSerializer(many=True, read_only=True)
    invoices = ProviderInvoiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Server
        fields = '__all__'

class SSLCertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SSLCertificate
        fields = '__all__'

class DomainSerializer(serializers.ModelSerializer):
    ssl_certificates = SSLCertificateSerializer(many=True, read_only=True)
    
    class Meta:
        model = Domain
        fields = '__all__'

class APIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        fields = '__all__'

class PromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prompt
        fields = '__all__'


class PortLabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortLabel
        fields = ['id', 'server', 'port', 'label', 'notes', 'created_at', 'updated_at']
