import { useState, useCallback } from 'react';
import api from '@/lib/api';

export function useFinance() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardOverview = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/finance/dashboard/overview/');
            return response.data;
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch dashboard overview');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBankAccounts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/finance/bank-accounts/');
            return response.data;
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch bank accounts');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createBankAccount = useCallback(async (data: any) => {
        setLoading(true);
        try {
            const response = await api.post('/finance/bank-accounts/', data);
            return response.data;
        } catch (err: any) {
            setError('Failed to create bank account');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/finance/invoices/');
            return response.data;
        } catch (err: any) {
            setError('Failed to fetch invoices');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createInvoice = useCallback(async (data: any) => {
        setLoading(true);
        try {
            const response = await api.post('/finance/invoices/', data);
            return response.data;
        } catch (err: any) {
            setError('Failed to create invoice');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/finance/expenses/');
            return response.data;
        } catch (err: any) {
            setError('Failed to fetch expenses');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createExpense = useCallback(async (data: any) => {
        setLoading(true);
        try {
            const response = await api.post('/finance/expenses/', data);
            return response.data;
        } catch (err: any) {
            setError('Failed to create expense');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchExpenseCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/finance/expense-categories/');
            return response.data;
        } catch (err: any) {
            setError('Failed to fetch expense categories');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createPayment = useCallback(async (data: any) => {
        setLoading(true);
        try {
            const response = await api.post('/finance/payments/', data);
            return response.data;
        } catch (err: any) {
            setError('Failed to log payment');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAdvancedReport = useCallback(async (reportName: string) => {
        setLoading(true);
        try {
            const response = await api.get(`/finance/dashboard/${reportName}/`);
            return response.data;
        } catch (err: any) {
            setError(`Failed to fetch ${reportName} report`);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        fetchDashboardOverview,
        fetchBankAccounts,
        createBankAccount,
        fetchInvoices,
        createInvoice,
        fetchExpenses,
        createExpense,
        fetchExpenseCategories,
        createPayment,
        fetchAdvancedReport
    };
}
