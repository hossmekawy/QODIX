from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BankAccountViewSet, InvoiceViewSet, ExpenseCategoryViewSet,
    ExpenseViewSet, PaymentViewSet, BudgetViewSet, FinanceDashboardViewSet
)

router = DefaultRouter()
router.register(r'bank-accounts', BankAccountViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'expense-categories', ExpenseCategoryViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'budgets', BudgetViewSet)
router.register(r'dashboard', FinanceDashboardViewSet, basename='finance-dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
