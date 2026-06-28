import express from 'express';
import FxSnapshot from '../models/FxSnapshot.js';
import FxReference from '../models/FxReference.js';
import FxRateHistory from '../models/FxRateHistory.js';
import Product from '../models/Product.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Fetch the current {from}→{to} rate from open.er-api.com.
 * Falls back to the last DB snapshot or a sensible static default.
 */
const FALLBACK = { SAR_EGP: 13.25, USD_EGP: 49, EUR_EGP: 53 };

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fetchRate = async (from, to) => {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.result === 'success' && data.rates?.[to]) return data.rates[to];
  } catch {}
  return null;
};

const getOrCreateTodaySnapshot = async (from, to) => {
  from = from.toUpperCase(); to = to.toUpperCase();
  if (from === to) return { rate: 1, date: todayKey(), fetchedAt: new Date() };

  const date = todayKey();
  const existing = await FxSnapshot.findOne({ from, to, date });
  if (existing) return existing;

  const live = await fetchRate(from, to);
  const rate = live ?? FALLBACK[`${from}_${to}`] ?? 1;
  try {
    return await FxSnapshot.create({ from, to, date, rate });
  } catch (err) {
    // Race condition: another request created the same (from,to,date). Re-read.
    if (err.code === 11000) {
      return FxSnapshot.findOne({ from, to, date });
    }
    throw err;
  }
};

/**
 * GET /api/fx/current?from=SAR&to=EGP
 * Returns today's rate + 7-day delta (vs rate from 7 days ago, or earliest available).
 */
router.get('/current', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    const from = (req.query.from || 'SAR').toUpperCase();
    const to = (req.query.to || 'EGP').toUpperCase();
    const today = await getOrCreateTodaySnapshot(from, to);

    // Find a ~7 day old snapshot to compare against
    const sevenAgo = new Date(Date.now() - 7 * 86400000);
    const weekAgoKey = `${sevenAgo.getFullYear()}-${String(sevenAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenAgo.getDate()).padStart(2, '0')}`;
    const prior = await FxSnapshot.findOne({ from, to, date: { $lte: weekAgoKey } }).sort({ date: -1 });
    const priorRate = prior?.rate;
    const deltaPct = priorRate ? ((today.rate - priorRate) / priorRate) * 100 : null;

    res.json({
      success: true,
      data: {
        from, to,
        rate: today.rate,
        date: today.date,
        priorRate,
        priorDate: prior?.date,
        deltaPct,
        alert: deltaPct != null && Math.abs(deltaPct) >= 3,
      },
    });
  } catch (e) { next(e); }
});

/**
 * GET /api/fx/history?from=SAR&to=EGP&days=30
 * Returns the last N days of snapshots. Useful for sparklines.
 */
router.get('/history', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    const from = (req.query.from || 'SAR').toUpperCase();
    const to = (req.query.to || 'EGP').toUpperCase();
    const days = Math.min(90, Math.max(7, parseInt(req.query.days || '30')));
    const cutoff = new Date(Date.now() - days * 86400000);
    const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;

    const snapshots = await FxSnapshot.find({ from, to, date: { $gte: cutoffKey } })
      .sort({ date: 1 })
      .select('date rate');

    res.json({ success: true, data: snapshots });
  } catch (e) { next(e); }
});

/**
 * GET /api/fx/impact
 * Super-admin only: computes the unrealized gain/loss across unsold inventory
 * if we valued it at today's FX rate vs the rate we actually paid at.
 *
 * Positive value = rate moved AGAINST us (EGP weakened), so replacing this
 * inventory today would cost more than we paid — the pairs are worth more in
 * EGP terms now.
 */
router.get('/impact', protect, authorize('super-admin', 'admin'), async (req, res, next) => {
  try {
    const products = await Product.find({
      location: { $ne: 'sold' },
      purchasePrice: { $gt: 0 },
      purchaseCurrency: { $ne: 'EGP' },
    }).select('name purchasePrice purchaseCurrency purchaseExchangeRate purchasePriceEGP location');

    // Fetch today's rates per currency (cached)
    const rateCache = {};
    const rateFor = async (cur) => {
      if (cur === 'EGP') return 1;
      if (rateCache[cur] != null) return rateCache[cur];
      const s = await getOrCreateTodaySnapshot(cur, 'EGP');
      rateCache[cur] = s.rate;
      return s.rate;
    };

    let totalPaidEGP = 0;
    let totalTodayEGP = 0;
    const byCurrency = {};

    for (const p of products) {
      const cur = p.purchaseCurrency || 'SAR';
      const paidEGP = p.purchasePriceEGP || (p.purchasePrice * (p.purchaseExchangeRate || 0));
      const todayRate = await rateFor(cur);
      const todayEGP = p.purchasePrice * todayRate;

      totalPaidEGP += paidEGP;
      totalTodayEGP += todayEGP;

      if (!byCurrency[cur]) byCurrency[cur] = { currency: cur, paidEGP: 0, todayEGP: 0, todayRate, pairs: 0 };
      byCurrency[cur].paidEGP += paidEGP;
      byCurrency[cur].todayEGP += todayEGP;
      byCurrency[cur].pairs += 1;
    }

    const unrealizedEGP = totalTodayEGP - totalPaidEGP;
    const unrealizedPct = totalPaidEGP > 0 ? (unrealizedEGP / totalPaidEGP) * 100 : 0;

    res.json({
      success: true,
      data: {
        productCount: products.length,
        totalPaidEGP,
        totalTodayEGP,
        unrealizedEGP,
        unrealizedPct,
        byCurrency: Object.values(byCurrency),
      },
    });
  } catch (e) { next(e); }
});

/* ------------------------------------------------------------------
 * REFERENCE RATE (manually-managed "book rate")
 * ------------------------------------------------------------------ */

/**
 * GET /api/fx/reference?from=SAR&to=EGP
 * Omit params to get every pair we have configured.
 */
router.get('/reference', protect, authorize('admin', 'super-admin', 'saudi-staff'), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.from) filter.from = req.query.from.toUpperCase();
    if (req.query.to) filter.to = req.query.to.toUpperCase();
    const refs = await FxReference.find(filter)
      .populate('setBy', 'firstName lastName')
      .sort({ from: 1 });
    res.json({ success: true, data: refs });
  } catch (e) { next(e); }
});

/**
 * PUT /api/fx/reference
 * Body: { from, to, rate?, useLive?, note }
 *   - If useLive is true: pulls the market rate and locks it.
 *   - Otherwise: rate is required, locked verbatim.
 *
 * Each change appends to history[] so there's a full audit trail.
 */
router.put('/reference', protect, authorize('super-admin', 'admin'), async (req, res, next) => {
  try {
    const from = (req.body.from || '').toUpperCase();
    const to = (req.body.to || 'EGP').toUpperCase();
    const useLive = !!req.body.useLive;
    const note = req.body.note || '';

    if (!from) return res.status(400).json({ success: false, message: 'from is required' });
    if (from === to) return res.status(400).json({ success: false, message: 'from and to must differ' });

    // Always capture what the live rate is at the moment of this change — even
    // if the user is typing a manual rate. Good for audit ("how far off was
    // the manual rate from market?").
    const live = await fetchRate(from, to);

    let rate;
    let source;
    if (useLive) {
      if (live == null) return res.status(503).json({ success: false, message: 'Could not fetch live rate' });
      rate = live;
      source = 'live';
    } else {
      rate = Number(req.body.rate);
      if (!Number.isFinite(rate) || rate <= 0) {
        return res.status(400).json({ success: false, message: 'rate must be a positive number' });
      }
      source = 'manual';
    }

    const existing = await FxReference.findOne({ from, to });
    if (existing) {
      // Archive the superseded rate to the history collection (append-only).
      await FxRateHistory.create({
        from,
        to,
        rate: existing.rate,
        setAt: existing.setAt,
        setBy: existing.setBy,
        source: existing.source,
        liveRateAtSet: existing.liveRateAtSet,
        note: existing.note,
      });
      existing.rate = rate;
      existing.setAt = new Date();
      existing.setBy = req.user.id;
      existing.source = source;
      existing.liveRateAtSet = live;
      existing.note = note;
      await existing.save();
      await existing.populate('setBy', 'firstName lastName');
      return res.json({ success: true, data: existing });
    }

    const created = await FxReference.create({
      from, to, rate, setBy: req.user.id, source, liveRateAtSet: live, note,
    });
    await created.populate('setBy', 'firstName lastName');
    res.status(201).json({ success: true, data: created });
  } catch (e) { next(e); }
});

/**
 * GET /api/fx/reference/history?from=SAR&to=EGP
 * Returns the full change log for that pair.
 */
router.get('/reference/history', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    const from = (req.query.from || 'SAR').toUpperCase();
    const to = (req.query.to || 'EGP').toUpperCase();
    const ref = await FxReference.findOne({ from, to }).populate('setBy', 'firstName lastName');
    if (!ref) return res.json({ success: true, data: [] });
    // History rows (capped) + the current rate, newest first.
    const history = await FxRateHistory.find({ from, to })
      .populate('setBy', 'firstName lastName')
      .sort({ setAt: -1 })
      .limit(500)
      .lean();
    const timeline = [
      {
        rate: ref.rate,
        setAt: ref.setAt,
        setBy: ref.setBy,
        source: ref.source,
        liveRateAtSet: ref.liveRateAtSet,
        note: ref.note,
        current: true,
      },
      ...history,
    ].sort((a, b) => new Date(b.setAt) - new Date(a.setAt));
    res.json({ success: true, data: timeline });
  } catch (e) { next(e); }
});

export default router;
