'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import { reviewAPI } from '@/utils/endpoints';
import { fmtDate } from '@/utils/format';
import { FiCheck, FiX, FiStar, FiTrash2 } from 'react-icons/fi';
import { useSocketEvent } from '@/utils/socket';

export default function AdminReviews() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await reviewAPI.getAll({ limit: 500 });
      setRows(r.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useSocketEvent('review:created', load);
  useSocketEvent('review:updated', load);
  useSocketEvent('review:deleted', load);

  const setStatus = async (id, status) => {
    try { await reviewAPI.updateStatus(id, status); load(); toast.success(status); } catch { toast.error('Failed'); }
  };
  const toggleFeatured = async (id) => {
    try { await reviewAPI.toggleFeatured(id); load(); } catch { toast.error('Failed'); }
  };
  const del = async (id) => {
    if (!confirm('Delete this review?')) return;
    try { await reviewAPI.delete(id); load(); } catch { toast.error('Failed'); }
  };

  const columns = [
    { key: 'user', label: 'User', render: (r) => r.userId ? `${r.userId.firstName} ${r.userId.lastName}` : '—', exportValue: (r) => r.userId?.firstName },
    { key: 'product', label: 'Product', render: (r) => r.productId?.name || (r.isStoreReview ? 'Store review' : '—'), exportValue: (r) => r.productId?.name },
    { key: 'rating', label: '★', render: (r) => <span className="text-amber-500 font-bold">{r.rating}</span>, exportValue: (r) => r.rating },
    { key: 'title', label: 'Title', render: (r) => <span className="font-medium text-xs truncate">{r.title}</span>, exportValue: (r) => r.title },
    { key: 'verified', label: 'Verified', render: (r) => r.verified ? '✓' : '—', exportValue: (r) => r.verified },
    { key: 'status', label: 'Status', render: (r) => <span className={`px-2 py-0.5 text-[10px] rounded-full ${r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{r.status}</span>, exportValue: (r) => r.status },
    { key: 'createdAt', label: 'When', render: (r) => fmtDate(r.createdAt), exportValue: (r) => r.createdAt },
    {
      key: 'actions', label: '',
      render: (r) => (
        <div className="flex gap-1">
          {r.status !== 'approved' && (
            <button onClick={(e) => { e.stopPropagation(); setStatus(r._id, 'approved'); }} className="p-1.5 rounded text-emerald-500 hover:bg-emerald-500/10"><FiCheck size={12} /></button>
          )}
          {r.status !== 'rejected' && (
            <button onClick={(e) => { e.stopPropagation(); setStatus(r._id, 'rejected'); }} className="p-1.5 rounded text-amber-500 hover:bg-amber-500/10"><FiX size={12} /></button>
          )}
          <button onClick={(e) => { e.stopPropagation(); toggleFeatured(r._id); }} className={r.isFeatured ? 'p-1.5 rounded text-amber-500' : 'p-1.5 rounded text-slate-400'}><FiStar size={12} fill={r.isFeatured ? 'currentColor' : 'none'} /></button>
          <button onClick={(e) => { e.stopPropagation(); del(r._id); }} className="p-1.5 rounded text-rose-500 hover:bg-rose-500/10"><FiTrash2 size={12} /></button>
        </div>
      ),
      exportValue: () => '',
    },
  ];

  return (
    <AdminLayout title="Reviews">
      <p className="text-xs text-slate-500 mb-4">
        Product reviews are only accepted from verified buyers. Store reviews (homepage) are open to anyone logged in.
      </p>
      <DataTable columns={columns} rows={rows} searchKeys={['title', 'comment']} exportFilename="reviews" emptyMessage={loading ? 'Loading...' : 'No reviews.'} />
    </AdminLayout>
  );
}
