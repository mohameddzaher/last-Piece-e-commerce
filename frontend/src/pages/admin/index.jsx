'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import FxRateCard from '@/components/admin/FxRateCard';
import FxImpactCard from '@/components/admin/FxImpactCard';
import FxReferenceCard from '@/components/admin/FxReferenceCard';
import {
  FiPackage, FiShoppingBag, FiDollarSign, FiTrendingUp, FiArchive, FiTruck,
  FiCloud, FiAlertTriangle, FiRefreshCw, FiTrendingDown, FiUsers,
  FiShoppingCart, FiPercent, FiActivity, FiZap,
} from 'react-icons/fi';
import {
  productAPI, expenseAPI, saleAPI, adminAPI, promoCodeAPI, fxAPI,
} from '@/utils/endpoints';
import { useAuthStore } from '@/store';
import { useSocketEvent } from '@/utils/socket';
import { fmtMoney, fmtPct, fmtDate, fmtDateTime } from '@/utils/format';
import { toEGP, ratesFromReferences } from '@/utils/fxConvert';

/* ---------- helpers ---------- */

// Landed cost for a product in EGP. Prefers the frozen purchasePriceEGP that
// the backend wrote at save time (so FX moves don't rewrite history), falls
// back to landedCost if that's what's populated, then to a live conversion.
const inventoryValueEGP = (p, rates) => {
  if (p.purchasePriceEGP > 0) return p.purchasePriceEGP;
  if (p.landedCost > 0) return p.landedCost; // already EGP for EGP-based inventory
  return toEGP(p.purchasePrice || 0, p.purchaseCurrency || 'SAR', rates);
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const periodToDays = { '7d': 7, '30d': 30, '90d': 90, all: null };

const inPeriod = (date, days) => {
  if (days == null) return true;
  const cutoff = Date.now() - days * 86400000;
  return new Date(date).getTime() >= cutoff;
};

/* ---------- page ---------- */

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const role = user?.role;
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  // Raw datasets (role-filtered by the backend already).
  const [inventory, setInventory] = useState({
    saudi: [], transit: [], online: [], offline: [],
  });
  const [sales, setSales] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [promos, setPromos] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [fxRates, setFxRates] = useState({ EGP: 1 });

  const isSuper = role === 'super-admin' || role === 'admin';
  const isSaudi = role === 'saudi-staff';
  const isEgypt = role === 'egypt-staff';

  const load = async () => {
    try {
      const [sa, tr, on, of, salesRes, orderRes, expRes, promoRes, statsRes, fxRes] = await Promise.all([
        (isSuper || isSaudi) ? productAPI.getInventory('saudi').catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
        (isSuper || isSaudi) ? productAPI.getInventory('transit').catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
        (isSuper || isEgypt) ? productAPI.getInventory('egypt-online').catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
        (isSuper || isEgypt) ? productAPI.getInventory('egypt-offline').catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
        saleAPI.getAll({ limit: 1000 }).catch(() => ({ data: { data: [] } })),
        isSuper ? adminAPI.getOrders({ limit: 1000 }).catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
        isSuper ? expenseAPI.getAll({ limit: 1000 }).catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
        isSuper ? promoCodeAPI.getAll().catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
        isSuper ? adminAPI.getStats().catch(() => ({ data: { data: {} } })) : Promise.resolve({ data: { data: {} } }),
        isSuper ? fxAPI.getReferences().catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
      ]);
      setInventory({
        saudi: sa.data.data || [],
        transit: tr.data.data || [],
        online: on.data.data || [],
        offline: of.data.data || [],
      });
      setSales(salesRes.data.data || []);
      setOrders(orderRes.data.data || []);
      setExpenses(expRes.data.data || []);
      setPromos(promoRes.data.data || []);
      setUserCount(statsRes.data?.data?.totalUsers || 0);
      setFxRates(ratesFromReferences(fxRes.data?.data || []));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (role) load(); }, [role]);
  useSocketEvent('dashboard:refresh', () => load(), [role]);
  useSocketEvent('product:created', () => load(), [role]);
  useSocketEvent('product:updated', () => load(), [role]);
  useSocketEvent('sale:created', () => load(), [role]);
  useSocketEvent('order:created', () => load(), [role]);
  useSocketEvent('expense:created', () => load(), [role]);

  /* ---------- derived analytics ---------- */

  const a = useMemo(() => {
    const days = periodToDays[period];

    // Filter transactions to period
    const salesP = sales.filter((s) => inPeriod(s.createdAt, days));
    const ordersP = orders.filter((o) => inPeriod(o.createdAt, days));
    // "Live" orders for revenue purposes = anything that hasn't been
    // cancelled/returned. Cash-on-delivery dominates here, so an order with
    // payment.status = 'pending' is still booked revenue once it's placed —
    // waiting for delivery to count it would zero the dashboard for the first
    // few days of operation. Cancelled/returned subtract out naturally.
    const liveOrdersP = ordersP.filter((o) => !['cancelled', 'returned'].includes(o.status));

    // B-13: Revenue and AOV share the same transaction set.
    const offlineRevenue = salesP.reduce((s, x) => s + (x.total || 0), 0);
    const onlineRevenue = liveOrdersP.reduce((s, x) => s + (x.pricing?.total || 0), 0);
    const totalRevenue = offlineRevenue + onlineRevenue;

    const totalCOGS = salesP.reduce((s, x) => s + (x.totalCost || 0), 0);
    const grossProfit = salesP.reduce((s, x) => s + (x.totalProfit || 0), 0);

    const expensesP = expenses.filter((x) => inPeriod(x.incurredOn || x.createdAt, days));
    const opex = expensesP.reduce((s, x) => s + toEGP(x.amount || 0, x.currency || 'EGP', fxRates), 0);
    const netProfit = grossProfit - opex;

    const revenueTxnCount = salesP.length + liveOrdersP.length;
    const aov = revenueTxnCount > 0 ? totalRevenue / revenueTxnCount : 0;
    const marginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // B-14: Unique customers = distinct order.userId in the period across all
    // live (non-cancelled) orders. A COD customer still counts the moment
    // they place the order.
    const uniqueCustomerIds = new Set();
    for (const o of liveOrdersP) {
      if (o.userId) uniqueCustomerIds.add(String(o.userId));
    }
    const uniqueCustomers = uniqueCustomerIds.size;

    // Month-over-month (last 30 vs prior 30)
    const now = Date.now();
    const monthMs = 30 * 86400000;
    const cur = sales.filter((s) => now - new Date(s.createdAt).getTime() < monthMs);
    const prev = sales.filter((s) => {
      const delta = now - new Date(s.createdAt).getTime();
      return delta >= monthMs && delta < 2 * monthMs;
    });
    const curRev = cur.reduce((s, x) => s + (x.total || 0), 0);
    const prevRev = prev.reduce((s, x) => s + (x.total || 0), 0);
    const mom = prevRev > 0 ? ((curRev - prevRev) / prevRev) * 100 : curRev > 0 ? 100 : 0;

    // B-08: Inventory value uses the frozen purchasePriceEGP per product (the
    // rate that was locked at the moment we paid for the pair). Falling back
    // to a live conversion only if the frozen value is missing keeps the
    // Dashboard consistent with individual product pages.
    const allInventory = [
      ...inventory.saudi, ...inventory.transit, ...inventory.online, ...inventory.offline,
    ];
    const inventoryValue = allInventory.reduce(
      (s, p) => s + inventoryValueEGP(p, fxRates),
      0,
    );

    // Top products by revenue (from offline sales items)
    const topProductMap = {};
    for (const s of salesP) {
      for (const it of (s.items || [])) {
        const id = String(it.product || it.productId || '');
        if (!id) continue;
        if (!topProductMap[id]) {
          topProductMap[id] = { id, name: it.productName || '—', revenue: 0, units: 0 };
        }
        topProductMap[id].revenue += it.sellPrice || 0;
        topProductMap[id].units += 1;
      }
    }
    // Also count online orders
    for (const o of liveOrdersP) {
      for (const it of (o.items || [])) {
        const id = String(it.productId || '');
        if (!id) continue;
        if (!topProductMap[id]) {
          topProductMap[id] = { id, name: it.productName || '—', revenue: 0, units: 0 };
        }
        topProductMap[id].revenue += (it.subtotal || (it.price * (it.quantity || 1)) || 0);
        topProductMap[id].units += it.quantity || 1;
      }
    }
    const topProducts = Object.values(topProductMap).sort((x, y) => y.revenue - x.revenue).slice(0, 5);

    // Top brands from inventory (most of the sold products share brand data).
    // B-08: use the same frozen-landed-cost helper as the Inventory Value tile
    // so the two numbers reconcile.
    const brandMap = {};
    for (const p of allInventory) {
      const name = p.brandRef?.name || p.brand || '—';
      if (!brandMap[name]) brandMap[name] = { name, units: 0, value: 0 };
      brandMap[name].units += 1;
      brandMap[name].value += inventoryValueEGP(p, fxRates);
    }
    const topBrands = Object.values(brandMap).sort((x, y) => y.value - x.value).slice(0, 5);

    // Revenue by day — last 14 days
    const series = [];
    for (let i = 13; i >= 0; i--) {
      const day = startOfDay(Date.now() - i * 86400000);
      const next = new Date(day.getTime() + 86400000);
      const revToday = salesP
        .filter((s) => { const t = new Date(s.createdAt); return t >= day && t < next; })
        .reduce((s, x) => s + (x.total || 0), 0)
        + liveOrdersP
          .filter((o) => { const t = new Date(o.createdAt); return t >= day && t < next; })
          .reduce((s, x) => s + (x.pricing?.total || 0), 0);
      series.push({ date: day, revenue: revToday });
    }

    // Expenses by category
    const expCat = {};
    for (const e of expensesP) {
      const c = e.category || 'other';
      if (!expCat[c]) expCat[c] = 0;
      expCat[c] += toEGP(e.amount || 0, e.currency || 'EGP', fxRates);
    }
    const expByCategory = Object.entries(expCat).map(([k, v]) => ({ category: k, amount: v })).sort((x, y) => y.amount - x.amount);

    // Recent activity (union of sales, orders, both sorted by createdAt desc)
    const activity = [
      ...salesP.map((s) => ({
        type: 'sale',
        when: s.createdAt,
        title: `Boutique sale · ${s.items?.[0]?.productName || '—'}${s.items?.length > 1 ? ` +${s.items.length - 1}` : ''}`,
        value: s.total,
        currency: s.currency || 'EGP',
      })),
      ...ordersP.map((o) => ({
        type: 'order',
        when: o.createdAt,
        title: (
          <>
            Online order · <span className="font-mono">{o.orderNumber}</span>
          </>
        ),
        value: o.pricing?.total,
        currency: o.payment?.currency || 'EGP',
      })),
    ].sort((x, y) => new Date(y.when) - new Date(x.when)).slice(0, 10);

    // Alerts
    const alerts = [];
    const staleCutoff = Date.now() - 60 * 86400000;
    const stale = allInventory.filter((p) =>
      p.location !== 'sold' && new Date(p.createdAt).getTime() < staleCutoff,
    ).length;
    if (stale > 0) alerts.push({ level: 'warn', msg: `${stale} product${stale > 1 ? 's' : ''} older than 60 days and still in stock` });
    const lowPrice = allInventory.filter((p) => {
      if (!(p.minSellPrice > 0)) return false;
      const cost = inventoryValueEGP(p, fxRates);
      return cost > 0 && p.minSellPrice < cost;
    }).length;
    if (lowPrice > 0) alerts.push({ level: 'warn', msg: `${lowPrice} product${lowPrice > 1 ? 's' : ''} have a minimum sell price below landed cost` });
    const expiringPromos = promos.filter((p) => {
      if (!p.expiresAt) return false;
      const d = new Date(p.expiresAt).getTime() - Date.now();
      return d > 0 && d < 7 * 86400000;
    }).length;
    if (expiringPromos > 0) alerts.push({ level: 'info', msg: `${expiringPromos} promo code${expiringPromos > 1 ? 's' : ''} expire within 7 days` });

    return {
      totalRevenue, onlineRevenue, offlineRevenue,
      totalCOGS, grossProfit, opex, netProfit,
      txnCount: revenueTxnCount, aov, marginPct, mom,
      inventoryValue,
      uniqueCustomers,
      counts: {
        saudi: inventory.saudi.length,
        transit: inventory.transit.length,
        online: inventory.online.length,
        offline: inventory.offline.length,
      },
      topProducts, topBrands, series, expByCategory,
      activity, alerts,
      onlineOrderCount: ordersP.length,
      offlineSaleCount: salesP.length,
      paidOrderCount: liveOrdersP.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, orders, expenses, inventory, promos, period, fxRates]);

  const maxSeries = Math.max(1, ...a.series.map((d) => d.revenue));

  return (
    <AdminLayout
      title="Dashboard"
      actions={
        isSuper && (
          <div className="flex items-center gap-2">
            <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-full p-0.5">
              {['7d', '30d', '90d', 'all'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-[10px] font-semibold uppercase rounded-full transition-colors ${
                    period === p ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow' : 'text-slate-500'
                  }`}
                >
                  {p === 'all' ? 'All' : `Last ${p}`}
                </button>
              ))}
            </div>
            <button
              onClick={load}
              className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900"
              title="Refresh"
            >
              <FiRefreshCw size={12} />
            </button>
          </div>
        )
      }
    >
      <div className="mb-5">
        <h2 className="text-lg font-bold">Welcome back, {user?.firstName}.</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {isSuper && 'Live numbers across everything — updated in real time.'}
          {isSaudi && 'Your Saudi inventory at a glance.'}
          {isEgypt && 'Your Egypt inventory and sales.'}
        </p>
      </div>

      {/* Alerts row */}
      {isSuper && a.alerts.length > 0 && (
        <div className="mb-5 space-y-1.5">
          {a.alerts.map((al, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] ${
                al.level === 'warn'
                  ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
                  : 'bg-blue-500/10 text-blue-700 border border-blue-500/30'
              }`}
            >
              <FiAlertTriangle size={12} /> {al.msg}
            </div>
          ))}
        </div>
      )}

      {/* Inventory counts */}
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Inventory</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {(isSuper || isSaudi) && (
          <StatCard label="Saudi Inventory" value={a.counts.saudi} icon={FiArchive} accent="amber" />
        )}
        {(isSuper || isSaudi) && (
          <StatCard label="In Transit" value={a.counts.transit} icon={FiTruck} accent="blue" />
        )}
        {(isSuper || isEgypt) && (
          <StatCard label="Egypt — Online" value={a.counts.online} icon={FiCloud} accent="emerald" />
        )}
        {(isSuper || isEgypt) && (
          <StatCard label="Egypt — Boutique" value={a.counts.offline} icon={FiShoppingBag} accent="purple" />
        )}
      </div>

      {isSuper && (
        <>
          {/* Financial KPI row */}
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Business performance · {period === 'all' ? 'all-time' : `last ${period}`}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <StatCard
              label="Revenue"
              value={fmtMoney(a.totalRevenue)}
              sub={<MoMTag value={a.mom} />}
              icon={FiDollarSign}
              accent="emerald"
            />
            <StatCard
              label="Gross Profit"
              value={fmtMoney(a.grossProfit)}
              sub={`Margin ${fmtPct(a.marginPct)}`}
              icon={FiTrendingUp}
              accent="blue"
            />
            <StatCard
              label="Operating Expenses"
              value={fmtMoney(a.opex)}
              sub={`${a.txnCount} transactions`}
              icon={FiAlertTriangle}
              accent="rose"
            />
            <StatCard
              label="Avg Order Value"
              value={fmtMoney(a.aov)}
              sub={`${a.txnCount} txns`}
              icon={FiShoppingCart}
              accent="purple"
            />
          </div>

          {/* Net profit hero */}
          <div className={`rounded-xl p-5 text-white mb-6 ${
            a.netProfit >= 0
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
              : 'bg-gradient-to-br from-rose-500 to-rose-600'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Net Profit</div>
                <div className="text-3xl font-bold mt-1">{fmtMoney(a.netProfit)}</div>
                <div className="text-[11px] opacity-80 mt-1">Gross − Operating Expenses</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider opacity-70">Inventory Value</div>
                <div className="text-lg font-bold">{fmtMoney(a.inventoryValue)}</div>
                <div className="text-[10px] opacity-70 mt-0.5">Landed cost, EGP</div>
              </div>
            </div>
          </div>

          {/* Channel split + secondary KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 mb-6">
            {/* Revenue bar chart */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Revenue — last 14 days</h4>
                  <div className="text-[11px] text-slate-500">Daily totals across online + boutique</div>
                </div>
                <FiActivity size={14} className="text-slate-400" />
              </div>
              <div className="flex items-end gap-1 h-32">
                {a.series.map((d, i) => {
                  const pct = maxSeries > 0 ? (d.revenue / maxSeries) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group min-w-0">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-blue-500 to-blue-400 relative group-hover:from-blue-600 group-hover:to-blue-500"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                      >
                        {d.revenue > 0 && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900 text-white text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            {fmtMoney(d.revenue)}
                          </div>
                        )}
                      </div>
                      <div className="text-[8px] text-slate-400 whitespace-nowrap">
                        {d.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Channel revenue split */}
            <div className="space-y-3">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Revenue by channel</h4>
                <ChannelRow
                  icon={FiCloud}
                  label="Online"
                  color="text-emerald-600 bg-emerald-500/10"
                  revenue={a.onlineRevenue}
                  count={a.onlineOrderCount}
                  total={a.totalRevenue}
                />
                <ChannelRow
                  icon={FiShoppingBag}
                  label="Boutique"
                  color="text-purple-600 bg-purple-500/10"
                  revenue={a.offlineRevenue}
                  count={a.offlineSaleCount}
                  total={a.totalRevenue}
                />
              </div>
              <StatCard
                label="Customers this period"
                value={a.uniqueCustomers}
                sub={`${userCount} registered total`}
                icon={FiUsers}
                accent="blue"
              />
              <FxReferenceCard />
              <FxRateCard />
              <FxImpactCard />
            </div>
          </div>

          {/* Top products + top brands */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Top products by revenue</h4>
                <Link href="/admin/products" className="text-[10px] text-blue-500 hover:text-blue-600 font-semibold">All →</Link>
              </div>
              {a.topProducts.length === 0 ? (
                <div className="text-[11px] text-slate-400 py-4 text-center">No sales yet in this period.</div>
              ) : (
                <TopList
                  items={a.topProducts}
                  maxValue={a.topProducts[0]?.revenue || 1}
                  formatRight={(p) => fmtMoney(p.revenue)}
                  formatSub={(p) => `${p.units} unit${p.units > 1 ? 's' : ''}`}
                />
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Top brands by inventory value</h4>
                <Link href="/admin/brands" className="text-[10px] text-blue-500 hover:text-blue-600 font-semibold">All →</Link>
              </div>
              {a.topBrands.length === 0 ? (
                <div className="text-[11px] text-slate-400 py-4 text-center">No inventory yet.</div>
              ) : (
                <TopList
                  items={a.topBrands.map((b) => ({ id: b.name, name: b.name, revenue: b.value, units: b.units }))}
                  maxValue={a.topBrands[0]?.value || 1}
                  formatRight={(b) => fmtMoney(b.revenue)}
                  formatSub={(b) => `${b.units} pair${b.units > 1 ? 's' : ''}`}
                />
              )}
            </div>
          </div>

          {/* Expenses breakdown + activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Expenses by category</h4>
                <Link href="/admin/expenses" className="text-[10px] text-blue-500 hover:text-blue-600 font-semibold">Manage →</Link>
              </div>
              {a.expByCategory.length === 0 ? (
                <div className="text-[11px] text-slate-400 py-4 text-center">No expenses recorded in this period.</div>
              ) : (
                <div className="space-y-2">
                  {a.expByCategory.map((e) => {
                    const pct = a.opex > 0 ? (e.amount / a.opex) * 100 : 0;
                    return (
                      <div key={e.category} className="text-[11px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="capitalize text-slate-700 dark:text-slate-300">{e.category.replace(/-/g, ' ')}</span>
                          <span className="font-semibold">{fmtMoney(e.amount)} · {pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent activity</h4>
                <FiZap size={12} className="text-slate-400" />
              </div>
              {a.activity.length === 0 ? (
                <div className="text-[11px] text-slate-400 py-4 text-center">No activity yet.</div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {a.activity.map((ev, i) => (
                    <li key={i} className="py-2 flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          ev.type === 'sale' ? 'bg-purple-500/10 text-purple-600' : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {ev.type === 'sale' ? <FiShoppingBag size={10} /> : <FiShoppingCart size={10} />}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-slate-900 dark:text-slate-100">{ev.title}</div>
                          <div className="text-slate-400 text-[10px]">{fmtDateTime(ev.when)}</div>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white shrink-0">
                        {fmtMoney(ev.value, ev.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Promo summary */}
          {promos.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Active promo codes</h4>
                <Link href="/admin/promo-codes" className="text-[10px] text-blue-500 hover:text-blue-600 font-semibold">Manage →</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {promos.filter((p) => p.isActive).slice(0, 6).map((p) => (
                  <div key={p._id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-md text-[11px]">
                    <div>
                      <div className="font-mono font-bold">{p.code}</div>
                      <div className="text-slate-500">
                        {p.type === 'percent' ? `${p.value}% off` : p.type === 'fixed' ? fmtMoney(p.value) : 'Free shipping'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                        <FiPercent size={10} /> {p.usedCount}/{p.usageLimit || '∞'}
                      </div>
                      {p.expiresAt && (
                        <div className="text-[10px] text-slate-400">Exp {fmtDate(p.expiresAt)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {loading && <div className="text-xs text-slate-400 mt-4">Loading...</div>}
    </AdminLayout>
  );
}

/* ---------- tiny helper components ---------- */

function MoMTag({ value }) {
  if (!Number.isFinite(value) || value === 0) return <span className="text-slate-500">no prior month</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
      {up ? <FiTrendingUp size={10} /> : <FiTrendingDown size={10} />}
      {up ? '+' : ''}{value.toFixed(1)}% MoM
    </span>
  );
}

function ChannelRow({ icon: Icon, label, color, revenue, count, total }) {
  const pct = total > 0 ? (revenue / total) * 100 : 0;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center gap-2 text-[11px] mb-1.5">
        <span className={`w-6 h-6 rounded-md flex items-center justify-center ${color}`}>
          <Icon size={11} />
        </span>
        <span className="flex-1 font-semibold text-slate-900 dark:text-white">{label}</span>
        <span className="text-slate-500">{count} txn</span>
        <span className="font-bold text-slate-900 dark:text-white">{fmtMoney(revenue)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full ${label === 'Online' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-purple-400 to-purple-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[9px] text-slate-400 mt-0.5">{pct.toFixed(0)}% of revenue</div>
    </div>
  );
}

function TopList({ items, maxValue, formatRight, formatSub }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => {
        const pct = maxValue > 0 ? (it.revenue / maxValue) * 100 : 0;
        return (
          <li key={it.id} className="text-[11px]">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[9px] font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="truncate font-semibold text-slate-900 dark:text-white">{it.name}</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white shrink-0">{formatRight(it)}</span>
            </div>
            <div className="pl-7">
              <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500" style={{ width: `${pct}%` }} />
              </div>
              {formatSub && <div className="text-[9px] text-slate-400 mt-0.5">{formatSub(it)}</div>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
