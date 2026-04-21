'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import { brandAPI } from '@/utils/endpoints';
import { useSocketEvent } from '@/utils/socket';
import { FiPlus, FiTrash2, FiStar } from 'react-icons/fi';

export default function AdminBrands() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', logo: '', country: '', description: '', isFeatured: false });

  const load = async () => {
    try {
      const res = await brandAPI.getAll();
      setRows(res.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await brandAPI.create(form);
      toast.success('Brand created');
      setForm({ name: '', logo: '', country: '', description: '', isFeatured: false });
      setShowForm(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const del = async (id) => {
    if (!confirm('Remove this brand?')) return;
    try { await brandAPI.delete(id); toast.success('Removed'); load(); } catch { toast.error('Failed'); }
  };

  const toggleFeatured = async (b) => {
    try { await brandAPI.update(b._id, { isFeatured: !b.isFeatured }); load(); } catch { toast.error('Failed'); }
  };

  const columns = [
    {
      key: 'logo', label: '',
      render: (r) => r.logo ? <img src={r.logo} alt={r.name} className="w-8 h-8 object-contain" /> : <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700" />,
      exportValue: () => '',
    },
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold text-xs">{r.name}</span>, exportValue: (r) => r.name },
    { key: 'country', label: 'Country', render: (r) => r.country || '—', exportValue: (r) => r.country },
    { key: 'productCount', label: 'Products', render: (r) => r.productCount || 0, exportValue: (r) => r.productCount || 0 },
    {
      key: 'isFeatured', label: 'Featured',
      render: (r) => (
        <button onClick={(e) => { e.stopPropagation(); toggleFeatured(r); }} className={r.isFeatured ? 'text-amber-500' : 'text-slate-400'}>
          <FiStar size={14} fill={r.isFeatured ? 'currentColor' : 'none'} />
        </button>
      ),
      exportValue: (r) => (r.isFeatured ? 'yes' : 'no'),
    },
    {
      key: 'actions', label: '',
      render: (r) => (
        <button onClick={(e) => { e.stopPropagation(); del(r._id); }} className="p-1.5 rounded hover:bg-rose-500/10 text-rose-500" title="Remove">
          <FiTrash2 size={12} />
        </button>
      ),
      exportValue: () => '',
    },
  ];

  return (
    <AdminLayout
      title="Brands"
      requiredRoles={['super-admin', 'admin']}
      actions={
        <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-md hover:bg-blue-600">
          <FiPlus size={12} /> New Brand
        </button>
      }
    >
      {showForm && (
        <form onSubmit={create} className="mb-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-3">
          <input required placeholder="Name (e.g., Nike)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <input placeholder="Logo URL" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 md:col-span-2" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 md:col-span-2" />
          <label className="flex items-center gap-2 text-xs md:col-span-2">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured on homepage
          </label>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs rounded-md bg-slate-200 dark:bg-slate-700">Cancel</button>
            <button type="submit" className="px-4 py-1.5 text-xs font-semibold rounded-md bg-blue-500 text-white">Create</button>
          </div>
        </form>
      )}
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['name', 'country']}
        exportFilename="brands"
        emptyMessage={loading ? 'Loading...' : 'No brands yet.'}
      />
    </AdminLayout>
  );
}
