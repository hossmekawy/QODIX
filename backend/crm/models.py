from django.db import models
from django.conf import settings

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=20, default="#721C97") # Default to QODIX purple

    def __str__(self):
        return self.name

class Customer(models.Model):
    name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    industry = models.CharField(max_length=100)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    last_contact_date = models.DateField(blank=True, null=True)
    next_followup_date = models.DateField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='customers')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.company_name})" if self.company_name else self.name

class Interaction(models.Model):
    INTERACTION_TYPES = [
        ('Call', 'Call'),
        ('Email', 'Email'),
        ('Meeting', 'Meeting'),
        ('Note', 'Note'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='interactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='logged_interactions')
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPES, default='Note')
    notes = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    next_followup_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.interaction_type} with {self.customer.name} on {self.date.date()}"

class CustomerAttachment(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='customer_attachments/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Attachment for {self.customer.name}"
