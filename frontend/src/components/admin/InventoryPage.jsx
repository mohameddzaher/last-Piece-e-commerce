'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AdminLayout from './AdminLayout';
import DataTable from './DataTable';
import BulkActionBar from './BulkActionBar';
import { productAPI } from '@/utils/endpoints';
import { useSocketEvent } from '@/utils/socket';
import { fmtMoney, fmtDate, locationLabel, locationColor } from '@/utils/format';
import { useAuthStore } from '@/store';

/**
 * Reusable admin inventory view. `bucket` is one of
 * 'saudi' | 'transit' | 'egypt-online' | 'egypt-offline'.
 */
export default function InventoryPage({ bucket, title, description, requiredRoles }) {
  const { user } = useAuthStore();
  const role = user?.role;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  const load = async () => {
    try {
      const res = await productAPI.getInventory(bucket);
      setRows(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [bucket]);

  const DB = { debounceMs: 500 };
  useSocketEvent('product:created', () => load(), [], DB);
  useSocketEvent('product:updated', () => load(), [], DB);
  useSocketEvent('product:deleted', () => load(), [], DB);
  useSocketEvent('shipment:updated', () => load(), [], DB);
  useSocketEvent('shipment:created', () => load(), [], DB);

  const isSuper = role === 'super-admin' || role === 'admin';
  const isSaudi = role === 'saudi-staff';
  const isEgypt = role === 'egypt-staff';

  const showPurchaseCols = isSuper || isSaudi;
  const showSellingCols = isSuper || isEgypt;

  const columns = useMemo(() => {
    const base = [
      {
        key: 'image', label: '',
        render: (r) => (
          <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden relative flex-shrink-0">
            {r.thumbnail ? (
              <Image src={r.thumbnail} alt={r.name} fill className="object-cover" sizes="40px" />
            ) : null}
          </div>
        ),
        exportValue: () => '',
      },
      {
        key: 'name', label: 'Product',
        render: (r) => (
          <div className="min-w-[200px]">
            <div className="font-semibold text-xs">{r.name}</div>
            <div className="text-[10px] text-slate-500">{r.brand || r.brandRef?.name || ''} · {r.size || ''}</div>
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
    ];

    if (showPurchaseCols) {
      base.push({
        key: 'purchasePrice', label: 'Purchase',
        render: (r) => (
          <div className="text-xs leading-tight">
            <div>{fmtMoney(r.purchasePrice, r.purchaseCurrency || 'SAR')}</div>
            {r.purchaseCurrency && r.purchaseCurrency !== 'EGP' && r.purchaseExchangeRate > 0 && (
              <div className="text-[9px] text-slate-500">
                @ {Number(r.purchaseExchangeRate).toFixed(2)} → {fmtMoney(r.purchasePriceEGP || (r.purchasePrice * r.purchaseExchangeRate), 'EGP')}
              </div>
            )}
          </div>
        ),
        exportValue: (r) => r.purchasePrice,
      });
      base.push({
        key: 'landedCost', label: 'Landed',
        render: (r) => <span className="text-xs">{fmtMoney(r.landedCost || r.purchasePrice, r.purchaseCurrency || 'SAR')}</span>,
        exportValue: (r) => r.landedCost,
      });
    }
    if (showSellingCols) {
      base.push({
        key: 'onlinePrice', label: 'Online',
        render: (r) => <span className="text-xs">{r.onlinePrice > 0 ? fmtMoney(r.onlinePrice, r.sellingCurrency) : '—'}</span>,
        exportValue: (r) => r.onlinePrice,
      });
      base.push({
        key: 'offlinePrice', label: 'Boutique',
        render: (r) => <span className="text-xs">{r.offlinePrice > 0 ? fmtMoney(r.offlinePrice, r.sellingCurrency) : '—'}</span>,
        exportValue: (r) => r.offlinePrice,
      });
    }
    if (isSuper) {
      base.push({
        key: 'margin', label: 'Margin',
        render: (r) => {
          // Use the frozen landed cost in EGP that the backend saved at
          // purchase time (purchasePriceEGP). The previous `landedCost * 8.3`
          // hardcoded a stale rate and misreported margins.
          const landed = r.purchasePriceEGP || r.landedCost || 0;
          const sell = r.onlinePrice || r.offlinePrice || 0;
          if (!landed || !sell) return <span className="text-[10px] text-slate-400">—</span>;
          const margin = ((sell - landed) / sell) * 100;
          const color = margin > 50 ? 'text-emerald-500' : margin > 20 ? 'text-amber-500' : 'text-rose-500';
          return <span className={`text-xs font-semibold ${color}`}>{margin.toFixed(0)}%</span>;
        },
        exportValue: () => '',
      });
    }
    base.push({
      key: 'createdAt', label: 'Added',
      render: (r) => <span className="text-[10px] text-slate-500">{fmtDate(r.createdAt)}</span>,
      exportValue: (r) => r.createdAt,
    });
    base.push({
      key: 'actions', label: '',
      render: (r) => (
        <Link
          href={`/admin/products/${r._id}`}
          className="text-[10px] text-blue-500 hover:text-blue-600 font-semibold"
          onClick={(e) => e.stopPropagation()}
        >
          Edit →
        </Link>
      ),
      exportValue: () => '',
    });
    return base;
  }, [isSuper, showPurchaseCols, showSellingCols]);

  const selectedProducts = rows.filter((r) => selected.includes(r._id));

  return (
    <AdminLayout title={title} requiredRoles={requiredRoles}>
      {description && <p className="text-xs text-slate-500 mb-4">{description}</p>}
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['name', 'sku', 'brand', 'batchCode']}
        exportFilename={`inventory-${bucket}`}
        selectable={isSuper}
        onSelectionChange={setSelected}
        emptyMessage={loading ? 'Loading...' : 'No products in this stage yet.'}
      />
      {isSuper && selected.length > 0 && (
        <BulkActionBar
          selectedProducts={selectedProducts}
          bucket={bucket}
          onDone={() => { setSelected([]); load(); }}
        />
      )}
    </AdminLayout>
  );
}
