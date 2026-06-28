import express from 'express';
import PromoCode from '../models/PromoCode.js';
import PromoRedemption from '../models/PromoRedemption.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Validate a promo code for a given user + subtotal and compute the discount.
 * Shared by the /validate endpoint and the order-creation flow so the cart
 * preview and the actual charge can never disagree. Returns { ok, message?, ... }.
 */
export const evaluatePromo = async ({ code, subtotal = 0, userId }) => {
  const promo = await PromoCode.findOne({ code: code?.toUpperCase().trim() });
  if (!promo || !promo.isValidNow()) {
    return { ok: false, status: 400, message: 'Invalid or expired code' };
  }
  if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
    return { ok: false, status: 400, message: `Minimum order ${promo.minOrderAmount} required` };
  }
  // Per-user usage: an indexed count instead of scanning an embedded array.
  if (promo.usageLimitPerUser) {
    const usedByUser = await PromoRedemption.countDocuments({ code: promo.code, user: userId });
    if (usedByUser >= promo.usageLimitPerUser) {
      return { ok: false, status: 400, message: 'Code already used' };
    }
  }

  let discount = 0;
  if (promo.type === 'percent') {
    discount = (subtotal * promo.value) / 100;
    if (promo.maxDiscountAmount) discount = Math.min(discount, promo.maxDiscountAmount);
  } else if (promo.type === 'fixed') {
    discount = Math.min(promo.value, subtotal);
  }
  discount = Math.max(0, Math.round(discount));

  return {
    ok: true,
    promo,
    code: promo.code,
    type: promo.type,
    value: promo.value,
    discount,
    freeShipping: promo.type === 'free-shipping',
  };
};

// Public: validate a code
router.post('/validate', protect, async (req, res, next) => {
  try {
    const { code, subtotal = 0 } = req.body;
    const result = await evaluatePromo({ code, subtotal, userId: req.user.id });
    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    res.json({
      success: true,
      data: {
        code: result.code,
        type: result.type,
        value: result.value,
        discount: result.discount,
        freeShipping: result.freeShipping,
      },
    });
  } catch (e) { next(e); }
});

// Admin
router.get('/', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const [items, total] = await Promise.all([
      PromoCode.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      PromoCode.countDocuments(),
    ]);
    res.json({
      success: true,
      data: items,
      pagination: { total, pages: Math.ceil(total / limit), currentPage: page, pageSize: limit },
    });
  } catch (e) { next(e); }
});

router.post('/', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    const promo = await PromoCode.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, data: promo });
  } catch (e) { next(e); }
});

router.put('/:id', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    const promo = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!promo) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: promo });
  } catch (e) { next(e); }
});

router.delete('/:id', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    await PromoCode.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
});

export default router;
