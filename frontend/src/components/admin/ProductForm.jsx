'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { categoryAPI, brandAPI, uploadAPI, fxAPI } from '@/utils/endpoints';
import { useAuthStore } from '@/store';
import { FiUpload, FiX, FiSave, FiRefreshCw } from 'react-icons/fi';
import { getRate } from '@/utils/fx';

// Pulls today's live SAR→EGP rate from our fx helper and fills the field.
function ExchangeRateHelper({ from, to, onChange }) {
  const [busy, setBusy] = useState(false);
  const [lastRate, setLastRate] = useState(null);
  if (from === to) return null;
  const fetchNow = async () => {
    try {
      setBusy(true);
      const rate = await getRate(from, to);
      setLastRate(rate);
      onChange(rate.toFixed(4));
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={fetchNow}
      disabled={busy}
      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-md"
      title={`Fetch live ${from} → ${to} rate`}
    >
      <FiRefreshCw size={10} className={busy ? 'animate-spin' : ''} />
      {busy ? 'Fetching...' : lastRate ? `${from} = ${lastRate.toFixed(2)} ${to}` : 'Fetch live rate'}
    </button>
  );
}

function MarginPreview({ form }) {
  const purchase = Number(form.purchasePrice || 0);
  const rate =
    form.purchaseCurrency === 'EGP' ? 1 : Number(form.purchaseExchangeRate || 0);
  const landedEGP = purchase * (rate || 0);
  const online = Number(form.onlinePrice || 0);
  const offline = Number(form.offlinePrice || 0);
  const min = Number(form.minSellPrice || 0);

  const margin = (sell) => {
    if (!landedEGP || !sell) return null;
    const profit = sell - landedEGP;
    const pct = (profit / sell) * 100;
    return { profit, pct };
  };

  const onlineM = margin(online);
  const offlineM = margin(offline);
  const minM = margin(min);

  const fmt = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5">
      <div>Landed cost (in EGP, locked at purchase): <strong>{fmt(landedEGP)} EGP</strong></div>
      {onlineM && (
        <div>
          Online → profit <strong>{fmt(onlineM.profit)} EGP</strong> (<strong>{onlineM.pct.toFixed(1)}%</strong> margin)
        </div>
      )}
      {offlineM && (
        <div>
          Boutique → profit <strong>{fmt(offlineM.profit)} EGP</strong> (<strong>{offlineM.pct.toFixed(1)}%</strong> margin)
        </div>
      )}
      {minM && (
        <div className={minM.profit < 0 ? 'text-rose-600 font-semibold' : ''}>
          Minimum sell → profit <strong>{fmt(minM.profit)} EGP</strong>{' '}
          ({minM.pct.toFixed(1)}% margin) {minM.profit < 0 && '⚠ below landed cost'}
        </div>
      )}
    </div>
  );
}

/**
 * Product form shared between create and edit.
 * Respects role:
 *   - saudi-staff: only purchasing fields
 *   - egypt-staff: only selling fields
 *   - super-admin/admin: everything
 */
export default function ProductForm({ initial = {}, onSubmit, editing = false }) {
  const { user } = useAuthStore();
  const role = user?.role;
  const isSuper = role === 'super-admin' || role === 'admin';
  const isSaudi = role === 'saudi-staff';
  const isEgypt = role === 'egypt-staff';

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [referenceRates, setReferenceRates] = useState([]);
  const [form, setForm] = useState({
    name: '', description: '', shortDescription: '', category: '', brandRef: '',
    brand: '', size: '', color: '', condition: 'new',
    images: [], thumbnail: '',
    purchasePrice: '', purchaseCurrency: 'SAR',
    purchaseExchangeRate: '', // SAR → EGP at purchase time
    supplier: { name: '', city: '', contact: '' }, batchCode: '',
    onlinePrice: '', offlinePrice: '', minSellPrice: '', sellingCurrency: 'EGP',
    status: 'draft', location: 'saudi',
    tags: [],
    faqs: [],
    ...initial,
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    categoryAPI.getAll().then((r) => setCategories(r.data.data || [])).catch(() => {});
    brandAPI.getAll().then((r) => setBrands(r.data.data || [])).catch(() => {});
    fxAPI.getReferences()
      .then((r) => setReferenceRates(r.data.data || []))
      .catch(() => {});
  }, []);

  // Auto-fill the exchange rate on NEW products: use the locked reference rate
  // for the chosen currency. User can still override manually.
  useEffect(() => {
    if (editing) return;
    if (form.purchaseCurrency === 'EGP') return;
    if (form.purchaseExchangeRate) return;
    const ref = referenceRates.find(
      (r) => r.from === form.purchaseCurrency && r.to === 'EGP',
    );
    if (ref?.rate) {
      setForm((f) => ({ ...f, purchaseExchangeRate: String(ref.rate) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceRates, form.purchaseCurrency]);

  useEffect(() => {
    if (initial && Object.keys(initial).length > 0) {
      setForm((f) => ({
        ...f,
        ...initial,
        supplier: initial.supplier || { name: '', city: '', contact: '' },
        brandRef: initial.brandRef?._id || initial.brandRef || '',
        category: initial.category?._id || initial.category || '',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?._id]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setSupplier = (patch) => setForm((f) => ({ ...f, supplier: { ...f.supplier, ...patch } }));

  const uploadImages = async (files) => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('files', f));
      const res = await uploadAPI.uploadMultiple(fd);
      const urls = (res.data.data || []).map((x) => x.url || x);
      const imgs = urls.map((u, i) => ({ url: u, alt: form.name || '', isPrimary: form.images.length === 0 && i === 0 }));
      set({
        images: [...(form.images || []), ...imgs],
        thumbnail: form.thumbnail || imgs[0]?.url || '',
      });
    } catch (e) {
      // Fallback: prompt a URL
      const url = prompt('Upload failed. Paste image URL instead:');
      if (url) set({ images: [...(form.images || []), { url, alt: form.name || '', isPrimary: form.images.length === 0 }], thumbnail: form.thumbnail || url });
    } finally { setUploading(false); }
  };

  const removeImage = (idx) => set({ images: form.images.filter((_, i) => i !== idx) });

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      ['purchasePrice', 'onlinePrice', 'offlinePrice', 'minSellPrice'].forEach((k) => {
        if (payload[k] === '' || payload[k] == null) delete payload[k];
        else payload[k] = Number(payload[k]);
      });
      if (!payload.brandRef) delete payload.brandRef;
      if (!payload.category) delete payload.category;
      await onSubmit?.(payload);
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Basics */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Basics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input required placeholder="Product name" value={form.name} onChange={(e) => set({ name: e.target.value })} className="px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 md:col-span-2" />
          <textarea required placeholder="Description" value={form.description} onChange={(e) => set({ description: e.target.value })} className="px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 md:col-span-2" rows={3} />
          <input placeholder="Short description" value={form.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })} className="px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 md:col-span-2" />
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Category (Men / Women / Kids)</label>
            <select
              value={form.category}
              onChange={(e) => {
                const c = categories.find((x) => x._id === e.target.value);
                // Mirror the category's slug into the `gender` field (used for filtering on the site),
                // so we don't need a separate Gender dropdown.
                const slug = c?.slug || '';
                const genderMap = { men: 'men', women: 'women', kids: 'kids' };
                set({ category: e.target.value, gender: genderMap[slug] || 'unisex' });
              }}
              required
              className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="">Select category…</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Brand</label>
            <select
              value={form.brandRef}
              onChange={(e) => {
                const b = brands.find((x) => x._id === e.target.value);
                set({ brandRef: e.target.value, brand: b?.name || form.brand });
              }}
              className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="">Select brand…</option>
              {brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Size</label>
            <input placeholder="e.g. 42" value={form.size} onChange={(e) => set({ size: e.target.value })} className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Color</label>
            <input placeholder="e.g. White / Red" value={form.color} onChange={(e) => set({ color: e.target.value })} className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Condition</label>
            <select value={form.condition} onChange={(e) => set({ condition: e.target.value })} className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <option value="new">Brand new</option>
              <option value="like-new">Like new</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Images</h3>
        <div className="flex flex-wrap gap-2">
          {(form.images || []).map((img, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
              <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 p-0.5 bg-black/60 rounded text-white">
                <FiX size={10} />
              </button>
            </div>
          ))}
          <label className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-[10px] text-slate-500 cursor-pointer hover:border-blue-500">
            <FiUpload size={14} />
            <span className="mt-1">{uploading ? 'Uploading...' : 'Upload'}</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadImages(e.target.files)} />
          </label>
          <input placeholder="Or paste image URL" onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const url = e.currentTarget.value.trim();
              if (url) {
                set({ images: [...(form.images || []), { url, alt: form.name, isPrimary: form.images.length === 0 }], thumbnail: form.thumbnail || url });
                e.currentTarget.value = '';
              }
            }
          }} className="flex-1 min-w-[200px] px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        </div>
      </section>

      {/* Purchasing — Saudi side */}
      {(isSuper || isSaudi) && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Purchasing (Saudi side)</h3>
            <ExchangeRateHelper
              from={form.purchaseCurrency}
              to="EGP"
              value={form.purchaseExchangeRate}
              onChange={(rate) => set({ purchaseExchangeRate: rate })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Purchase price</label>
              <input type="number" placeholder="How much you paid" value={form.purchasePrice} onChange={(e) => set({ purchasePrice: e.target.value })} className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Currency paid in</label>
              <select value={form.purchaseCurrency} onChange={(e) => set({ purchaseCurrency: e.target.value })} className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <option value="SAR">SAR (Saudi Riyal)</option>
                <option value="USD">USD</option>
                <option value="EGP">EGP</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Exchange rate → EGP {form.purchaseCurrency === 'EGP' ? '(N/A)' : `(${form.purchaseCurrency} = ? EGP)`}
              </label>
              <input
                type="number"
                step="0.0001"
                placeholder={form.purchaseCurrency === 'SAR' ? 'e.g. 13.25' : '1 unit = ? EGP'}
                value={form.purchaseExchangeRate}
                onChange={(e) => set({ purchaseExchangeRate: e.target.value })}
                disabled={form.purchaseCurrency === 'EGP'}
                className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
              />
            </div>
            <div className="md:col-span-3 text-[11px] text-slate-500 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-md p-2">
              💡 <strong>FX is frozen at purchase time.</strong> We store the rate the day you bought this pair, so later P&L reports show the real cost in EGP — even when the rate changes.
              {(() => {
                const ref = referenceRates.find(
                  (r) => r.from === form.purchaseCurrency && r.to === 'EGP',
                );
                if (!ref || form.purchaseCurrency === 'EGP') return null;
                const matchesRef = ref && Math.abs(Number(form.purchaseExchangeRate) - ref.rate) < 0.001;
                return (
                  <span className="block mt-1">
                    Reference rate (book): <strong className="tabular-nums">{Number(ref.rate).toFixed(3)}</strong>
                    {matchesRef ? ' · using reference' : ' · override in effect'}
                  </span>
                );
              })()}
              {form.purchasePrice && form.purchaseExchangeRate && form.purchaseCurrency !== 'EGP' && (
                <span className="block mt-1 font-semibold text-slate-700 dark:text-slate-300">
                  → Equivalent: {(Number(form.purchasePrice) * Number(form.purchaseExchangeRate)).toLocaleString()} EGP
                </span>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Batch code (optional)</label>
              <input placeholder="e.g. BATCH-001" value={form.batchCode || ''} onChange={(e) => set({ batchCode: e.target.value })} className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Supplier name</label>
              <input placeholder="Store / dealer" value={form.supplier?.name || ''} onChange={(e) => setSupplier({ name: e.target.value })} className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Supplier city</label>
              <input placeholder="Riyadh, Jeddah..." value={form.supplier?.city || ''} onChange={(e) => setSupplier({ city: e.target.value })} className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Supplier contact</label>
              <input placeholder="Phone / Instagram" value={form.supplier?.contact || ''} onChange={(e) => setSupplier({ contact: e.target.value })} className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            </div>
          </div>
        </section>
      )}

      {/* Selling — Egypt side. Only super-admin sets these. */}
      {isSuper && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Selling (Egypt side) — super-admin only</h3>
          <p className="text-[11px] text-slate-500">Egypt staff can see these prices but <strong>cannot sell below "Minimum sell price"</strong>. Set it to protect your margin.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-1">Online price (website)</label>
              <input type="number" placeholder="e.g. 38500" value={form.onlinePrice} onChange={(e) => set({ onlinePrice: e.target.value })} className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-purple-600 mb-1">Boutique price (in-store)</label>
              <input type="number" placeholder="e.g. 36000" value={form.offlinePrice} onChange={(e) => set({ offlinePrice: e.target.value })} className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-rose-600 mb-1">Minimum sell price (floor)</label>
              <input type="number" placeholder="Staff can't sell below this" value={form.minSellPrice} onChange={(e) => set({ minSellPrice: e.target.value })} className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Selling currency</label>
              <select value={form.sellingCurrency} onChange={(e) => set({ sellingCurrency: e.target.value })} className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <option value="EGP">EGP</option>
                <option value="SAR">SAR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Stage / Location</label>
              <select value={form.location} onChange={(e) => set({ location: e.target.value })} className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <option value="saudi">Saudi inventory</option>
                <option value="transit">In transit</option>
                <option value="egypt-online">Egypt — Online</option>
                <option value="egypt-offline">Egypt — Boutique</option>
                <option value="egypt-both">Egypt — Online + Boutique</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Status</label>
              <select value={form.status} onChange={(e) => set({ status: e.target.value })} className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <option value="draft">Draft (hidden)</option>
                <option value="active">Active (live on site)</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>

            {/* Margin preview */}
            {form.purchasePrice && (form.onlinePrice || form.offlinePrice) && (
              <div className="md:col-span-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-md">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">Margin preview</div>
                <MarginPreview form={form} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAQs — per-product (sizing notes, condition story, etc.) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Product FAQs</h3>
            <p className="text-[11px] text-slate-500">Questions specific to this pair (sizing, story, condition).</p>
          </div>
          <button
            type="button"
            onClick={() => set({ faqs: [...(form.faqs || []), { question: '', answer: '' }] })}
            className="px-2.5 py-1 text-[11px] font-semibold bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-md"
          >
            + Add Q&A
          </button>
        </div>
        {(form.faqs || []).length === 0 && (
          <div className="text-[11px] text-slate-400 italic">No FAQs yet. Add the questions customers ask most.</div>
        )}
        <div className="space-y-2">
          {(form.faqs || []).map((f, i) => (
            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-start gap-2">
                <input
                  placeholder="Question (e.g., Does this run true to size?)"
                  value={f.question}
                  onChange={(e) => set({ faqs: form.faqs.map((x, j) => j === i ? { ...x, question: e.target.value } : x) })}
                  className="flex-1 px-3 py-1.5 text-xs rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => set({ faqs: form.faqs.filter((_, j) => j !== i) })}
                  className="p-1.5 rounded text-rose-500 hover:bg-rose-500/10"
                  aria-label="Remove"
                >
                  <FiX size={12} />
                </button>
              </div>
              <textarea
                placeholder="Answer"
                rows={2}
                value={f.answer}
                onChange={(e) => set({ faqs: form.faqs.map((x, j) => j === i ? { ...x, answer: e.target.value } : x) })}
                className="w-full px-3 py-1.5 text-xs rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <button type="submit" disabled={submitting} className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-60">
          <FiSave size={13} />
          {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Register Product'}
        </button>
      </div>
    </form>
  );
}
