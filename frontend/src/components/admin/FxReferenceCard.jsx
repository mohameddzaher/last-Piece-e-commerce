'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiEdit2, FiDownloadCloud, FiClock, FiAlertCircle, FiCheck, FiX, FiRotateCcw,
} from 'react-icons/fi';
import { fxAPI } from '@/utils/endpoints';
import { fmtDateTime } from '@/utils/format';

/**
 * Admin panel for managing the "book rate" — the fixed FX rate used as the
 * default for new purchases and price setting. Super-admin updates it when
 * the market has moved enough to matter.
 *
 * Flow:
 *  1. View current reference rate per pair (SAR→EGP, USD→EGP) + when it was set.
 *  2. See today's live market rate next to it + the drift %.
 *  3. One click to "Update to today's market" OR type a custom rate.
 *  4. Every change is logged.
 */
export default function FxReferenceCard({ pairs = [['SAR', 'EGP'], ['USD', 'EGP']] }) {
  const [refs, setRefs] = useState([]);
  const [live, setLive] = useState({});
  const [editing, setEditing] = useState(null); // {from, to}
  const [manualRate, setManualRate] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [history, setHistory] = useState([]);

  const load = async () => {
    const refsRes = await fxAPI.getReferences().catch(() => ({ data: { data: [] } }));
    setRefs(refsRes.data.data || []);
    const liveMap = {};
    for (const [from, to] of pairs) {
      try {
        const r = await fxAPI.current(from, to);
        liveMap[`${from}_${to}`] = r.data.data;
      } catch {}
    }
    setLive(liveMap);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refFor = (from, to) => refs.find((r) => r.from === from && r.to === to);

  const startEdit = (from, to) => {
    const r = refFor(from, to);
    setEditing({ from, to });
    setManualRate(r?.rate?.toString() || live[`${from}_${to}`]?.rate?.toFixed(4) || '');
    setNote('');
  };

  const cancel = () => {
    setEditing(null);
    setManualRate('');
    setNote('');
  };

  const saveManual = async () => {
    if (!editing) return;
    const rate = Number(manualRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      toast.warn('Enter a positive number');
      return;
    }
    try {
      setBusy(true);
      await fxAPI.updateReference({ from: editing.from, to: editing.to, rate, note });
      toast.success(`${editing.from} → ${editing.to} updated to ${rate}`);
      cancel();
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const pullLive = async (from, to) => {
    try {
      setBusy(true);
      const res = await fxAPI.updateReference({ from, to, useLive: true, note: 'Refreshed to market rate' });
      toast.success(`${from} → ${to} refreshed to market rate ${res.data.data.rate.toFixed(4)}`);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleHistory = async (from, to) => {
    const key = `${from}_${to}`;
    if (expandedHistory === key) {
      setExpandedHistory(null);
      return;
    }
    setExpandedHistory(key);
    try {
      const r = await fxAPI.referenceHistory(from, to);
      setHistory(r.data.data || []);
    } catch {
      setHistory([]);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Reference FX Rate</h4>
          <div className="text-[10px] text-slate-400">
            The locked rate used as default for all new purchases. Update it when the market moves enough to matter.
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {pairs.map(([from, to]) => {
          const ref = refFor(from, to);
          const liveRate = live[`${from}_${to}`]?.rate;
          const drift = ref && liveRate ? ((liveRate - ref.rate) / ref.rate) * 100 : null;
          const key = `${from}_${to}`;
          const isEditing = editing && editing.from === from && editing.to === to;
          return (
            <div key={key} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                      1 {from} →
                    </div>
                    <div className="flex items-baseline gap-1.5 tabular-nums">
                      <span className="text-xl font-bold text-slate-900 dark:text-white">
                        {ref ? Number(ref.rate).toFixed(3) : '—'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">{to}</span>
                    </div>
                    {ref && (
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <FiClock size={9} />
                        Set {fmtDateTime(ref.setAt)}
                        {ref.setBy && ` · by ${ref.setBy.firstName || ''}`}
                        {ref.source === 'live' ? ' · from market' : ' · manual'}
                      </div>
                    )}
                    {liveRate && (
                      <div className="text-[10px] mt-1 flex items-center gap-2">
                        <span className="text-slate-500">Market today: <strong className="text-slate-700 dark:text-slate-300 tabular-nums">{liveRate.toFixed(3)}</strong></span>
                        {drift != null && (
                          <span className={`font-semibold ${Math.abs(drift) >= 3 ? 'text-amber-600' : 'text-slate-500'}`}>
                            {drift >= 0 ? '+' : ''}{drift.toFixed(1)}% drift
                          </span>
                        )}
                      </div>
                    )}
                    {drift != null && Math.abs(drift) >= 3 && (
                      <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-md text-[10px] text-amber-700">
                        <FiAlertCircle size={10} /> Market moved {Math.abs(drift).toFixed(1)}% from your reference — consider refreshing.
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => pullLive(from, to)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-60"
                        title="Pull today's market rate and lock it"
                      >
                        <FiDownloadCloud size={10} /> Use market
                      </button>
                      <button
                        onClick={() => startEdit(from, to)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600"
                      >
                        <FiEdit2 size={10} /> Manual
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      New rate — 1 {from} =
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={manualRate}
                      onChange={(e) => setManualRate(e.target.value)}
                      autoFocus
                      className="mt-1 w-full px-3 py-1.5 text-sm tabular-nums rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Note (optional)</label>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Bank rate, special batch, etc."
                      className="mt-1 w-full px-3 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancel}
                      className="inline-flex items-center gap-1 px-3 py-1 text-[11px] bg-slate-200 dark:bg-slate-700 rounded-md"
                    >
                      <FiX size={10} /> Cancel
                    </button>
                    <button
                      onClick={saveManual}
                      disabled={busy}
                      className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold bg-blue-500 text-white rounded-md disabled:opacity-60"
                    >
                      <FiCheck size={10} /> {busy ? 'Saving...' : 'Lock rate'}
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => toggleHistory(from, to)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <span className="inline-flex items-center gap-1"><FiRotateCcw size={10} /> History</span>
                  <span>{expandedHistory === key ? '−' : '+'}</span>
                </button>
                {expandedHistory === key && (
                  <div className="px-3 py-2 text-[10px] space-y-1 bg-slate-50 dark:bg-slate-800/50">
                    {history.length === 0 ? (
                      <div className="text-slate-400">No changes yet.</div>
                    ) : (
                      history.map((h, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 py-0.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                          <span className="tabular-nums">
                            {h.current && <span className="text-blue-500 font-bold mr-1">●</span>}
                            {Number(h.rate).toFixed(3)} · {h.source}
                          </span>
                          <span className="text-slate-400">
                            {fmtDateTime(h.setAt)}
                            {h.setBy?.firstName && ` · ${h.setBy.firstName}`}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-[10px] text-slate-400 leading-relaxed">
        New products registered in Saudi inventory auto-fill their rate from here.
        Existing products keep whatever rate they were saved with — nothing is ever changed retroactively.
      </div>
    </div>
  );
}
