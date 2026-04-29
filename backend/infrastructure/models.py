from django.db import models
from django.conf import settings

class SocialAccount(models.Model):
    platform = models.CharField(max_length=50) # e.g. Facebook, Instagram, X
    username = models.CharField(max_length=150)
    email = models.EmailField(blank=True, null=True)
    password = models.CharField(max_length=255) # We will store this securely in production, but for now CharField as requested
    login_url = models.URLField(blank=True, null=True)
    last_password_change = models.DateTimeField(blank=True, null=True)
    recovery_email = models.EmailField(blank=True, null=True)
    recovery_phone = models.CharField(max_length=50, blank=True, null=True)
    security_questions = models.TextField(blank=True, null=True, help_text="List of security questions and answers")
    shared_with = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='shared_social_accounts', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.platform} - {self.username}"

class SocialAccountAccessLog(models.Model):
    social_account = models.ForeignKey(SocialAccount, on_delete=models.CASCADE, related_name='access_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='social_access_logs')
    accessed_at = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=255, default='Viewed Password')

    class Meta:
        ordering = ['-accessed_at']

    def __str__(self):
        return f"{self.user.username} accessed {self.social_account.platform} at {self.accessed_at}"

class Server(models.Model):
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Suspended', 'Suspended'),
        ('Cancelled', 'Cancelled'),
    )
    BILLING_CHOICES = (
        ('Monthly', 'Monthly'),
        ('Yearly', 'Yearly'),
    )

    name = models.CharField(max_length=150)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    server_type = models.CharField(max_length=100, help_text="VPS, Dedicated, Cloud, etc.")
    provider = models.CharField(max_length=150, help_text="e.g. Contabo, AWS, DigitalOcean")
    portal_url = models.URLField(blank=True, null=True)
    storage = models.CharField(max_length=100, help_text="e.g. 400GB NVMe")
    ram = models.CharField(max_length=100, help_text="e.g. 16GB")
    bandwidth = models.CharField(max_length=100, help_text="e.g. 32TB Outgoing")
    location = models.CharField(max_length=150, blank=True, null=True, help_text="Data Center Location")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Active')
    payment_method = models.CharField(max_length=100, blank=True, null=True)
    ssh_details = models.TextField(blank=True, null=True, help_text="IP, Port, Username, special instructions")
    purchase_date = models.DateField(blank=True, null=True)
    renewal_date = models.DateField(blank=True, null=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, help_text="Cost in USD")
    billing_cycle = models.CharField(max_length=50, choices=BILLING_CHOICES, default='Monthly')
    auto_renewal = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.ip_address})"

class HostedProject(models.Model):
    server = models.ForeignKey(Server, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=150)
    storage_usage = models.CharField(max_length=50, blank=True, null=True)
    bandwidth_usage = models.CharField(max_length=50, blank=True, null=True)
    database_count = models.IntegerField(default=0)
    database_size = models.CharField(max_length=50, blank=True, null=True)
    ports_used = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} on {self.server.name}"

class ProviderInvoice(models.Model):
    server = models.ForeignKey(Server, on_delete=models.CASCADE, related_name='invoices')
    invoice_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    file = models.FileField(upload_to='server_invoices/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice for {self.server.name} on {self.invoice_date}"

class Domain(models.Model):
    name = models.CharField(max_length=255, unique=True)
    registrar = models.CharField(max_length=150)
    registration_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    auto_renewal = models.BooleanField(default=True)
    nameservers = models.TextField(blank=True, null=True)
    dns_records = models.TextField(blank=True, null=True)
    whois_info = models.TextField(blank=True, null=True)
    transfer_lock = models.BooleanField(default=True)
    linked_project = models.ForeignKey(HostedProject, on_delete=models.SET_NULL, related_name='domains', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class SSLCertificate(models.Model):
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE, related_name='ssl_certificates')
    cert_type = models.CharField(max_length=100, default="Let's Encrypt")
    installation_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    domains_covered = models.TextField(blank=True, null=True, help_text="e.g. example.com, *.example.com")
    renewal_process = models.CharField(max_length=50, choices=(('Auto', 'Auto'), ('Manual', 'Manual')), default='Auto')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"SSL for {self.domain.name}"

class APIKey(models.Model):
    provider_name = models.CharField(max_length=150, help_text="e.g. Gemini, OpenAI, Stripe")
    api_key = models.CharField(max_length=1000)
    secret_key = models.CharField(max_length=1000, blank=True, null=True)
    endpoint_url = models.URLField(blank=True, null=True)
    associated_project = models.ForeignKey(HostedProject, on_delete=models.SET_NULL, related_name='api_keys', blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.provider_name

class Prompt(models.Model):
    title = models.CharField(max_length=255, help_text="e.g. Prompt for making documentation")
    content = models.TextField(help_text="The actual prompt text")
    category = models.CharField(max_length=150, blank=True, null=True, help_text="e.g. Coding, Marketing, Writing")
    notes = models.TextField(blank=True, null=True, help_text="Any additional context or instructions")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class PortLabel(models.Model):
    """Stores user-defined labels and notes for specific ports on a server."""
    server = models.ForeignKey(Server, on_delete=models.CASCADE, related_name='port_labels')
    port = models.IntegerField()
    label = models.CharField(max_length=100, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('server', 'port')
        ordering = ['port']

    def __str__(self):
        return f"Port {self.port} on {self.server.name} — {self.label or 'unlabeled'}"
