import express from 'express';
import PromoCode from '../models/PromoCode.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public: validate a code
router.post('/validate', protect, async (req, res, next) => {
  try {
    const { code, subtotal = 0 } = req.body;
    const promo = await PromoCode.findOne({ code: code?.toUpperCase().trim() });
    if (!promo || !promo.isValidNow()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }
    if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order ${promo.minOrderAmount} required`,
      });
    }
    const usedByUser = promo.usedBy.filter((u) => String(u.user) === String(req.user.id)).length;
    if (promo.usageLimitPerUser && usedByUser >= promo.usageLimitPerUser) {
      return res.status(400).json({ success: false, message: 'Code already used' });
    }

    let discount = 0;
    if (promo.type === 'percent') {
      discount = (subtotal * promo.value) / 100;
      if (promo.maxDiscountAmount) discount = Math.min(discount, promo.maxDiscountAmount);
    } else if (promo.type === 'fixed') {
      discount = promo.value;
    } else if (promo.type === 'free-shipping') {
      discount = 0;
    }

    res.json({
      success: true,
      data: { code: promo.code, type: promo.type, value: promo.value, discount, freeShipping: promo.type === 'free-shipping' },
    });
  } catch (e) { next(e); }
});

// Admin
router.get('/', protect, authorize('admin', 'super-admin'), async (_req, res, next) => {
  try {
    const items = await PromoCode.find().sort({ createdAt: -1 });
    res.json({ success: true, data: items });
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
