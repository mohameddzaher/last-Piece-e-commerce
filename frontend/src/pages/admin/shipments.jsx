'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import { shipmentAPI } from '@/utils/endpoints';
import { useSocketEvent } from '@/utils/socket';
import { fmtMoney, fmtDate } from '@/utils/format';
import { FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import { useAuthStore } from '@/store';

const STATUS_COLOR = {
  preparing: 'bg-amber-500/10 text-amber-600',
  'in-transit': 'bg-blue-500/10 text-blue-600',
  delivered: 'bg-emerald-500/10 text-emerald-600',
  cancelled: 'bg-rose-500/10 text-rose-600',
};

export default function AdminShipments() {
  const { user } = useAuthStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await shipmentAPI.getAll({ limit: 500 });
      setRows(res.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useSocketEvent('shipment:created', load);
  useSocketEvent('shipment:updated', load);
  useSocketEvent('shipment:deleted', load);

  const markDelivered = async (id) => {
    if (!confirm('Mark as delivered and move products to Egypt inventory?')) return;
    try {
      await shipmentAPI.update(id, { status: 'delivered' });
      toast.success('Delivered. Products moved to Egypt online inventory.');
      load();
    } catch { toast.error('Failed'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this shipment? Products will roll back to Saudi.')) return;
    try { await shipmentAPI.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const isSuper = user?.role === 'super-admin' || user?.role === 'admin';

  const columns = [
    { key: 'code', label: 'Code', render: (r) => <span className="font-mono text-xs font-semibold">{r.code}</span>, exportValue: (r) => r.code },
    {
      key: 'productCount', label: 'Pairs',
      render: (r) => <span className="text-xs">{r.productCount}</span>,
      exportValue: (r) => r.productCount,
    },
    {
      key: 'totalCost', label: 'Cost',
      render: (r) => <span className="text-xs">{fmtMoney(r.totalCost, r.shippingCurrency)}</span>,
      exportValue: (r) => r.totalCost,
    },
    {
      key: 'costPerProduct', label: 'Per Pair',
      render: (r) => <span className="text-xs">{fmtMoney(r.costPerProduct, r.shippingCurrency)}</span>,
      exportValue: (r) => r.costPerProduct,
    },
    {
      key: 'status', label: 'Status',
      render: (r) => <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${STATUS_COLOR[r.status] || ''}`}>{r.status}</span>,
      exportValue: (r) => r.status,
    },
    { key: 'carrier', label: 'Carrier', render: (r) => r.carrier || '—', exportValue: (r) => r.carrier },
    { key: 'trackingNumber', label: 'Tracking', render: (r) => r.trackingNumber || '—', exportValue: (r) => r.trackingNumber },
    { key: 'sentAt', label: 'Sent', render: (r) => fmtDate(r.sentAt), exportValue: (r) => r.sentAt },
    { key: 'receivedAt', label: 'Delivered', render: (r) => fmtDate(r.receivedAt), exportValue: (r) => r.receivedAt },
    {
      key: 'actions', label: '',
      render: (r) => (
        <div className="flex gap-1">
          {r.status !== 'delivered' && isSuper && (
            <button onClick={(e) => { e.stopPropagation(); markDelivered(r._id); }} className="p-1.5 rounded text-emerald-500 hover:bg-emerald-500/10" title="Mark delivered">
              <FiCheckCircle size={12} />
            </button>
          )}
          {isSuper && (
            <button onClick={(e) => { e.stopPropagation(); del(r._id); }} className="p-1.5 rounded text-rose-500 hover:bg-rose-500/10" title="Delete">
              <FiTrash2 size={12} />
            </button>
          )}
        </div>
      ),
      exportValue: () => '',
    },
  ];

  return (
    <AdminLayout title="Shipments">
      <p className="text-xs text-slate-500 mb-4">
        Shipping cost is allocated across the pairs in each shipment. Mark delivered to release inventory into Egypt.
      </p>
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['code', 'carrier', 'trackingNumber']}
        exportFilename="shipments"
        emptyMessage={loading ? 'Loading...' : 'No shipments yet. Create one from the Saudi inventory page.'}
      />
    </AdminLayout>
  );
}
