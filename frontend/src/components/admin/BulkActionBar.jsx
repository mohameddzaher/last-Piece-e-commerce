'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiX, FiCloud, FiShoppingBag, FiLayers, FiTruck } from 'react-icons/fi';
import { productAPI, shipmentAPI } from '@/utils/endpoints';

/**
 * Floating bar that appears when rows are selected on an inventory page.
 * Available actions depend on which bucket you're in:
 *   - saudi: create shipment
 *   - transit: mark delivered (via Shipments page usually, but we show a hint)
 *   - egypt-*: send to online / offline / both (+ set prices)
 */
export default function BulkActionBar({ selectedProducts, bucket, onDone }) {
  const [mode, setMode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [onlinePrice, setOnlinePrice] = useState('');
  const [offlinePrice, setOfflinePrice] = useState('');
  const [minSellPrice, setMinSellPrice] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [customsFees, setCustomsFees] = useState('');
  const [notes, setNotes] = useState('');

  const ids = selectedProducts.map((p) => p._id);

  const sendTo = async (location) => {
    try {
      setBusy(true);
      await productAPI.bulkLocation({
        productIds: ids,
        location,
        onlinePrice: onlinePrice ? Number(onlinePrice) : undefined,
        offlinePrice: offlinePrice ? Number(offlinePrice) : undefined,
        minSellPrice: minSellPrice ? Number(minSellPrice) : undefined,
        notes: notes || undefined,
      });
      toast.success(`${ids.length} products moved.`);
      onDone?.();
      setMode(null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally { setBusy(false); }
  };

  const createShipment = async () => {
    try {
      setBusy(true);
      await shipmentAPI.create({
        products: ids,
        shippingCost: shippingCost ? Number(shippingCost) : 0,
        customsFees: customsFees ? Number(customsFees) : 0,
        shippingCurrency: 'SAR',
        notes,
        status: 'in-transit',
      });
      toast.success(`Shipment created with ${ids.length} products.`);
      onDone?.();
      setMode(null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-semibold">{selectedProducts.length} products selected</div>
          <div className="text-[10px] text-slate-500">Choose a bulk action</div>
        </div>
        <button onClick={onDone} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
          <FiX size={14} />
        </button>
      </div>

      {!mode && (
        <div className="flex flex-wrap gap-2">
          {bucket === 'saudi' && (
            <button
              onClick={() => setMode('shipment')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600"
            >
              <FiTruck size={14} /> Create Shipment → Egypt
            </button>
          )}
          {(bucket === 'egypt-online' || bucket === 'egypt-offline' || bucket === 'transit') && (
            <>
              <button onClick={() => setMode('online')} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600">
                <FiCloud size={14} /> Send to Online
              </button>
              <button onClick={() => setMode('offline')} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-purple-500 text-white hover:bg-purple-600">
                <FiShoppingBag size={14} /> Send to Boutique
              </button>
              <button onClick={() => setMode('both')} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-fuchsia-500 text-white hover:bg-fuchsia-600">
                <FiLayers size={14} /> Online + Boutique
              </button>
            </>
          )}
        </div>
      )}

      {mode === 'shipment' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input type="number" placeholder="Shipping cost (SAR)" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} className="px-2 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <input type="number" placeholder="Customs fees (SAR)" value={customsFees} onChange={(e) => setCustomsFees(e.target.value)} className="px-2 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="px-2 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <div className="md:col-span-3 flex justify-end gap-2">
            <button onClick={() => setMode(null)} className="px-3 py-1.5 rounded-md text-xs bg-slate-200 dark:bg-slate-700">Cancel</button>
            <button disabled={busy} onClick={createShipment} className="px-4 py-1.5 rounded-md text-xs font-semibold bg-blue-500 text-white disabled:opacity-60">
              {busy ? 'Creating...' : 'Create Shipment'}
            </button>
          </div>
        </div>
      )}

      {(mode === 'online' || mode === 'offline' || mode === 'both') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {(mode === 'online' || mode === 'both') && (
            <input type="number" placeholder="Online price (EGP)" value={onlinePrice} onChange={(e) => setOnlinePrice(e.target.value)} className="px-2 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          )}
          {(mode === 'offline' || mode === 'both') && (
            <input type="number" placeholder="Boutique price (EGP)" value={offlinePrice} onChange={(e) => setOfflinePrice(e.target.value)} className="px-2 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          )}
          <input type="number" placeholder="Min sell price (EGP)" value={minSellPrice} onChange={(e) => setMinSellPrice(e.target.value)} className="px-2 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <div className="md:col-span-3 flex justify-end gap-2">
            <button onClick={() => setMode(null)} className="px-3 py-1.5 rounded-md text-xs bg-slate-200 dark:bg-slate-700">Cancel</button>
            <button
              disabled={busy}
              onClick={() => sendTo(mode === 'both' ? 'egypt-both' : mode === 'online' ? 'egypt-online' : 'egypt-offline')}
              className="px-4 py-1.5 rounded-md text-xs font-semibold bg-emerald-500 text-white disabled:opacity-60"
            >
              {busy ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
