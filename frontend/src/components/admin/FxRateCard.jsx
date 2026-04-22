'use client';

import { useEffect, useState } from 'react';
import { FiRefreshCw, FiTrendingUp, FiTrendingDown, FiAlertTriangle } from 'react-icons/fi';
import { fxAPI } from '@/utils/endpoints';

/**
 * Live FX rates card for the admin dashboard.
 * Shows today's rate + 7-day delta + tiny sparkline per currency pair.
 * Flags moves ≥ 3% (flag set by the backend) as alerts.
 */
export default function FxRateCard({ pairs = [['SAR', 'EGP'], ['USD', 'EGP'], ['EUR', 'EGP']] }) {
  const [data, setData] = useState({});
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        pairs.map(async ([from, to]) => {
          const [cur, hist] = await Promise.all([
            fxAPI.current(from, to).then((r) => r.data.data).catch(() => null),
            fxAPI.history(from, to, 30).then((r) => r.data.data).catch(() => []),
          ]);
          return { from, to, cur, hist };
        }),
      );
      const d = {}, h = {};
      for (const r of results) {
        d[`${r.from}_${r.to}`] = r.cur;
        h[`${r.from}_${r.to}`] = r.hist;
      }
      setData(d);
      setHistory(h);
      setLastFetch(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live FX Rates</h4>
          <div className="text-[10px] text-slate-400">
            {lastFetch ? `Updated ${lastFetch.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : '...'}
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900"
          title="Refresh rates"
        >
          <FiRefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-2">
        {pairs.map(([from, to]) => (
          <RateRow
            key={`${from}_${to}`}
            from={from}
            to={to}
            current={data[`${from}_${to}`]}
            history={history[`${from}_${to}`] || []}
          />
        ))}
      </div>

      <div className="mt-3 text-[10px] text-slate-400 leading-relaxed">
        P&L uses the rate <strong>frozen when you bought</strong> — today's rate is for planning new purchases and pricing.
      </div>
    </div>
  );
}

function RateRow({ from, to, current, history }) {
  if (!current) return null;
  const up = (current.deltaPct ?? 0) >= 0;
  const alert = current.alert;

  return (
    <div className={`p-3 rounded-md border ${
      alert
        ? up
          ? 'bg-rose-500/5 border-rose-500/30'
          : 'bg-emerald-500/5 border-emerald-500/30'
        : 'bg-slate-50 dark:bg-slate-800 border-transparent'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            1 {from} →
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums leading-tight">
            {Number(current.rate).toFixed(3)}
            <span className="text-[10px] text-slate-400 ml-1 font-normal">{to}</span>
          </div>
          {current.deltaPct != null && (
            <div className={`flex items-center gap-0.5 text-[10px] font-semibold mt-0.5 ${
              up ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              {up ? <FiTrendingUp size={10} /> : <FiTrendingDown size={10} />}
              {up ? '+' : ''}{current.deltaPct.toFixed(2)}% · 7d
            </div>
          )}
        </div>

        <Sparkline data={history} />
      </div>

      {alert && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300">
          <FiAlertTriangle size={10} className={up ? 'text-rose-500' : 'text-emerald-500'} />
          {up
            ? `${from} up ${Math.abs(current.deltaPct).toFixed(1)}% — cost of new buys is rising`
            : `${from} down ${Math.abs(current.deltaPct).toFixed(1)}% — good window to buy`}
        </div>
      )}
    </div>
  );
}

function Sparkline({ data }) {
  if (!data || data.length < 2) return <div className="w-20 h-8" />;
  const vals = data.map((d) => d.rate);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const w = 80;
  const h = 32;
  const step = w / (vals.length - 1);
  const points = vals.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ');
  const last = vals[vals.length - 1];
  const first = vals[0];
  const up = last >= first;
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        fill="none"
        stroke={up ? '#f43f5e' : '#10b981'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle
        cx={(vals.length - 1) * step}
        cy={h - ((last - min) / range) * h}
        r="2"
        fill={up ? '#f43f5e' : '#10b981'}
      />
    </svg>
  );
}
