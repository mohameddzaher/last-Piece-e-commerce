'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import {
  FiArrowLeft, FiPackage, FiTruck, FiCheckCircle, FiXCircle,
  FiMapPin, FiPhone, FiCreditCard, FiClock,
} from 'react-icons/fi';
import { useAuthStore } from '@/store';
import { orderAPI } from '@/utils/endpoints';
import { getProductImageUrl } from '@/utils/formatters';
import { fmtMoney, fmtDateTime } from '@/utils/format';
import { toast } from 'react-toastify';

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
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  cancelled: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
  returned: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
};

export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (id) fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getById(id);
      if (res.data.success) setOrder(res.data.data);
    } catch {
      toast.error('Failed to load order');
      router.push('/orders');
    } finally { setLoading(false); }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Cancel this order?')) return;
    try {
      await orderAPI.cancel(id);
      toast.success('Order cancelled');
      fetchOrder();
    } catch { toast.error('Failed to cancel'); }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="h-3 w-32 bg-slate-100 rounded animate-pulse mb-4" />
          <div className="h-16 bg-slate-100 rounded-xl animate-pulse mb-4" />
          <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiPackage className="mx-auto text-slate-300 mb-3" size={36} />
          <h2 className="text-base font-bold text-slate-900 mb-1">Order not found</h2>
          <Link href="/orders" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">Back to orders</Link>
        </div>
      </div>
    );
  }

  const currency = order.payment?.currency || 'EGP';
  const pricing = order.pricing || {};
  const shippingAddr = order.shippingAddress || {};
  const currentStatusIdx = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const cancelled = order.status === 'cancelled' || order.status === 'returned';

  return (
    <>
      {/* Header band (white) */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <Link href="/orders" className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 mb-3">
            <FiArrowLeft size={11} /> Back to orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">ORDER DETAILS</div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900">
                Order <span className="font-mono">#{order.orderNumber}</span>
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Placed {fmtDateTime(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${STATUS_COLOR[order.status] || ''}`}>
                {order.status.replace('_', ' ')}
              </span>
              {order.status === 'pending' && (
                <button
                  onClick={handleCancelOrder}
                  className="px-3 py-1 text-[11px] font-semibold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 rounded-full"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Progress tracker (white) */}
      {!cancelled && (
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-5">
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
              <div className="relative grid grid-cols-6 gap-2">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStatusIdx;
                  const curr = i === currentStatusIdx;
                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center z-10 text-[10px] font-bold ${
                          done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                        } ${curr ? 'ring-4 ring-emerald-500/20' : ''}`}
                      >
                        {done ? <FiCheckCircle size={11} /> : i + 1}
                      </div>
                      <span
                        className={`mt-1 text-[9px] text-center leading-tight ${
                          done ? 'text-emerald-700 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {cancelled && (
        <section className="bg-rose-50 border-b border-rose-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-rose-700">
            <FiXCircle size={14} />
            This order was {order.status}. If this was a mistake, contact us.
          </div>
        </section>
      )}

      {/* Body — two columns on desktop, stack on mobile */}
      <section className="bg-slate-50 min-h-[60vh]">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
          {/* LEFT: items + timeline */}
          <div className="space-y-4">
            {/* Items */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Items · {order.items?.length || 0}
              </div>
              <ul className="divide-y divide-slate-100">
                {(order.items || []).map((it, i) => (
                  <li key={i} className="p-3 flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                      {it.productId?.thumbnail || it.thumbnail ? (
                        <Image
                          src={getProductImageUrl(it.productId?.thumbnail || it.thumbnail)}
                          alt={it.productName || ''}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <FiPackage className="text-slate-300" size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{it.productName || 'Product'}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {it.sku && <span className="font-mono">{it.sku} · </span>}Qty {it.quantity || 1}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900">{fmtMoney(it.subtotal ?? it.price * (it.quantity || 1), currency)}</div>
                      <div className="text-[10px] text-slate-500">{fmtMoney(it.price, currency)} each</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Status timeline */}
            {order.statusTimeline?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Timeline
                </div>
                <ul className="p-4 space-y-2 text-[11px]">
                  {order.statusTimeline.map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <FiClock size={11} className="mt-0.5 text-slate-400 shrink-0" />
                      <div className="flex-1">
                        <span className="font-semibold text-slate-900 capitalize">{t.status.replace('_', ' ')}</span>
                        {t.notes && <span className="text-slate-500"> · {t.notes}</span>}
                      </div>
                      <span className="text-slate-400 text-[10px]">{fmtDateTime(t.timestamp || t.at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* RIGHT: summary + shipping + payment */}
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">Summary</div>
              <div className="space-y-1.5">
                <Row label="Subtotal" value={fmtMoney(pricing.subtotal, currency)} />
                {(pricing.discount > 0 || pricing.couponCode) && (
                  <Row
                    label={`Discount${pricing.couponCode ? ` (${pricing.couponCode})` : ''}`}
                    value={`− ${fmtMoney(pricing.discount || 0, currency)}`}
                    accent="text-emerald-600"
                  />
                )}
                <Row label="Tax" value={fmtMoney(pricing.tax || 0, currency)} />
                <Row
                  label="Shipping"
                  value={pricing.shipping > 0 ? fmtMoney(pricing.shipping, currency) : 'Free'}
                />
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-bold">
                  <span>Total</span>
                  <span>{fmtMoney(pricing.total, currency)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Shipping to</div>
              <div className="font-semibold text-slate-900">
                {shippingAddr.firstName} {shippingAddr.lastName}
              </div>
              <div className="flex items-start gap-1.5 mt-1 text-slate-600">
                <FiMapPin size={11} className="mt-0.5 text-slate-400 shrink-0" />
                <div>
                  {shippingAddr.street && <div>{shippingAddr.street}</div>}
                  <div>
                    {[shippingAddr.city, shippingAddr.state, shippingAddr.postalCode].filter(Boolean).join(', ')}
                  </div>
                  {shippingAddr.country && <div>{shippingAddr.country}</div>}
                </div>
              </div>
              {shippingAddr.phone && (
                <div className="flex items-center gap-1.5 mt-1 text-slate-600">
                  <FiPhone size={11} className="text-slate-400 shrink-0" />
                  <a href={`tel:${shippingAddr.phone}`} className="hover:text-slate-900">{shippingAddr.phone}</a>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Payment</div>
              <div className="flex items-center gap-2">
                <FiCreditCard size={12} className="text-slate-400" />
                <span className="font-semibold text-slate-900 uppercase">{(order.payment?.method || 'COD').replace('_', ' ')}</span>
              </div>
              <div className="mt-1 text-slate-500">
                Status: <span className="font-semibold capitalize">{order.payment?.status || 'pending'}</span>
              </div>
            </div>

            {order.shipping?.trackingNumber && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-blue-700">
                  <FiTruck size={12} /> Tracking
                </div>
                <div className="mt-1 text-blue-900 font-mono">{order.shipping.trackingNumber}</div>
                {order.shipping.carrier && <div className="text-[10px] text-blue-700 mt-0.5">via {order.shipping.carrier}</div>}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${accent || 'text-slate-900'}`}>{value}</span>
    </div>
  );
}
