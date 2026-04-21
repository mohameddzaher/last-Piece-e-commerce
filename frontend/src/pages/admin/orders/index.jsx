'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import { adminAPI } from '@/utils/endpoints';
import { useSocketEvent } from '@/utils/socket';
import { fmtMoney, fmtDate } from '@/utils/format';

const STATUS_COLOR = {
  pending: 'bg-amber-500/10 text-amber-600',
  confirmed: 'bg-blue-500/10 text-blue-600',
  processing: 'bg-blue-500/10 text-blue-600',
  dispatched: 'bg-purple-500/10 text-purple-600',
  in_transit: 'bg-purple-500/10 text-purple-600',
  delivered: 'bg-emerald-500/10 text-emerald-600',
  cancelled: 'bg-rose-500/10 text-rose-600',
  returned: 'bg-rose-500/10 text-rose-600',
};

export default function AdminOrders() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await adminAPI.getOrders({ limit: 500 });
      setRows(r.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useSocketEvent('order:created', load);
  useSocketEvent('order:status-changed', load);

  const columns = [
    {
      key: 'orderNumber', label: 'Order #',
      render: (r) => <Link href={`/admin/orders/${r._id}`} className="text-blue-500 font-mono text-[11px] font-semibold hover:underline">{r.orderNumber}</Link>,
      exportValue: (r) => r.orderNumber,
    },
    { key: 'createdAt', label: 'Placed', render: (r) => fmtDate(r.createdAt), exportValue: (r) => r.createdAt },
    { key: 'items', label: 'Items', render: (r) => `${r.items?.length || 0}`, exportValue: (r) => r.items?.length },
    { key: 'total', label: 'Total', render: (r) => <span className="text-xs font-semibold">{fmtMoney(r.pricing?.total, r.payment?.currency)}</span>, exportValue: (r) => r.pricing?.total },
    {
      key: 'status', label: 'Status',
      render: (r) => <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${STATUS_COLOR[r.status] || ''}`}>{r.status}</span>,
      exportValue: (r) => r.status,
    },
    { key: 'payment', label: 'Payment', render: (r) => r.payment?.method, exportValue: (r) => r.payment?.method },
    {
      key: 'customer', label: 'Customer',
      render: (r) => r.shippingAddress ? `${r.shippingAddress.firstName} ${r.shippingAddress.lastName}` : '—',
      exportValue: (r) => r.shippingAddress?.firstName,
    },
  ];

  return (
    <AdminLayout title="Online Orders">
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['orderNumber']}
        exportFilename="orders"
        onRowClick={(r) => (window.location.href = `/admin/orders/${r._id}`)}
        emptyMessage={loading ? 'Loading...' : 'No orders yet.'}
      />
    </AdminLayout>
  );
}
