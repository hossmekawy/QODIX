from django.db import models
from django.conf import settings


class Plan(models.Model):
    TYPE_CHOICES = (
        ('Quarterly', 'Quarterly'),
        ('Annual', 'Annual'),
        ('ProductLaunch', 'Product Launch'),
        ('MarketExpansion', 'Market Expansion'),
        ('Custom', 'Custom'),
    )
    CATEGORY_CHOICES = (
        ('Marketing', 'Marketing'),
        ('Product', 'Product/Service Development'),
        ('MarketExpansion', 'Market Expansion'),
        ('Risk', 'Risk Management'),
        ('Resource', 'Resource Planning'),
        ('General', 'General'),
    )
    STATUS_CHOICES = (
        ('Planning', 'Planning'),
        ('InProgress', 'In Progress'),
        ('Completed', 'Completed'),
        ('OnHold', 'On Hold'),
    )

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    plan_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='Annual')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='General')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Planning')
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='owned_plans')
    board_state = models.JSONField(default=dict, blank=True, help_text="Stores tldraw canvas JSON state")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.plan_type})"

    class Meta:
        ordering = ['-created_at']


class PlanItem(models.Model):
    ITEM_TYPE_CHOICES = (
        # Marketing
        ('campaign', 'Campaign'),
        ('content', 'Content'),
        ('social', 'Social Media'),
        ('ad_budget', 'Advertising Budget'),
        ('lead_target', 'Lead Generation Target'),
        # Product
        ('service', 'New Service/Product'),
        ('feature', 'Feature'),
        ('tech', 'Technology Upgrade'),
        ('training', 'Training'),
        # Market
        ('industry', 'Target Industry'),
        ('geo', 'Geographic Expansion'),
        ('partnership', 'Partnership'),
        ('competitor', 'Competitor Analysis'),
        # Risk
        ('risk', 'Identified Risk'),
        ('mitigation', 'Mitigation Strategy'),
        ('contingency', 'Contingency Plan'),
        # Resource
        ('hire', 'Hire'),
        ('equipment', 'Equipment/Software'),
        ('office', 'Office Expansion'),
        ('budget', 'Budget Allocation'),
        # General
        ('goal', 'Goal'),
        ('milestone', 'Milestone'),
        ('other', 'Other'),
    )
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('InProgress', 'In Progress'),
        ('Done', 'Done'),
        ('Blocked', 'Blocked'),
    )

    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='items')
    item_type = models.CharField(max_length=50, choices=ITEM_TYPE_CHOICES, default='goal')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    due_date = models.DateField(blank=True, null=True)
    value = models.CharField(max_length=255, blank=True, null=True, help_text="Numeric target, budget amount, etc.")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_item_type_display()} - {self.title}"

    class Meta:
        ordering = ['created_at']
