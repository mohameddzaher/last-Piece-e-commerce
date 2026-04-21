/**
 * Currency helper.
 *
 * Live rates: fetches from open.er-api.com (free, no key). Each result is
 * cached in memory + localStorage for 2 hours so we don't hammer the API.
 *
 * Why: the user needs to know what a SAR purchase equaled in EGP **at the
 * time of purchase**. We store that rate on the product, so later P&L is
 * accurate even when the market rate moves.
 */

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const STORAGE_KEY = 'lp_fx_cache_v1';

const readCache = () => {
  try {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const writeCache = (cache) => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {}
};

/**
 * Returns exchange rate `from` → `to`. Example: getRate('SAR', 'EGP') = 13.25
 */
export const getRate = async (from, to) => {
  from = from.toUpperCase();
  to = to.toUpperCase();
  if (from === to) return 1;

  const cache = readCache();
  const key = `${from}_${to}`;
  const now = Date.now();
  if (cache[key] && now - cache[key].fetchedAt < CACHE_TTL_MS) {
    return cache[key].rate;
  }

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.result !== 'success' || !data.rates?.[to]) {
      throw new Error('FX fetch failed');
    }
    const rate = data.rates[to];
    cache[key] = { rate, fetchedAt: now };
    writeCache(cache);
    return rate;
  } catch (err) {
    // Sensible fallback so the UI still renders sensibly.
    const FALLBACK = { SAR_EGP: 13.25, USD_EGP: 49, EUR_EGP: 53, SAR_USD: 0.27 };
    return FALLBACK[key] || 1;
  }
};
