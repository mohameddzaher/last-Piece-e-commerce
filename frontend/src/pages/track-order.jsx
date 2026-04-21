'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  FiPackage, FiTruck, FiCheckCircle, FiHome, FiSearch, FiClock, FiXCircle,
} from 'react-icons/fi';
import SEO from '@/components/SEO';
import { orderAPI } from '@/utils/endpoints';
import { fmtMoney, fmtDateTime } from '@/utils/format';
import { useI18n } from '@/utils/i18n';

const STATUS_STEPS = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
];

const STATUS_COLOR = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  dispatched: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  in_transit: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  cancelled: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
  returned: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
};

export default function TrackOrder() {
  const t = useI18n((s) => s.t);
  const [form, setForm] = useState({ orderNumber: '', email: '' });
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!form.orderNumber.trim() || !form.email.trim()) {
      setError('Enter both order number and email.');
      return;
    }
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await orderAPI.track({ orderNumber: form.orderNumber.trim(), email: form.email.trim() });
      setOrder(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not find your order.';
      setError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const cancelled = order?.status === 'cancelled' || order?.status === 'returned';
  const currentStatusIdx = order ? STATUS_STEPS.findIndex((s) => s.key === order.status) : -1;
  const currency = order?.payment?.currency || 'EGP';

  return (
    <>
      <SEO title={`${t('nav.myOrders', 'Track Order')} · Last Piece`} description="Track your Last Piece order status." />

      {/* Breadcrumb */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-9 flex items-center gap-1 text-[10px] text-slate-500">
          <Link href="/" className="hover:text-slate-900 inline-flex items-center gap-1">
            <FiHome size={9} /> Home
          </Link>
          <span>/</span>
          <span className="text-slate-900">Track Order</span>
        </div>
      </nav>

      {/* Hero (dark, compact) */}
      <section className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400 mb-1.5">TRACK YOUR ORDER</div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Where is my pair?</h1>
          <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto">
            Enter your order number and the email you used when checking out.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="bg-white">
        <div className="max-w-xl mx-auto px-4 py-8">
          <form onSubmit={submit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Order number</label>
              <input
                value={form.orderNumber}
                onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                placeholder="ORD-XXXXXXXX-XXXX"
                className="w-full h-10 px-3 text-sm font-mono rounded-md bg-white border border-slate-200 focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Email used at checkout</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full h-10 px-3 text-sm rounded-md bg-white border border-slate-200 focus:border-slate-900 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold disabled:opacity-60"
            >
              <FiSearch size={12} />
              {loading ? 'Searching...' : 'Track Order'}
            </button>
            {error && (
              <p className="text-[11px] text-rose-600 text-center">{error}</p>
            )}
          </form>
        </div>
      </section>

      {/* Result */}
      {order && (
        <section className="bg-slate-50 border-t border-slate-200">
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Order</div>
                  <h2 className="text-lg font-bold text-slate-900 font-mono">#{order.orderNumber}</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Placed {fmtDateTime(order.createdAt)}</p>
                </div>
                <span className={`self-start px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${STATUS_COLOR[order.status] || ''}`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Progress */}
            {!cancelled && (
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Progress</div>
                <div className="relative">
                  <div className="absolute top-3 left-3 right-3 h-0.5 bg-slate-200" />
                  <div
                    className="absolute top-3 left-3 h-0.5 bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `calc(${
                        STATUS_STEPS.length > 1
                          ? (Math.max(0, currentStatusIdx) / (STATUS_STEPS.length - 1)) * 100
                          : 0
                      }% - 1.5rem)`,
                    }}
                  />
                  <div className="relative grid grid-cols-6 gap-1">
                    {STATUS_STEPS.map((step, i) => {
                      const done = i <= currentStatusIdx;
                      const curr = i === currentStatusIdx;
                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 text-[10px] font-bold ${
                            done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                          } ${curr ? 'ring-4 ring-emerald-500/20' : ''}`}>
                            {done ? <FiCheckCircle size={11} /> : i + 1}
                          </div>
                          <span className={`mt-1 text-[9px] text-center leading-tight ${done ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {cancelled && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-700">
                <FiXCircle size={13} />
                This order was {order.status}. If this was a mistake, contact us.
              </div>
            )}

            {/* Items */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Items · {order.items?.length || 0}
              </div>
              <ul className="divide-y divide-slate-100">
                {(order.items || []).map((it, i) => (
                  <li key={i} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FiPackage size={14} className="text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">{it.productName}</div>
                        <div className="text-[10px] text-slate-500">Qty {it.quantity || 1}</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-900 shrink-0">
                      {fmtMoney(it.subtotal ?? it.price * (it.quantity || 1), currency)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shipping + tracking */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Shipping</div>
              <div className="text-slate-700">
                <div className="font-semibold">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</div>
                <div className="text-slate-500 mt-0.5">
                  {[order.shippingAddress?.city, order.shippingAddress?.country].filter(Boolean).join(', ')}
                </div>
              </div>
              {order.shipping?.trackingNumber && (
                <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-700">
                    <FiTruck size={11} /> Tracking number
                  </div>
                  <div className="mt-1 text-blue-900 font-mono">{order.shipping.trackingNumber}</div>
                  {order.shipping.carrier && <div className="text-[10px] text-blue-700 mt-0.5">via {order.shipping.carrier}</div>}
                </div>
              )}
            </div>

            {order.statusTimeline?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Timeline</div>
                <ul className="space-y-1.5 text-[11px]">
                  {order.statusTimeline.map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <FiClock size={10} className="mt-0.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-900 capitalize">{t.status.replace('_', ' ')}</span>
                      <span className="ml-auto text-slate-400 text-[10px]">{fmtDateTime(t.timestamp || t.at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
