'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import { productAPI } from '@/utils/endpoints';
import { useSocketEvent } from '@/utils/socket';
import { fmtMoney, fmtDate, locationLabel, locationColor } from '@/utils/format';
import { useAuthStore } from '@/store';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function AdminProducts() {
  const { user } = useAuthStore();
  const role = user?.role;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await productAPI.getAll({ limit: 1000 });
      setRows(res.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useSocketEvent('product:created', load);
  useSocketEvent('product:updated', load);
  useSocketEvent('product:deleted', load);

  const del = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await productAPI.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const isSuper = role === 'super-admin' || role === 'admin';

  const columns = [
    {
      key: 'image', label: '',
      render: (r) => (
        <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
          {r.thumbnail ? <Image src={r.thumbnail} alt={r.name} fill className="object-cover" sizes="40px" /> : null}
        </div>
      ),
      exportValue: () => '',
    },
    {
      key: 'name', label: 'Product',
      render: (r) => (
        <div className="min-w-[200px]">
          <div className="font-semibold text-xs">{r.name}</div>
          <div className="text-[10px] text-slate-500">{r.brand || r.brandRef?.name || ''}</div>
        </div>
      ),
      exportValue: (r) => r.name,
    },
    { key: 'sku', label: 'SKU', accessor: (r) => r.sku },
    {
      key: 'location', label: 'Stage',
      render: (r) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${locationColor(r.location)}`}>
          {locationLabel(r.location)}
        </span>
      ),
      exportValue: (r) => r.location,
    },
    {
      key: 'status', label: 'Status',
      render: (r) => (
        <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
          r.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'
        }`}>{r.status}</span>
      ),
      exportValue: (r) => r.status,
    },
    {
      key: 'onlinePrice', label: 'Online',
      render: (r) => r.onlinePrice > 0 ? <span className="text-xs">{fmtMoney(r.onlinePrice, r.sellingCurrency)}</span> : '—',
      exportValue: (r) => r.onlinePrice,
    },
    {
      key: 'offlinePrice', label: 'Boutique',
      render: (r) => r.offlinePrice > 0 ? <span className="text-xs">{fmtMoney(r.offlinePrice, r.sellingCurrency)}</span> : '—',
      exportValue: (r) => r.offlinePrice,
    },
    { key: 'createdAt', label: 'Added', render: (r) => fmtDate(r.createdAt), exportValue: (r) => r.createdAt },
    {
      key: 'actions', label: '',
      render: (r) => (
        <div className="flex gap-1">
          <Link href={`/admin/products/${r._id}`} onClick={(e) => e.stopPropagation()} className="text-[10px] text-blue-500 hover:text-blue-600 font-semibold px-2">Edit</Link>
          {isSuper && (
            <button onClick={(e) => { e.stopPropagation(); del(r._id); }} className="p-1.5 rounded text-rose-500 hover:bg-rose-500/10">
              <FiTrash2 size={12} />
            </button>
          )}
        </div>
      ),
      exportValue: () => '',
    },
  ];

  return (
    <AdminLayout
      title="All Products"
      actions={
        <Link href="/admin/products/new" className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-md hover:bg-blue-600">
          <FiPlus size={12} /> New
        </Link>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['name', 'sku', 'brand', 'batchCode']}
        exportFilename="products"
        emptyMessage={loading ? 'Loading...' : 'No products yet.'}
      />
    </AdminLayout>
  );
}
