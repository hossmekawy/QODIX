from django.db import models
from django.conf import settings
from crm.models import Customer
from infrastructure.models import Server

# Project Core Models

class Project(models.Model):
    STATUS_CHOICES = (
        ('Lead', 'Lead'),
        ('Proposal', 'Proposal'),
        ('In-Progress', 'In-Progress'),
        ('Testing', 'Testing'),
        ('Completed', 'Completed'),
        ('On-Hold', 'On-Hold'),
        ('Cancelled', 'Cancelled'),
    )
    PRIORITY_CHOICES = (
        ('Critical', 'Critical'),
        ('High', 'High'),
        ('Medium', 'Medium'),
        ('Low', 'Low'),
    )
    TYPE_CHOICES = (
        ('WebApp', 'Web Application'),
        ('Website', 'Website'),
        ('MobileApp', 'Mobile App'),
        ('DesktopApp', 'Desktop App'),
        ('System', 'System Integration'),
        ('Other', 'Other'),
    )

    name = models.CharField(max_length=255)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='projects')
    project_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='WebApp')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Lead')
    
    description = models.TextField(blank=True, null=True)
    scope = models.TextField(blank=True, null=True)
    
    start_date = models.DateField(blank=True, null=True)
    deadline = models.DateField(blank=True, null=True)
    
    budget_quoted = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    budget_actual = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    payment_terms = models.TextField(blank=True, null=True, help_text="Egypt localized milestones/terms")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.customer.name})"

class ProjectTeamMember(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='team_members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='project_assignments')
    role = models.CharField(max_length=100, help_text="e.g. Developer, Designer, QA, Project Manager")
    allocation_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)

    class Meta:
        unique_together = ('project', 'user')

    def __str__(self):
        return f"{self.user.username} - {self.role} on {self.project.name}"

# Task Management Models

class Task(models.Model):
    STATUS_CHOICES = (
        ('To-Do', 'To-Do'),
        ('In-Progress', 'In-Progress'),
        ('Review', 'Review'),
        ('Completed', 'Completed'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='To-Do')
    priority = models.CharField(max_length=20, choices=Project.PRIORITY_CHOICES, default='Medium')
    
    due_date = models.DateField(blank=True, null=True)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    actual_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    
    assignees = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='assigned_tasks', blank=True)
    dependencies = models.ManyToManyField('self', symmetrical=False, related_name='dependent_tasks', blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.project.name[:20]} - {self.title}"

class TaskAttachment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='project_tasks/')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attachment for {self.task.title}"

class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.task.title}"

# Resources & Deliverables

class ProjectDocument(models.Model):
    CATEGORY_CHOICES = (
        ('Requirements', 'Requirements'),
        ('Specs', 'Technical Specifications'),
        ('Design', 'Design Files'),
        ('API', 'API Documentation'),
        ('Manual', 'User Manual'),
        ('Meeting', 'Meeting Notes'),
        ('Other', 'Other'),
    )
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Other')
    file = models.FileField(upload_to='project_documents/', blank=True, null=True)
    url_link = models.URLField(blank=True, null=True, help_text="e.g. Figma or Google Docs link")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Deliverable(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='deliverables')
    title = models.CharField(max_length=255)
    expected_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=50, default='Pending')
    repo_link = models.URLField(blank=True, null=True)
    live_link = models.URLField(blank=True, null=True)
    associated_server = models.ForeignKey(Server, on_delete=models.SET_NULL, blank=True, null=True, related_name='hosted_deliverables')

    def __str__(self):
        return self.title

# QA & Financials

class TestBug(models.Model):
    STATUS_CHOICES = (
        ('Open', 'Open'),
        ('In-Progress', 'In-Progress'),
        ('Resolved', 'Resolved'),
        ('Closed', 'Closed'),
    )
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='bugs')
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Open')
    priority = models.CharField(max_length=20, choices=Project.PRIORITY_CHOICES, default='High')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_bugs')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Bug: {self.title}"

class FinancialPayment(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Paid', 'Paid'),
        ('Overdue', 'Overdue'),
        ('Cancelled', 'Cancelled'),
    )
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='payments')
    title = models.CharField(max_length=255, help_text="e.g. 50% Upfront Milestone")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField()
    received_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')

    def __str__(self):
        return f"{self.title} - {self.amount}"
