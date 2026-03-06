from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from .models import Tag, Customer, CustomerAttachment, Interaction
from .serializers import TagSerializer, CustomerSerializer, CustomerAttachmentSerializer, InteractionSerializer
from django.core.exceptions import ValidationError
from notifications.models import Notification
import csv
from django.http import HttpResponse
import openpyxl

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

class CustomerPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().prefetch_related('tags', 'attachments', 'interactions').order_by('-id')
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomerPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(company_name__icontains=search) | 
                Q(email__icontains=search) |
                Q(industry__icontains=search)
            )
            
        industry = self.request.query_params.get('industry', None)
        if industry:
            queryset = queryset.filter(industry__iexact=industry)
            
        tags = self.request.query_params.get('tags', None)
        if tags:
            tag_ids = [int(t) for t in tags.split(',') if t.isdigit()]
            for tag_id in tag_ids:
                queryset = queryset.filter(tags__id=tag_id)
                
        start_date = self.request.query_params.get('start_date', None)
        if start_date:
            queryset = queryset.filter(last_contact_date__gte=start_date)
            
        end_date = self.request.query_params.get('end_date', None)
        if end_date:
            queryset = queryset.filter(last_contact_date__lte=end_date)
            
        return queryset.distinct()

    @action(detail=True, methods=['post'], url_path='attachments')
    def upload_attachment(self, request, pk=None):
        customer = self.get_object()
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce max 20 files
        if customer.attachments.count() >= 20:
            return Response({'error': 'Maximum of 20 attachments allowed per customer.'}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce max 5MB (5 * 1024 * 1024 bytes)
        if file_obj.size > 5242880:
            return Response({'error': 'File size exceeds the 5MB limit.'}, status=status.HTTP_400_BAD_REQUEST)

        attachment = CustomerAttachment.objects.create(customer=customer, file=file_obj)
        serializer = CustomerAttachmentSerializer(attachment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='attachments/(?P<attachment_id>\d+)')
    def delete_attachment(self, request, pk=None, attachment_id=None):
        customer = self.get_object()
        try:
            attachment = customer.attachments.get(id=attachment_id)
            # Delete file from storage
            attachment.file.delete()
            attachment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CustomerAttachment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='export/csv')
    def export_csv(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="customers.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Name', 'Company', 'Industry', 'Email', 'Phone', 'Last Contact', 'Next Follow-up'])

        for customer in self.filter_queryset(self.get_queryset()):
            writer.writerow([
                customer.id, customer.name, customer.company_name, customer.industry,
                customer.email, customer.phone, customer.last_contact_date, customer.next_followup_date
            ])

        return response

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="customers.xlsx"'

        workbook = openpyxl.Workbook()
        worksheet = workbook.active
        worksheet.title = 'Customers'

        columns = ['ID', 'Name', 'Company', 'Industry', 'Email', 'Phone', 'Last Contact', 'Next Follow-up']
        worksheet.append(columns)

        for customer in self.filter_queryset(self.get_queryset()):
            worksheet.append([
                customer.id, customer.name, customer.company_name, customer.industry,
                customer.email, customer.phone, str(customer.last_contact_date) if customer.last_contact_date else '', 
                str(customer.next_followup_date) if customer.next_followup_date else ''
            ])

        workbook.save(response)
        return response

class InteractionViewSet(viewsets.ModelViewSet):
    queryset = Interaction.objects.all()
    serializer_class = InteractionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            return Interaction.objects.filter(customer_id=customer_id).order_by('-date')
        return Interaction.objects.all().order_by('-date')

    def perform_create(self, serializer):
        customer_id = self.request.data.get('customer')
        interaction = serializer.save(user=self.request.user, customer_id=customer_id)
        
        # Automatically update the Customer's follow-up/last contact dates
        customer = interaction.customer
        customer.last_contact_date = interaction.date.date()
        if interaction.next_followup_date:
            customer.next_followup_date = interaction.next_followup_date
        customer.save()
        
        # Automatically generate a Notification if there's a next follow up date
        if interaction.next_followup_date:
            Notification.objects.create(
                user=self.request.user,
                title=f"Follow-up Reminder: {customer.name}",
                message=f"You have a scheduled {interaction.interaction_type} follow-up with {customer.name} ({customer.company_name}). Notes: {interaction.notes[:50] + '...' if len(interaction.notes) > 50 else interaction.notes}",
                type='Reminder',
                link=f'/dashboard/crm/{customer.id}'
            )
