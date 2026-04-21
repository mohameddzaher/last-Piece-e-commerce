import express from 'express';
import Expense from '../models/Expense.js';
import { protect, authorize } from '../middleware/auth.js';
import { emitExpenseChange, emitDashboardRefresh } from '../realtime/io.js';
import { calculatePagination } from '../utils/helpers.js';

const router = express.Router();

// Only super-admin/admin see operating expenses
router.use(protect, authorize('admin', 'super-admin'));

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, from, to } = req.query;
    const { skip, limit: pl } = calculatePagination(page, limit);
    const filter = {};
    if (category) filter.category = category;
    if (from || to) {
      filter.incurredOn = {};
      if (from) filter.incurredOn.$gte = new Date(from);
      if (to) filter.incurredOn.$lte = new Date(to);
    }
    const items = await Expense.find(filter)
      .populate('relatedUser', 'firstName lastName email')
      .populate('relatedShipment', 'code')
      .sort({ incurredOn: -1 })
      .skip(skip)
      .limit(pl);
    const total = await Expense.countDocuments(filter);
    res.json({ success: true, data: items, pagination: { total, pages: Math.ceil(total / pl), currentPage: parseInt(page), pageSize: pl } });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const exp = await Expense.create({ ...req.body, createdBy: req.user.id });
    emitExpenseChange('expense:created', exp);
    emitDashboardRefresh();
    res.status(201).json({ success: true, data: exp });
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const exp = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!exp) return res.status(404).json({ success: false, message: 'Not found' });
    emitExpenseChange('expense:updated', exp);
    emitDashboardRefresh();
    res.json({ success: true, data: exp });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const exp = await Expense.findByIdAndDelete(req.params.id);
    if (!exp) return res.status(404).json({ success: false, message: 'Not found' });
    emitExpenseChange('expense:deleted', { _id: exp._id });
    emitDashboardRefresh();
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
});

router.get('/summary/by-category', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const match = {};
    if (from || to) {
      match.incurredOn = {};
      if (from) match.incurredOn.$gte = new Date(from);
      if (to) match.incurredOn.$lte = new Date(to);
    }
    const summary = await Expense.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    res.json({ success: true, data: summary });
  } catch (e) { next(e); }
});

export default router;
