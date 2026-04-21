'use client';

/**
 * Single source of truth for converting non-EGP amounts to EGP for reporting.
 *
 * Uses the reference rates that the super-admin locked via /api/fx/reference —
 * same rates that auto-fill product purchases. That way the Dashboard, the
 * Financial Report, and per-product landed cost all speak the same currency
 * math. (Previously, Dashboard used 13.25 / 49 while the Financial page used
 * 8.3 / 48, which produced different OpEx and different Top-Brands numbers.)
 *
 * If the app hasn't fetched the reference rates yet, falls back to the frozen
 * purchasePriceEGP on products (when available) or to sensible defaults.
 */

// Conservative fallbacks when we have nothing else.
const FALLBACK_RATES = { SAR: 13.25, USD: 49, EUR: 53 };

// Build a { CURRENCY: rate_to_EGP } map from the FxReference API payload.
export const ratesFromReferences = (refs = []) => {
  const out = { EGP: 1 };
  for (const r of refs) {
    if (!r?.from || !r?.to || !r?.rate) continue;
    if (r.to.toUpperCase() !== 'EGP') continue;
    out[r.from.toUpperCase()] = r.rate;
  }
  return out;
};

/**
 * Convert an amount in `currency` to EGP using the provided rates map.
 * If the currency isn't in the map, fall back to a static rate.
 */
export const toEGP = (amount, currency = 'EGP', rates = {}) => {
  if (!amount) return 0;
  const cur = (currency || 'EGP').toUpperCase();
  if (cur === 'EGP') return amount;
  const rate = rates[cur] ?? FALLBACK_RATES[cur];
  if (!rate) return amount; // unknown currency — at least don't silently multiply
  return amount * rate;
};

/**
 * Sum a list of { amount, currency } rows into total EGP using the rates map.
 */
export const sumToEGP = (items = [], rates = {}, amountKey = 'amount', currencyKey = 'currency') => {
  return items.reduce((sum, it) => sum + toEGP(it[amountKey] || 0, it[currencyKey] || 'EGP', rates), 0);
};
