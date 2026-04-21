'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import { saleAPI, productAPI } from '@/utils/endpoints';
import { useSocketEvent } from '@/utils/socket';
import { fmtMoney, fmtDateTime } from '@/utils/format';
import { FiPlus, FiX } from 'react-icons/fi';
import { useAuthStore } from '@/store';

export default function AdminSales() {
  const { user } = useAuthStore();
  const role = user?.role;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [items, setItems] = useState([]); // { product, productName, sellPrice, minSellPrice }
  const [payment, setPayment] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const load = async () => {
    try {
      const res = await saleAPI.getAll({ limit: 500 });
      setRows(res.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadAvailable = async () => {
    try {
      const [on, off] = await Promise.all([
        productAPI.getInventory('egypt-online').catch(() => ({ data: { data: [] } })),
        productAPI.getInventory('egypt-offline').catch(() => ({ data: { data: [] } })),
      ]);
      setAvailableProducts([...(on.data.data || []), ...(off.data.data || [])]);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); loadAvailable(); }, []);
  useSocketEvent('sale:created', load);
  useSocketEvent('product:updated', loadAvailable);

  const addItem = (p) => {
    if (items.find((i) => i.product === p._id)) return;
    setItems([...items, {
      product: p._id,
      productName: p.name,
      sellPrice: p.offlinePrice || p.onlinePrice || 0,
      minSellPrice: p.minSellPrice || 0,
    }]);
  };
  const removeItem = (id) => setItems(items.filter((i) => i.product !== id));

  const total = items.reduce((s, i) => s + Number(i.sellPrice || 0), 0) - Number(discount || 0);

  const save = async (e) => {
    e.preventDefault();
    if (items.length === 0) return toast.warn('Add at least one item');
    try {
      await saleAPI.create({
        items: items.map((i) => ({ product: i.product, sellPrice: Number(i.sellPrice) })),
        paymentMethod: payment,
        discount: Number(discount) || 0,
        customerName, customerPhone,
      });
      toast.success('Sale logged');
      setItems([]); setDiscount(0); setCustomerName(''); setCustomerPhone('');
      setShowForm(false);
      load(); loadAvailable();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const isSuper = role === 'super-admin' || role === 'admin';
  const showCosts = isSuper;

  const columns = [
    { key: 'saleNumber', label: '#', render: (r) => <span className="font-mono text-[10px]">{r.saleNumber}</span>, exportValue: (r) => r.saleNumber },
    { key: 'createdAt', label: 'When', render: (r) => fmtDateTime(r.createdAt), exportValue: (r) => r.createdAt },
    {
      key: 'items', label: 'Items',
      render: (r) => <span className="text-xs">{r.items?.length || 0} × {r.items?.[0]?.productName || ''}{r.items?.length > 1 ? '...' : ''}</span>,
      exportValue: (r) => (r.items || []).map((i) => i.productName).join('; '),
    },
    { key: 'total', label: 'Total', render: (r) => <span className="text-xs font-semibold">{fmtMoney(r.total, r.currency)}</span>, exportValue: (r) => r.total },
    ...(showCosts ? [
      { key: 'totalCost', label: 'Cost', render: (r) => <span className="text-xs">{fmtMoney(r.totalCost, r.currency)}</span>, exportValue: (r) => r.totalCost },
      { key: 'totalProfit', label: 'Profit', render: (r) => <span className="text-xs font-semibold text-emerald-500">{fmtMoney(r.totalProfit, r.currency)}</span>, exportValue: (r) => r.totalProfit },
    ] : []),
    { key: 'paymentMethod', label: 'Payment', render: (r) => r.paymentMethod, exportValue: (r) => r.paymentMethod },
    { key: 'customerName', label: 'Customer', render: (r) => r.customerName || '—', exportValue: (r) => r.customerName },
    { key: 'soldBy', label: 'Staff', render: (r) => r.soldBy ? `${r.soldBy.firstName || ''} ${r.soldBy.lastName || ''}`.trim() : '—', exportValue: (r) => r.soldBy?.firstName },
  ];

  return (
    <AdminLayout
      title="Boutique Sales"
      requiredRoles={['super-admin', 'admin', 'egypt-staff']}
      actions={
        <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-md hover:bg-emerald-600">
          <FiPlus size={12} /> Log Offline Sale
        </button>
      }
    >
      <p className="text-xs text-slate-500 mb-4">
        Record in-store sales here. Each sold pair is removed from inventory instantly.
      </p>

      {showForm && (
        <form onSubmit={save} className="mb-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Add items</label>
            <div className="max-h-40 overflow-y-auto mt-2 space-y-1 text-xs">
              {availableProducts.map((p) => (
                <button type="button" key={p._id} onClick={() => addItem(p)} className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">
                  <span className="truncate">{p.name}</span>
                  <span className="text-[10px] text-slate-500">{fmtMoney(p.offlinePrice || p.onlinePrice, p.sellingCurrency)}</span>
                </button>
              ))}
              {availableProducts.length === 0 && <div className="text-[11px] text-slate-400">No products available in Egypt inventory.</div>}
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-1">
              {items.map((it) => (
                <div key={it.product} className="flex items-center gap-2 px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800">
                  <span className="flex-1 truncate text-xs">{it.productName}</span>
                  <input
                    type="number"
                    value={it.sellPrice}
                    onChange={(e) => setItems(items.map((i) => i.product === it.product ? { ...i, sellPrice: e.target.value } : i))}
                    className="w-28 px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  {it.minSellPrice > 0 && Number(it.sellPrice) < it.minSellPrice && (
                    <span className="text-[10px] text-rose-500">min {it.minSellPrice}</span>
                  )}
                  <button type="button" onClick={() => removeItem(it.product)} className="p-1 text-rose-500">
                    <FiX size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <input placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <select value={payment} onChange={(e) => setPayment(e.target.value)} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Transfer</option>
              <option value="other">Other</option>
            </select>
            <input type="number" placeholder="Discount" value={discount} onChange={(e) => setDiscount(e.target.value)} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="text-sm font-bold">Total: {fmtMoney(total, 'EGP')}</div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs rounded-md bg-slate-200 dark:bg-slate-700">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-xs font-semibold rounded-md bg-emerald-500 text-white">Confirm Sale</button>
            </div>
          </div>
        </form>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['saleNumber', 'customerName', 'customerPhone']}
        exportFilename="sales"
        emptyMessage={loading ? 'Loading...' : 'No sales recorded yet.'}
      />
    </AdminLayout>
  );
}
