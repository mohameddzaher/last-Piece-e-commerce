'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import DataTable from '@/components/admin/DataTable';
import { expenseAPI, saleAPI, adminAPI, fxAPI } from '@/utils/endpoints';
import { useSocketEvent } from '@/utils/socket';
import { fmtMoney, fmtPct, fmtDate } from '@/utils/format';
import { FiTrendingUp, FiDollarSign, FiPackage, FiAlertTriangle } from 'react-icons/fi';
import { toEGP, ratesFromReferences } from '@/utils/fxConvert';

const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90, all: null };
const inPeriod = (date, days) => {
  if (days == null) return true;
  if (!date) return false;
  return Date.now() - new Date(date).getTime() < days * 86400000;
};

export default function AdminFinancial() {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [fxRates, setFxRates] = useState({ EGP: 1 });
  const [loading, setLoading] = useState(true);
  // Default to 30d so this page agrees with the Dashboard's default lens —
  // the QA round flagged that having Dashboard=30d but Financial=all-time
  // produced two different OpEx numbers and read like a bug.
  const [period, setPeriod] = useState('30d');

  const load = async () => {
    try {
      const [s, e, o, fx] = await Promise.all([
        saleAPI.getAll({ limit: 2000 }).catch(() => ({ data: { data: [] } })),
        expenseAPI.getAll({ limit: 2000 }).catch(() => ({ data: { data: [] } })),
        adminAPI.getOrders({ limit: 2000 }).catch(() => ({ data: { data: [] } })),
        fxAPI.getReferences().catch(() => ({ data: { data: [] } })),
      ]);
      setSales(s.data.data || []);
      setExpenses(e.data.data || []);
      setOrders(o.data.data || []);
      setFxRates(ratesFromReferences(fx.data?.data || []));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useSocketEvent('dashboard:refresh', load);
  useSocketEvent('sale:created', load);
  useSocketEvent('expense:created', load);
  useSocketEvent('order:created', load);

  const days = PERIOD_DAYS[period];

  const salesP = useMemo(() => sales.filter((x) => inPeriod(x.createdAt, days)), [sales, days]);
  const ordersP = useMemo(() => orders.filter((x) => inPeriod(x.createdAt, days)), [orders, days]);
  const expensesP = useMemo(() => expenses.filter((x) => inPeriod(x.incurredOn || x.createdAt, days)), [expenses, days]);

  const offlineRevenue = salesP.reduce((s, x) => s + (x.total || 0), 0);
  // Match the Dashboard: every non-cancelled order counts as revenue (COD
  // dominates here, so waiting for `payment.status='completed'` would zero
  // the report for the first few days).
  const liveOrders = ordersP.filter((o) => !['cancelled', 'returned'].includes(o.status));
  const onlineRevenue = liveOrders.reduce((s, x) => s + (x.pricing?.total || 0), 0);
  const revenue = offlineRevenue + onlineRevenue;
  const cogs = salesP.reduce((s, x) => s + (x.totalCost || 0), 0);
  const grossProfit = salesP.reduce((s, x) => s + (x.totalProfit || 0), 0);
  const opex = expensesP.reduce((s, x) => s + toEGP(x.amount || 0, x.currency || 'EGP', fxRates), 0);
  const net = grossProfit - opex;
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  // Expenses breakdown
  const byCategory = expensesP.reduce((acc, x) => {
    const v = toEGP(x.amount || 0, x.currency || 'EGP', fxRates);
    acc[x.category] = (acc[x.category] || 0) + v;
    return acc;
  }, {});
  const breakdownRows = Object.entries(byCategory)
    .map(([category, amount]) => ({ _id: category, category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <AdminLayout
      title="Financial Report"
      requiredRoles={['super-admin']}
      actions={
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
      }
    >
      <p className="text-xs text-slate-500 mb-6">
        Live P&amp;L for <strong>{period === 'all' ? 'all time' : `the last ${period}`}</strong>. Switch the period above to match the Dashboard. Gross profit covers sold inventory; operating expenses track your overhead (salaries, rent, marketing) separately.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Revenue" value={fmtMoney(revenue)} sub={`${salesP.length} boutique · ${liveOrders.length} online`} icon={FiDollarSign} accent="emerald" />
        <StatCard label="COGS (Landed)" value={fmtMoney(cogs)} icon={FiPackage} accent="amber" />
        <StatCard label="Gross Profit" value={fmtMoney(grossProfit)} sub={`Margin ${fmtPct(margin)}`} icon={FiTrendingUp} accent="blue" />
        <StatCard label="Operating Expenses" value={fmtMoney(opex)} icon={FiAlertTriangle} accent="rose" />
      </div>

      <div className={`rounded-xl p-5 text-white mb-6 ${net >= 0 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-rose-500 to-rose-600'}`}>
        <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Net Profit</div>
        <div className="text-3xl font-bold mt-1">{fmtMoney(net)}</div>
      </div>

      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Expenses by category</h3>
      <DataTable
        columns={[
          { key: 'category', label: 'Category', render: (r) => <span className="font-semibold text-xs">{r.category}</span>, exportValue: (r) => r.category },
          { key: 'amount', label: 'Amount', render: (r) => fmtMoney(r.amount), exportValue: (r) => r.amount },
          {
            key: 'share', label: 'Share',
            render: (r) => fmtPct(opex > 0 ? (r.amount / opex) * 100 : 0),
            exportValue: (r) => (opex > 0 ? (r.amount / opex) * 100 : 0),
          },
        ]}
        rows={breakdownRows}
        exportFilename="financial-breakdown"
        emptyMessage="No expenses recorded."
      />
      {loading && <div className="text-xs text-slate-400 mt-4">Loading...</div>}
    </AdminLayout>
  );
}
