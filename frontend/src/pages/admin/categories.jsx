'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import { categoryAPI } from '@/utils/endpoints';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function AdminCategories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', image: '', parent: '', order: 0 });

  const load = async () => {
    try {
      const res = await categoryAPI.getAll();
      setRows(res.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await categoryAPI.create({ ...form, slug: form.name.toLowerCase().replace(/\s+/g, '-'), parent: form.parent || undefined });
      toast.success('Created');
      setShowForm(false);
      setForm({ name: '', description: '', image: '', parent: '', order: 0 });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const del = async (id) => {
    if (!confirm('Delete category?')) return;
    try { await categoryAPI.delete(id); load(); } catch { toast.error('Failed'); }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold text-xs">{r.name}</span>, exportValue: (r) => r.name },
    { key: 'slug', label: 'Slug', render: (r) => <code className="text-[10px]">{r.slug}</code>, exportValue: (r) => r.slug },
    { key: 'productCount', label: 'Products', accessor: (r) => r.productCount || 0 },
    { key: 'order', label: 'Order', accessor: (r) => r.order },
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
      title="Categories"
      actions={
        <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-md">
          <FiPlus size={12} /> New
        </button>
      }
    >
      {showForm && (
        <form onSubmit={save} className="mb-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-3">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <input placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <select value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <option value="">Parent (optional)</option>
            {rows.filter((r) => !r.parent).map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
          <input type="number" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 md:col-span-2" />
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs rounded-md bg-slate-200 dark:bg-slate-700">Cancel</button>
            <button type="submit" className="px-4 py-1.5 text-xs font-semibold rounded-md bg-blue-500 text-white">Save</button>
          </div>
        </form>
      )}
      <DataTable columns={columns} rows={rows} searchKeys={['name', 'slug']} exportFilename="categories" emptyMessage={loading ? 'Loading...' : 'No categories.'} />
    </AdminLayout>
  );
}
