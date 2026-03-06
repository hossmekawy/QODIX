from rest_framework import serializers
from .models import BankAccount, Invoice, InvoiceItem, ExpenseCategory, Expense, Payment, Budget
from projects.models import Project
from crm.models import Customer

class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = '__all__'

class CustomerMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'company_name']

class ProjectMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'status']

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'amount']
        read_only_fields = ['amount']

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    outstanding_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    customer_details = CustomerMinimalSerializer(source='customer', read_only=True)
    project_details = ProjectMinimalSerializer(source='project', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'

class InvoiceCreateUpdateSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['subtotal', 'tax_amount', 'total_amount', 'amount_paid', 'outstanding_balance']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        invoice = Invoice.objects.create(**validated_data)
        
        self._save_items(invoice, items_data)
        self._recalculate_totals(invoice)
        
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if items_data is not None:
            # Simple approach: clear and recreate
            instance.items.all().delete()
            self._save_items(instance, items_data)
            
        self._recalculate_totals(instance)
        
        return instance

    def _save_items(self, invoice, items_data):
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)

    def _recalculate_totals(self, invoice):
        subtotal = sum(item.amount for item in invoice.items.all())
        tax_amount = subtotal * (invoice.tax_rate / 100)
        discount = invoice.discount
        total_amount = subtotal + tax_amount - discount
        
        invoice.subtotal = subtotal
        invoice.tax_amount = tax_amount
        invoice.total_amount = total_amount
        invoice.save()

class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    bank_account_name = serializers.CharField(source='bank_account.name', read_only=True)

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['logged_by']

class PaymentSerializer(serializers.ModelSerializer):
    bank_account_name = serializers.CharField(source='bank_account.name', read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['logged_by']

    def create(self, validated_data):
        payment = super().create(validated_data)
        
        # Deduct from invoice amount_paid
        invoice = payment.invoice
        invoice.amount_paid += payment.amount
        if invoice.amount_paid >= invoice.total_amount:
            invoice.status = 'Paid'
        elif invoice.amount_paid > 0:
            invoice.status = 'Partial'
        invoice.save()

        # Add to bank account
        if payment.bank_account:
            bank_account = payment.bank_account
            bank_account.current_balance += payment.amount
            bank_account.save()
            
        return payment

class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Budget
        fields = '__all__'
