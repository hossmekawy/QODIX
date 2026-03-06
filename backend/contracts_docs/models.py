from django.db import models
from django.conf import settings
from crm.models import Customer
from projects.models import Project

class DocumentTemplate(models.Model):
    TYPE_CHOICES = (
        ('Contract', 'Contract'),
        ('Proposal', 'Proposal'),
        ('Invoice', 'Invoice'),
        ('Quote', 'Quotation'),
        ('NDA', 'NDA'),
        ('SLA', 'SLA'),
        ('Other', 'Other'),
    )
    LANGUAGE_CHOICES = (
        ('en', 'English'),
        ('ar', 'Arabic'),
    )

    name = models.CharField(max_length=255)
    document_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='Contract')
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='en')
    file = models.FileField(upload_to='templates/documents/')
    variables = models.JSONField(default=list, blank=True, help_text="List of expected variables in the template e.g. ['client_name', 'project_name']")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_document_type_display()} - {self.language})"

class GeneratedDocument(models.Model):
    STATUS_CHOICES = (
        ('Draft', 'Draft'),
        ('Sent', 'Sent'),
        ('Viewed', 'Viewed'),
        ('Signed', 'Signed'),
        ('Expired', 'Expired'),
    )
    
    template = models.ForeignKey(DocumentTemplate, on_delete=models.SET_NULL, null=True, related_name='generated_documents')
    client = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='generated_documents')
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='generated_documents')
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Draft')
    
    file_word = models.FileField(upload_to='documents/word/', blank=True, null=True)
    file_pdf = models.FileField(upload_to='documents/pdf/', blank=True, null=True)
    signed_file = models.FileField(upload_to='documents/signed/', blank=True, null=True)
    
    custom_data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expiry_date = models.DateField(blank=True, null=True)
    sent_at = models.DateTimeField(blank=True, null=True)
    signed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        template_name = self.template.name if self.template else 'Unknown Template'
        return f"Document for {self.client.name} - {template_name}"
