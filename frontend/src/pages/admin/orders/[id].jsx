'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI, orderAPI } from '@/utils/endpoints';
import { fmtMoney, fmtDateTime } from '@/utils/format';

const STATUSES = ['pending', 'confirmed', 'processing', 'dispatched', 'in_transit', 'delivered', 'cancelled', 'returned'];

export default function AdminOrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);

  const load = async () => {
    try {
      const r = await adminAPI.getOrderById(id);
      setOrder(r.data.data);
    } catch { toast.error('Not found'); }
  };
  useEffect(() => { if (id) load(); }, [id]);

  const changeStatus = async (status) => {
    try { await orderAPI.updateStatus(id, { status }); toast.success(status); load(); }
    catch { toast.error('Failed'); }
  };

  if (!order) return <AdminLayout title="Order"><div className="text-xs text-slate-400">Loading...</div></AdminLayout>;

  return (
    <AdminLayout title={`Order ${order.orderNumber}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Items</h3>
          <div className="space-y-2">
            {(order.items || []).map((it, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div>
                  <div className="text-xs font-semibold">{it.productName}</div>
                  <div className="text-[10px] text-slate-500">{it.sku} · Qty {it.quantity}</div>
                </div>
                <div className="text-xs font-semibold">{fmtMoney(it.subtotal, order.payment?.currency)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between"><span>Subtotal</span><span>{fmtMoney(order.pricing?.subtotal, order.payment?.currency)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{fmtMoney(order.pricing?.shipping, order.payment?.currency)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{fmtMoney(order.pricing?.tax, order.payment?.currency)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-{fmtMoney(order.pricing?.discount, order.payment?.currency)}</span></div>
            <div className="flex justify-between font-bold pt-2 border-t border-slate-200 dark:border-slate-800 mt-2"><span>Total</span><span>{fmtMoney(order.pricing?.total, order.payment?.currency)}</span></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Status</h3>
            <select value={order.status} onChange={(e) => changeStatus(e.target.value)} className="w-full px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="mt-3 space-y-1 text-[11px]">
              {(order.statusTimeline || []).map((t, i) => (
                <div key={i} className="text-slate-500">• {t.status} — {fmtDateTime(t.timestamp)}</div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Shipping</h3>
            {order.shippingAddress && (
              <div className="space-y-0.5">
                <div className="font-semibold">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</div>
                <div className="text-slate-500">{order.shippingAddress.phone}</div>
                <div className="text-slate-500">{order.shippingAddress.street}</div>
                <div className="text-slate-500">{order.shippingAddress.city}, {order.shippingAddress.country}</div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Payment</h3>
            <div>Method: {order.payment?.method}</div>
            <div>Status: {order.payment?.status}</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
