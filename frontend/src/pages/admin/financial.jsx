'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import DataTable from '@/components/admin/DataTable';
import { expenseAPI, saleAPI, adminAPI } from '@/utils/endpoints';
import { useSocketEvent } from '@/utils/socket';
import { fmtMoney, fmtPct, fmtDate } from '@/utils/format';
import { FiTrendingUp, FiDollarSign, FiPackage, FiAlertTriangle } from 'react-icons/fi';

const toEGP = (amt, cur) => (cur === 'SAR' ? amt * 8.3 : cur === 'USD' ? amt * 48 : amt || 0);

export default function AdminFinancial() {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [s, e, o] = await Promise.all([
        saleAPI.getAll({ limit: 2000 }).catch(() => ({ data: { data: [] } })),
        expenseAPI.getAll({ limit: 2000 }).catch(() => ({ data: { data: [] } })),
        adminAPI.getOrders({ limit: 2000 }).catch(() => ({ data: { data: [] } })),
      ]);
      setSales(s.data.data || []);
      setExpenses(e.data.data || []);
      setOrders(o.data.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useSocketEvent('dashboard:refresh', load);
  useSocketEvent('sale:created', load);
  useSocketEvent('expense:created', load);
  useSocketEvent('order:created', load);

  const offlineRevenue = sales.reduce((s, x) => s + (x.total || 0), 0);
  const onlineRevenue = orders.filter((o) => o.payment?.status === 'completed').reduce((s, x) => s + (x.pricing?.total || 0), 0);
  const revenue = offlineRevenue + onlineRevenue;
  const cogs = sales.reduce((s, x) => s + (x.totalCost || 0), 0);
  const grossProfit = sales.reduce((s, x) => s + (x.totalProfit || 0), 0);
  const opex = expenses.reduce((s, x) => s + toEGP(x.amount, x.currency), 0);
  const net = grossProfit - opex;
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  // Expenses breakdown
  const byCategory = expenses.reduce((acc, x) => {
    const v = toEGP(x.amount, x.currency);
    acc[x.category] = (acc[x.category] || 0) + v;
    return acc;
  }, {});
  const breakdownRows = Object.entries(byCategory)
    .map(([category, amount]) => ({ _id: category, category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <AdminLayout title="Financial Report">
      <p className="text-xs text-slate-500 mb-6">
        Live P&L. Gross profit covers sold inventory; operating expenses track your overhead (salaries, rent, marketing) separately — the way you asked.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Revenue" value={fmtMoney(revenue)} sub={`${sales.length} boutique · ${orders.length} online`} icon={FiDollarSign} accent="emerald" />
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
