'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFinance } from '@/hooks/useFinance';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft } from 'react-icons/fi';
import { useToast } from '@/contexts/ToastContext';
import api from '@/lib/api';
import Link from 'next/link';

export default function CreateInvoicePage() {
    const router = useRouter();
    const { createInvoice } = useFinance();
    const toast = useToast();

    const [customers, setCustomers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        customer: '',
        project: '',
        invoice_number: `INV-${Math.floor(Date.now() / 1000)}`,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: 'EGP',
        tax_rate: 14,
        discount: 0,
        notes: ''
    });

    const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const [custRes, projRes] = await Promise.all([
                    api.get('/crm/customers/'),
                    api.get('/projects/projects/')
                ]);

                // Handle pagination wrapper from Django REST Framework
                const customersData = custRes.data.results ? custRes.data.results : custRes.data;
                const projectsData = projRes.data.results ? projRes.data.results : projRes.data;

                setCustomers(customersData);
                setProjects(projectsData);
            } catch (error) {
                console.error("Failed to load customers or projects", error);
                toast.error("Failed to load necessary data for invoice.");
            } finally {
                setLoadingData(false);
            }
        };
        fetchDependencies();
    }, []);

    const calculateSubtotal = () => {
        return items.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.unit_price)), 0);
    };

    const calculateTotal = () => {
        const sub = calculateSubtotal();
        const discountAmount = Number(formData.discount);
        const afterDiscount = Math.max(sub - discountAmount, 0);
        const taxAmount = afterDiscount * (Number(formData.tax_rate) / 100);
        return afterDiscount + taxAmount;
    };

    const handleAddItem = () => {
        setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: string, value: string | number) => {
        const newItems: any[] = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customer) {
            toast.error("Please select a customer.");
            return;
        }
        if (items.some(i => !i.description || i.unit_price < 0 || i.quantity <= 0)) {
            toast.error("Please fill out all line items correctly.");
            return;
        }

        setSubmitting(true);
        try {
            const payload: any = {
                customer_id: formData.customer,
                invoice_number: formData.invoice_number,
                issue_date: formData.issue_date,
                due_date: formData.due_date,
                currency: formData.currency,
                tax_rate: formData.tax_rate,
                discount: formData.discount,
                notes: formData.notes,
                items: items
            };
            if (formData.project) {
                payload.project_id = formData.project;
            }

            await createInvoice(payload);
            toast.success("Invoice created successfully!");
            router.push('/dashboard/finance/invoices');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Failed to create invoice.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingData) {
        return <div className="text-center py-20 text-gray-500">Loading form builder...</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/finance/invoices" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors">
                    <FiArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Invoice</h1>
                    <p className="text-gray-400 mt-1">Draft a new professional invoice for a client</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Header Information Box */}
                <div className="bg-[#070308] border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Client & Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Customer <span className="text-red-500">*</span></label>
                            <select
                                required
                                value={formData.customer}
                                onChange={e => setFormData({ ...formData, customer: e.target.value })}
                                className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="" disabled>Select a Customer...</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.company || 'Individual'})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Currency</label>
                            <select
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="EGP">EGP - Egyptian Pound</option>
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Invoice Number</label>
                            <input
                                required type="text"
                                value={formData.invoice_number}
                                onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                                className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono text-sm tracking-wider"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Issue Date</label>
                            <input
                                required type="date"
                                value={formData.issue_date}
                                onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                                className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Due Date</label>
                            <input
                                required type="date"
                                value={formData.due_date}
                                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Link to Project (Optional)</label>
                            <select
                                value={formData.project}
                                onChange={e => setFormData({ ...formData, project: e.target.value })}
                                className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">No Project Linked</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                    </div>
                </div>

                {/* Line Items Box */}
                <div className="bg-[#070308] border border-white/10 rounded-2xl p-6 shadow-xl overflow-hidden">
                    <h2 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Line Items</h2>

                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-[#110915] p-4 rounded-xl border border-white/5">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Description</label>
                                    <input
                                        required type="text"
                                        value={item.description}
                                        onChange={e => handleItemChange(index, 'description', e.target.value)}
                                        placeholder="Service or product name..."
                                        className="w-full bg-transparent border-b border-white/10 px-2 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-white/20"
                                    />
                                </div>
                                <div className="w-full md:w-24">
                                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Qty</label>
                                    <input
                                        required type="number" min="1" step="0.01"
                                        value={item.quantity}
                                        onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                        className="w-full bg-transparent border-b border-white/10 px-2 py-2 text-white focus:outline-none focus:border-blue-500 text-center"
                                    />
                                </div>
                                <div className="w-full md:w-32">
                                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Price</label>
                                    <input
                                        required type="number" min="0" step="0.01"
                                        value={item.unit_price}
                                        onChange={e => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                        className="w-full bg-transparent border-b border-white/10 px-2 py-2 text-white focus:outline-none focus:border-blue-500 text-right"
                                    />
                                </div>
                                <div className="w-full md:w-32 text-right pt-6">
                                    <span className="text-blue-400 font-bold">{(item.quantity * item.unit_price).toFixed(2)}</span>
                                </div>
                                <div className="pt-6">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        disabled={items.length === 1}
                                        className="p-2 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium text-sm px-4 py-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                            <FiPlus /> Add Another Item
                        </button>
                    </div>

                </div>

                {/* Calculations Box */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#070308] border border-white/10 rounded-2xl p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Terms & Notes</h2>
                        <div>
                            <textarea
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 min-h-[140px]"
                                placeholder="Payment instructions, bank details, or extra notes to display on the invoice..."
                            />
                        </div>
                    </div>

                    <div className="bg-[#110915] border border-blue-500/30 rounded-2xl p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Summary</h2>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center text-gray-400">
                                <span>Subtotal</span>
                                <span>{calculateSubtotal().toFixed(2)} {formData.currency}</span>
                            </div>

                            <div className="flex justify-between items-center text-gray-400 group relative">
                                <span className="flex items-center gap-2">
                                    Discount Amount
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-white">-</span>
                                    <input
                                        type="number" min="0" step="0.01"
                                        value={formData.discount}
                                        onChange={e => setFormData({ ...formData, discount: e.target.value ? parseFloat(e.target.value) : 0 })}
                                        className="w-24 bg-transparent border-b border-white/20 text-right px-1 focus:outline-none focus:border-blue-500 text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-gray-400">
                                <span>Tax Range (%)</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number" min="0" step="0.1"
                                        value={formData.tax_rate}
                                        onChange={e => setFormData({ ...formData, tax_rate: e.target.value ? parseFloat(e.target.value) : 0 })}
                                        className="w-16 bg-transparent border-b border-white/20 text-right px-1 focus:outline-none focus:border-blue-500 text-white"
                                    />
                                    <span>%</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                <span className="text-lg font-bold text-white">Total Amount</span>
                                <span className="text-3xl font-black text-[#C1FF72] tracking-tight">{calculateTotal().toFixed(2)} <span className="text-base text-gray-400 font-medium">{formData.currency}</span></span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex justify-center items-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all disabled:opacity-50"
                            >
                                <FiSave className="w-5 h-5" />
                                {submitting ? 'Creating Invoice...' : 'Save & Publish Invoice'}
                            </button>
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
}
