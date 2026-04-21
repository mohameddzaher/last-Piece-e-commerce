'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import { promoCodeAPI } from '@/utils/endpoints';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { fmtDate, fmtMoney } from '@/utils/format';

export default function AdminPromoCodes() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '', description: '', type: 'percent', value: 10,
    minOrderAmount: 0, maxDiscountAmount: '', usageLimit: 0, usageLimitPerUser: 1,
    startsAt: '', expiresAt: '', isActive: true,
  });

  const load = async () => {
    try { const r = await promoCodeAPI.getAll(); setRows(r.data.data || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await promoCodeAPI.create({
        ...form,
        code: form.code.toUpperCase(),
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
      });
      toast.success('Created');
      setShowForm(false);
      setForm({ code: '', description: '', type: 'percent', value: 10, minOrderAmount: 0, maxDiscountAmount: '', usageLimit: 0, usageLimitPerUser: 1, startsAt: '', expiresAt: '', isActive: true });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const del = async (id) => {
    if (!confirm('Remove this code?')) return;
    try { await promoCodeAPI.delete(id); load(); } catch { toast.error('Failed'); }
  };

  const toggle = async (p) => {
    try { await promoCodeAPI.update(p._id, { isActive: !p.isActive }); load(); } catch { toast.error('Failed'); }
  };

  const columns = [
    { key: 'code', label: 'Code', render: (r) => <span className="font-mono text-xs font-bold">{r.code}</span>, exportValue: (r) => r.code },
    { key: 'description', label: 'Description', render: (r) => r.description, exportValue: (r) => r.description },
    {
      key: 'value', label: 'Value',
      render: (r) => r.type === 'percent' ? `${r.value}%` : r.type === 'fixed' ? fmtMoney(r.value, r.currency) : 'Free shipping',
      exportValue: (r) => r.value,
    },
    { key: 'usedCount', label: 'Used', render: (r) => `${r.usedCount} / ${r.usageLimit || '∞'}`, exportValue: (r) => r.usedCount },
    { key: 'expiresAt', label: 'Expires', render: (r) => fmtDate(r.expiresAt), exportValue: (r) => r.expiresAt },
    {
      key: 'isActive', label: 'Status',
      render: (r) => (
        <button onClick={(e) => { e.stopPropagation(); toggle(r); }} className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${r.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'}`}>
          {r.isActive ? 'Active' : 'Paused'}
        </button>
      ),
      exportValue: (r) => (r.isActive ? 'active' : 'paused'),
    },
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
      title="Promo Codes"
      requiredRoles={['super-admin', 'admin']}
      actions={
        <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-md hover:bg-blue-600">
          <FiPlus size={12} /> New Code
        </button>
      }
    >
      {showForm && (
        <form onSubmit={save} className="mb-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3">
          <input required placeholder="CODE (e.g., WELCOME10)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono uppercase" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <option value="percent">Percentage</option>
            <option value="fixed">Fixed amount</option>
            <option value="free-shipping">Free shipping</option>
          </select>
          <input required type="number" placeholder="Value" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 md:col-span-3" />
          <input type="number" placeholder="Min order amount" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <input type="number" placeholder="Max discount (cap)" value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <input type="number" placeholder="Usage limit (0 = unlimited)" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <div className="md:col-span-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs rounded-md bg-slate-200 dark:bg-slate-700">Cancel</button>
            <button type="submit" className="px-4 py-1.5 text-xs font-semibold rounded-md bg-blue-500 text-white">Save</button>
          </div>
        </form>
      )}
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['code', 'description']}
        exportFilename="promo-codes"
        emptyMessage={loading ? 'Loading...' : 'No codes yet.'}
      />
    </AdminLayout>
  );
}
