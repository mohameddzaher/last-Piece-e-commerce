'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import { expenseAPI } from '@/utils/endpoints';
import { useSocketEvent } from '@/utils/socket';
import { fmtMoney, fmtDate } from '@/utils/format';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const CATEGORIES = [
  { value: 'salary-saudi', label: 'Salary — Saudi' },
  { value: 'salary-egypt', label: 'Salary — Egypt' },
  { value: 'rent-egypt', label: 'Rent — Egypt' },
  { value: 'fitout-egypt', label: 'Fit-out — Egypt' },
  { value: 'utilities-egypt', label: 'Utilities — Egypt' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'customs', label: 'Customs' },
  { value: 'bank-fees', label: 'Bank fees' },
  { value: 'shipping-other', label: 'Shipping (other)' },
  { value: 'other', label: 'Other' },
];

export default function AdminExpenses() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: 'marketing', title: '', amount: '', currency: 'EGP',
    isRecurring: false, recurrenceDay: 1, description: '', incurredOn: new Date().toISOString().slice(0, 10),
  });

  const load = async () => {
    try {
      const res = await expenseAPI.getAll({ limit: 500 });
      setRows(res.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useSocketEvent('expense:created', load);
  useSocketEvent('expense:updated', load);
  useSocketEvent('expense:deleted', load);

  const save = async (e) => {
    e.preventDefault();
    try {
      await expenseAPI.create({ ...form, amount: Number(form.amount) });
      toast.success('Expense added');
      setForm({ category: 'marketing', title: '', amount: '', currency: 'EGP', isRecurring: false, recurrenceDay: 1, description: '', incurredOn: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const del = async (id) => {
    if (!confirm('Remove this expense?')) return;
    try { await expenseAPI.delete(id); load(); } catch { toast.error('Failed'); }
  };

  const columns = [
    { key: 'incurredOn', label: 'Date', render: (r) => fmtDate(r.incurredOn), exportValue: (r) => r.incurredOn },
    { key: 'category', label: 'Category', render: (r) => CATEGORIES.find((c) => c.value === r.category)?.label || r.category, exportValue: (r) => r.category },
    { key: 'title', label: 'Title', render: (r) => <span className="font-medium text-xs">{r.title}</span>, exportValue: (r) => r.title },
    { key: 'amount', label: 'Amount', render: (r) => <span className="text-xs font-semibold">{fmtMoney(r.amount, r.currency)}</span>, exportValue: (r) => r.amount },
    { key: 'isRecurring', label: 'Recurring', render: (r) => r.isRecurring ? 'Monthly' : '—', exportValue: (r) => (r.isRecurring ? 'yes' : 'no') },
    {
      key: 'actions', label: '',
      render: (r) => (
        <button onClick={(e) => { e.stopPropagation(); del(r._id); }} className="p-1.5 rounded text-rose-500 hover:bg-rose-500/10">
          <FiTrash2 size={12} />
        </button>
      ),
      exportValue: () => '',
    },
  ];

  return (
    <AdminLayout
      title="Operating Expenses"
      requiredRoles={['super-admin', 'admin']}
      actions={
        <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-md hover:bg-blue-600">
          <FiPlus size={12} /> New Expense
        </button>
      }
    >
      <p className="text-xs text-slate-500 mb-4">
        Overhead only — salaries, rent, marketing. These are NOT added to per-product cost; they're tracked separately in P&L.
      </p>
      {showForm && (
        <form onSubmit={save} className="mb-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 md:col-span-2" />
          <input required type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <option value="EGP">EGP</option>
            <option value="SAR">SAR</option>
            <option value="USD">USD</option>
          </select>
          <input type="date" value={form.incurredOn} onChange={(e) => setForm({ ...form, incurredOn: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <textarea placeholder="Notes (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 md:col-span-3" />
          <label className="flex items-center gap-2 text-xs md:col-span-3">
            <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} /> Recurring monthly
          </label>
          <div className="md:col-span-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs rounded-md bg-slate-200 dark:bg-slate-700">Cancel</button>
            <button type="submit" className="px-4 py-1.5 text-xs font-semibold rounded-md bg-blue-500 text-white">Save</button>
          </div>
        </form>
      )}
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['title', 'category']}
        exportFilename="expenses"
        emptyMessage={loading ? 'Loading...' : 'No expenses yet.'}
      />
    </AdminLayout>
  );
}
