import express from 'express';
import crypto from 'crypto';
import Referral from '../models/Referral.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const generateCode = () => `REF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

// Get or create the current user's referral code
router.get('/me', protect, async (req, res, next) => {
  try {
    let ref = await Referral.findOne({ referrer: req.user.id });
    if (!ref) {
      let code = generateCode();
      while (await Referral.findOne({ code })) code = generateCode();
      ref = await Referral.create({ referrer: req.user.id, code });
    }
    res.json({ success: true, data: ref });
  } catch (e) { next(e); }
});

// Validate a referral code at signup
router.get('/validate/:code', async (req, res, next) => {
  try {
    const ref = await Referral.findOne({ code: req.params.code.toUpperCase(), isActive: true })
      .populate('referrer', 'firstName lastName');
    if (!ref) return res.status(404).json({ success: false, message: 'Invalid referral code' });
    res.json({
      success: true,
      data: {
        code: ref.code,
        referrer: ref.referrer,
        refereeReward: ref.refereeReward,
        rewardType: ref.rewardType,
      },
    });
  } catch (e) { next(e); }
});

// Admin list
router.get('/', protect, authorize('admin', 'super-admin'), async (_req, res, next) => {
  try {
    const items = await Referral.find()
      .populate('referrer', 'firstName lastName email')
      .sort({ totalEarned: -1 });
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
});

export default router;
