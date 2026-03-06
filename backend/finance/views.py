from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum, Q, Count
from django.utils import timezone
from django.http import HttpResponse
from django.conf import settings
from datetime import timedelta
import datetime
import os

from .utils import render_to_pdf, reshape_arabic
from .models import BankAccount, Invoice, InvoiceItem, ExpenseCategory, Expense, Payment, Budget
from .serializers import (
    BankAccountSerializer, InvoiceSerializer, InvoiceCreateUpdateSerializer,
    ExpenseCategorySerializer, ExpenseSerializer, PaymentSerializer, BudgetSerializer
)

class BankAccountViewSet(viewsets.ModelViewSet):
    queryset = BankAccount.objects.all()
    serializer_class = BankAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_number', 'customer__name', 'project__name']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return InvoiceCreateUpdateSerializer
        return InvoiceSerializer

    @action(detail=False, methods=['get'])
    def summary(self, request):
        total_invoices = Invoice.objects.count()
        total_revenue = Invoice.objects.filter(status='Paid').aggregate(total=Sum('total_amount'))['total'] or 0
        outstanding_revenue = Invoice.objects.filter(Q(status='Sent') | Q(status='Partial') | Q(status='Overdue')).aggregate(
            total=Sum('total_amount') - Sum('amount_paid')
        )['total'] or 0
        
        return Response({
            'total_invoices': total_invoices,
            'total_revenue_paid': total_revenue,
            'outstanding_revenue': outstanding_revenue
        })

    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        invoice = self.get_object()
        
        # Determine language formatting
        lang = request.query_params.get('lang', 'en')
        is_arabic = (lang == 'ar')
        
        # Hardcode dictionary for demonstration or use simple strings
        labels_en = {
            'invoice': 'INVOICE', 'invoice_number': 'Invoice #', 'issue_date': 'Issue Date', 
            'due_date': 'Due Date', 'status': 'Status', 'bill_to': 'Bill To', 
            'project': 'Project', 'description': 'Description', 'qty': 'Qty', 
            'unit_price': 'Unit Price', 'amount': 'Amount', 'no_items': 'No items found', 
            'subtotal': 'Subtotal', 'tax': 'Tax', 'discount': 'Discount', 
            'total': 'Total', 'amount_paid': 'Amount Paid', 'balance_due': 'Balance Due', 
            'notes': 'Notes'
        }
        
        labels_ar = {
            'invoice': 'فاتورة', 'invoice_number': 'رقم الفاتورة', 'issue_date': 'تاريخ الإصدار', 
            'due_date': 'تاريخ الاستحقاق', 'status': 'الحالة', 'bill_to': 'فاتورة إلى', 
            'project': 'المشروع', 'description': 'الوصف', 'qty': 'الكمية', 
            'unit_price': 'سعر الوحدة', 'amount': 'المبلغ', 'no_items': 'لا توجد عناصر', 
            'subtotal': 'المجموع الفرعي', 'tax': 'الضريبة', 'discount': 'الخصم', 
            'total': 'الإجمالي', 'amount_paid': 'المبلغ المدفوع', 'balance_due': 'الرصيد المستحق', 
            'notes': 'ملاحظات'
        }
        
        labels = labels_ar if is_arabic else labels_en
        
        # Reshape labels if arabic to display correctly in PDF
        if is_arabic:
            for k, v in labels.items():
                labels[k] = reshape_arabic(v)
            
            invoice_notes = reshape_arabic(invoice.notes)
            customer_name = reshape_arabic(invoice.customer.name)
            customer_company = reshape_arabic(invoice.customer.company_name)
            customer_address = reshape_arabic(invoice.customer.address)
        else:
            invoice_notes = invoice.notes
            customer_name = invoice.customer.name
            customer_company = invoice.customer.company_name
            customer_address = invoice.customer.address

        # Reshape items descriptions
        items = list(invoice.items.all())
        display_items = []
        for item in items:
            display_items.append({
                'description': reshape_arabic(item.description) if is_arabic else item.description,
                'quantity': item.quantity,
                'unit_price': item.unit_price,
                'amount': item.amount
            })

        context = {
            'invoice': invoice,
            'items': display_items,
            'outstanding_balance': invoice.outstanding_balance,
            'company': {
                'name': reshape_arabic('QODIX PORTAL') if is_arabic else 'QODIX PORTAL',
                'email': 'contact@qodix.ai',
                'phone_number': '+201234567890'
            },
            'lang': lang,
            'is_arabic': is_arabic,
            'title': f"Invoice_{invoice.invoice_number}",
            'labels': labels,
            # We skip local font for now as we don't have the TTF file locally. Let the OS fallback.
        }
        
        # Overwrite Customer details with reshaped ones
        invoice.customer.name = customer_name
        invoice.customer.company_name = customer_company
        invoice.customer.address = customer_address
        invoice.notes = invoice_notes
        if getattr(invoice, 'project', None):
            invoice.project.name = reshape_arabic(invoice.project.name) if is_arabic else invoice.project.name

        pdf_bytes = render_to_pdf('finance/pdf/invoice_pdf.html', context)
        
        if pdf_bytes:
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            filename = f"Invoice_{invoice.invoice_number}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        return Response({'detail': 'Error generating PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        """
        Generates the PDF invoice and sends it as an attachment using the dynamic email backend
        along with the styled HTML template customized for Qodix.
        """
        invoice = self.get_object()
        lang = request.query_params.get('lang', 'en')
        
        # Determine Recipient
        recipient_email = request.data.get('email', invoice.customer.email)
        if not recipient_email:
            return Response({'detail': 'No recipient email provided or linked to customer.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 1. Generate PDF internally
        # We simulate the context logic similar to export_pdf. For brevity, assuming English labels here.
        is_arabic = (lang == 'ar')
        
        labels_en = {
            'invoice': 'INVOICE', 'invoice_number': 'Invoice #', 'issue_date': 'Issue Date', 
            'due_date': 'Due Date', 'status': 'Status', 'bill_to': 'Bill To', 
            'project': 'Project', 'description': 'Description', 'qty': 'Qty', 
            'unit_price': 'Unit Price', 'amount': 'Amount', 'no_items': 'No items found', 
            'subtotal': 'Subtotal', 'tax': 'Tax', 'discount': 'Discount', 
            'total': 'Total', 'amount_paid': 'Amount Paid', 'balance_due': 'Balance Due', 
            'notes': 'Notes'
        }
        
        labels_ar = {
            'invoice': 'فاتورة', 'invoice_number': 'رقم الفاتورة', 'issue_date': 'تاريخ الإصدار', 
            'due_date': 'تاريخ الاستحقاق', 'status': 'الحالة', 'bill_to': 'فاتورة إلى', 
            'project': 'المشروع', 'description': 'الوصف', 'qty': 'الكمية', 
            'unit_price': 'سعر الوحدة', 'amount': 'المبلغ', 'no_items': 'لا توجد عناصر', 
            'subtotal': 'المجموع الفرعي', 'tax': 'الضريبة', 'discount': 'الخصم', 
            'total': 'الإجمالي', 'amount_paid': 'المبلغ المدفوع', 'balance_due': 'الرصيد المستحق', 
            'notes': 'ملاحظات'
        }
        
        labels = labels_ar if is_arabic else labels_en
        
        # Format Arabic if needed
        if is_arabic:
            for k, v in labels.items():
                labels[k] = reshape_arabic(v)
            customer_name_pdf = reshape_arabic(invoice.customer.name)
        else:
            customer_name_pdf = invoice.customer.name

        context_pdf = {
            'invoice': invoice,
            'items': [{'description': reshape_arabic(i.description) if is_arabic else i.description, 'quantity': i.quantity, 'unit_price': i.unit_price, 'amount': i.amount} for i in invoice.items.all()],
            'outstanding_balance': invoice.outstanding_balance,
            'company': {
                'name': reshape_arabic('QODIX PORTAL') if is_arabic else 'QODIX PORTAL',
                'email': 'contact@qodix.ai',
                'phone_number': '+201234567890'
            },
            'lang': lang,
            'is_arabic': is_arabic,
            'title': f"Invoice_{invoice.invoice_number}",
            'labels': labels,
        }
        
        invoice.customer.name = customer_name_pdf
        pdf_bytes = render_to_pdf('finance/pdf/invoice_pdf.html', context_pdf)

        if not pdf_bytes:
             return Response({'detail': 'Failed to generate PDF for attachment.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 2. Build HTML Email
        from django.template.loader import render_to_string
        from django.core.mail import EmailMultiAlternatives
        from core_settings.models import EmailConfiguration
        
        try:
            config = EmailConfiguration.load()
            from_email = config.default_from_email or settings.EMAIL_HOST_USER
        except Exception:
            from_email = settings.EMAIL_HOST_USER
            
        # Revert customer name to original for HTML email (most email clients don't need bidi shaping, just pure utf8)
        invoice.customer.refresh_from_db()
        
        context_html = {
            'invoice_number': invoice.invoice_number,
            'company_name': 'Qodix Portal',
            'customer_name': invoice.customer.name,
            'issue_date': invoice.issue_date,
            'due_date': invoice.due_date,
            'total_amount': invoice.total_amount,
            'currency': invoice.currency,
            'status': invoice.status,
            'portal_url': 'https://qodix.ai/client-portal', # Placeholder
            'current_year': timezone.now().year,
            'company_email': 'contact@qodix.ai'
        }

        html_content = render_to_string('finance/emails/invoice_email.html', context_html)
        text_content = f"Hello {invoice.customer.name},\n\nPlease find your invoice #{invoice.invoice_number} attached.\n\nThank you,\nQodix Team"
        subject = f"Invoice #{invoice.invoice_number} from Qodix Portal"
        
        msg = EmailMultiAlternatives(subject, text_content, from_email, [recipient_email])
        msg.attach_alternative(html_content, "text/html")
        msg.attach(f"Invoice_{invoice.invoice_number}.pdf", pdf_bytes, 'application/pdf')
        
        try:
            msg.send()
            return Response({'detail': f'Invoice sent successfully to {recipient_email}.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all().order_by('name')
    serializer_class = ExpenseCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'vendor', 'category__name']

    def perform_create(self, serializer):
        expense = serializer.save(logged_by=self.request.user)
        # Deduct from bank account
        if expense.bank_account:
            bank_account = expense.bank_account
            bank_account.current_balance -= expense.amount
            bank_account.save()

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-date')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(logged_by=self.request.user)

class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.all().order_by('-year', '-month')
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

class FinanceDashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def overview(self, request):
        today = timezone.now().date()
        first_day_of_month = today.replace(day=1)
        
        # Bank Balances
        bank_balances = BankAccount.objects.aggregate(total=Sum('current_balance'))['total'] or 0
        
        # Income this month
        income_this_month = Payment.objects.filter(date__gte=first_day_of_month).aggregate(total=Sum('amount'))['total'] or 0
        
        # Expenses this month
        expenses_this_month = Expense.objects.filter(date__gte=first_day_of_month).aggregate(total=Sum('amount'))['total'] or 0
        
        # Profit / Loss
        profit_loss = income_this_month - expenses_this_month
        
        # Accounts Receivable (Invoices not fully paid and not draft/cancelled)
        receivables = Invoice.objects.exclude(status__in=['Draft', 'Cancelled', 'Paid']).aggregate(
            total=Sum('total_amount') - Sum('amount_paid')
        )['total'] or 0
        
        # Accounts Payable (If we track bills in future, for now it's zero or based on some metric)
        payables = 0 
        
        # Categorized Expenses for Pie Chart
        expense_breakdown = Expense.objects.filter(date__gte=first_day_of_month).values('category__name').annotate(total=Sum('amount')).order_by('-total')
        
        return Response({
            'bank_balances': bank_balances,
            'income_this_month': income_this_month,
            'expenses_this_month': expenses_this_month,
            'profit_loss': profit_loss,
            'accounts_receivable': receivables,
            'accounts_payable': payables,
            'expense_breakdown': expense_breakdown,
        })

    @action(detail=False, methods=['get'])
    def export(self, request):
        export_format = request.query_params.get('format', 'csv')
        report_type = request.query_params.get('type', 'pnl')
        
        # Only supporting P&L CSV for this task demo length
        if report_type == 'pnl':
            # Income
            incomes = Payment.objects.all().values('date', 'amount', 'invoice__invoice_number')
            # Expenses
            expenses = Expense.objects.all().values('date', 'amount', 'category__name', 'description')
            
            if export_format == 'csv':
                import csv
                response = HttpResponse(content_type='text/csv')
                response['Content-Disposition'] = 'attachment; filename="pnl_report.csv"'
                
                writer = csv.writer(response)
                writer.writerow(['Date', 'Type', 'Category/Invoice', 'Description', 'Amount In', 'Amount Out'])
                
                for inc in incomes:
                    writer.writerow([inc['date'], 'Income', inc['invoice__invoice_number'], 'Payment Received', inc['amount'], ''])
                    
                for exp in expenses:
                    writer.writerow([exp['date'], 'Expense', exp['category__name'], exp['description'], '', exp['amount']])
                    
                return response
                
            elif export_format == 'excel':
                import openpyxl
                from openpyxl.utils import get_column_letter
                
                wb = openpyxl.Workbook()
                ws = wb.active
                ws.title = "P&L Report"
                
                headers = ['Date', 'Type', 'Category/Invoice', 'Description', 'Amount In', 'Amount Out']
                ws.append(headers)
                
                for inc in incomes:
                    ws.append([inc['date'], 'Income', inc['invoice__invoice_number'], 'Payment Received', float(inc['amount']), ''])
                    
                for exp in expenses:
                    ws.append([exp['date'], 'Expense', exp['category__name'], exp['description'], '', float(exp['amount'])])
                    
                response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                response['Content-Disposition'] = 'attachment; filename="pnl_report.xlsx"'
                wb.save(response)
                return response

        return Response({'detail': 'Report type or format not supported yet.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def balance_sheet(self, request):
        # Assets
        bank_accounts = BankAccount.objects.aggregate(total=Sum('current_balance'))['total'] or 0
        accounts_receivable = Invoice.objects.exclude(status__in=['Draft', 'Cancelled', 'Paid']).aggregate(
            total=Sum('total_amount') - Sum('amount_paid')
        )['total'] or 0
        total_assets = bank_accounts + accounts_receivable

        # Liabilities (Currently we only have collected taxes, which are owed to Gov)
        # Note: In a real system you'd track Bills (Accounts Payable).
        total_liabilities = Invoice.objects.filter(status='Paid').aggregate(total=Sum('tax_amount'))['total'] or 0
        
        # Equity = Assets - Liabilities
        equity = total_assets - total_liabilities
        
        return Response({
            'date': timezone.now().date(),
            'assets': {
                'bank_accounts': float(bank_accounts),
                'accounts_receivable': float(accounts_receivable),
                'total': float(total_assets)
            },
            'liabilities': {
                'taxes_payable': float(total_liabilities),
                'total': float(total_liabilities)
            },
            'equity': float(equity)
        })

    @action(detail=False, methods=['get'])
    def cashflow(self, request):
        import datetime
        from django.utils import timezone
        today = timezone.now().date()
        thirty_days_ago = today - datetime.timedelta(days=30)
        
        # Inflows
        inflows = Payment.objects.filter(date__gte=thirty_days_ago).aggregate(total=Sum('amount'))['total'] or 0
        
        # Outflows
        outflows = Expense.objects.filter(date__gte=thirty_days_ago).aggregate(total=Sum('amount'))['total'] or 0
        
        net_cashflow = inflows - outflows
        
        return Response({
            'period': 'Last 30 Days',
            'operating_activities': {
                'cash_in': float(inflows),
                'cash_out': float(outflows)
            },
            'net_cashflow': float(net_cashflow)
        })

    @action(detail=False, methods=['get'])
    def ar_aging(self, request):
        today = timezone.now().date()
        
        unpaid_invoices = Invoice.objects.exclude(status__in=['Draft', 'Cancelled', 'Paid'])
        
        current = 0
        days_1_30 = 0
        days_31_60 = 0
        days_61_90 = 0
        over_90 = 0
        
        for inv in unpaid_invoices:
            balance = inv.outstanding_balance
            if not balance: continue
            
            days_overdue = (today - inv.due_date).days
            
            if days_overdue <= 0:
                current += balance
            elif 1 <= days_overdue <= 30:
                days_1_30 += balance
            elif 31 <= days_overdue <= 60:
                days_31_60 += balance
            elif 61 <= days_overdue <= 90:
                days_61_90 += balance
            else:
                over_90 += balance
                
        return Response({
            'current': float(current),
            'days_1_30': float(days_1_30),
            'days_31_60': float(days_31_60),
            'days_61_90': float(days_61_90),
            'over_90': float(over_90),
            'total': float(current + days_1_30 + days_31_60 + days_61_90 + over_90)
        })

    @action(detail=False, methods=['get'])
    def expense_analysis(self, request):
        expenses = Expense.objects.values('category__name').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        total_expenses = sum(item['total'] for item in expenses if item['total']) or 1 # prevent div by zero
        
        analysis = []
        for item in expenses:
            category_total = item['total'] or 0
            analysis.append({
                'category': item['category__name'] or 'Uncategorized',
                'amount': float(category_total),
                'transaction_count': item['count'],
                'percentage': round(float((category_total / total_expenses) * 100), 2)
            })
            
        return Response({
            'total_expenses': float(total_expenses) if total_expenses != 1 else 0.0,
            'breakdown': analysis
        })

    @action(detail=False, methods=['get'])
    def tax_report(self, request):
        # Taxes Collected on Invoices
        total_tax_collected = Invoice.objects.exclude(status__in=['Draft', 'Cancelled']).aggregate(
            total=Sum('tax_amount')
        )['total'] or 0
        
        # Estimate Taxes Paid on Expenses (assuming flat 14% on all expenses for the sake of simple simulation)
        # In a real app we would have a specific 'tax_paid' field on expenses.
        total_expenses = Expense.objects.aggregate(total=Sum('amount'))['total'] or 0
        estimated_tax_paid = float(total_expenses) * 0.14
        
        net_tax_liability = float(total_tax_collected) - estimated_tax_paid
        
        return Response({
            'tax_collected_from_sales': float(total_tax_collected),
            'estimated_tax_paid_on_purchases': float(estimated_tax_paid),
            'net_tax_liability': float(net_tax_liability)
        })

