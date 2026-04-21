'use client';

import { useEffect, useState } from 'react';
import { FiTrendingUp, FiTrendingDown, FiInfo } from 'react-icons/fi';
import { fxAPI } from '@/utils/endpoints';
import { fmtMoney } from '@/utils/format';

/**
 * "If I valued my unsold inventory at today's FX rate instead of the rate I
 * paid at, what's the difference?" — unrealized gain/loss on FX alone.
 *
 * Positive = the currency moved AGAINST the EGP since we bought. In EGP terms,
 * our existing stock is worth more than it cost; replacing it today would be
 * more expensive. In other words: we "saved" by buying earlier.
 *
 * Negative = EGP strengthened. Replacing today is cheaper than what we paid.
 */
export default function FxImpactCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fxAPI.impact()
      .then((r) => { if (!cancelled) setData(r.data.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-2" />
        <div className="h-7 w-40 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
      </div>
    );
  }

  if (!data || !data.productCount) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">FX Impact on Inventory</h4>
        <div className="text-[11px] text-slate-400">No non-EGP unsold inventory to evaluate.</div>
      </div>
    );
  }

  const up = data.unrealizedEGP >= 0;
  const accent = up
    ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 border-emerald-500/30'
    : 'bg-gradient-to-br from-rose-500/10 to-rose-500/0 border-rose-500/30';
  const txtAccent = up ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div className={`rounded-xl border p-4 ${accent}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">FX Impact on Inventory</h4>
          <div className="text-[10px] text-slate-500">
            {data.productCount} unsold pair{data.productCount > 1 ? 's' : ''} · at today's rate
          </div>
        </div>
        {up ? <FiTrendingUp className={txtAccent} size={16} /> : <FiTrendingDown className={txtAccent} size={16} />}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${txtAccent}`}>
          {up ? '+' : ''}{fmtMoney(data.unrealizedEGP)}
        </span>
        <span className={`text-xs font-semibold ${txtAccent}`}>
          ({up ? '+' : ''}{data.unrealizedPct.toFixed(1)}%)
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 bg-white/40 dark:bg-slate-950/40 rounded-md">
          <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Paid (frozen)</div>
          <div className="font-bold text-slate-900 dark:text-white tabular-nums">{fmtMoney(data.totalPaidEGP)}</div>
        </div>
        <div className="p-2 bg-white/40 dark:bg-slate-950/40 rounded-md">
          <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">At today's rate</div>
          <div className="font-bold text-slate-900 dark:text-white tabular-nums">{fmtMoney(data.totalTodayEGP)}</div>
        </div>
      </div>

      {data.byCurrency?.length > 1 && (
        <div className="mt-3 space-y-1 text-[10px] text-slate-600 dark:text-slate-300 border-t border-slate-200/50 dark:border-slate-700/50 pt-2">
          {data.byCurrency.map((c) => (
            <div key={c.currency} className="flex justify-between">
              <span>{c.currency} ({c.pairs} pair{c.pairs > 1 ? 's' : ''})</span>
              <span className="tabular-nums">
                {fmtMoney(c.paidEGP)} → {fmtMoney(c.todayEGP)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-start gap-1.5 text-[10px] text-slate-500 leading-relaxed">
        <FiInfo size={10} className="shrink-0 mt-0.5" />
        <span>
          {up
            ? 'The currency weakened — your existing stock costs more to replace today. Consider pacing new purchases.'
            : 'The currency strengthened — this is a cheaper window to buy more stock.'}
        </span>
      </div>
    </div>
  );
}
