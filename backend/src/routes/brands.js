import express from 'express';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { featured, limit } = req.query;
    const filter = { isActive: true };
    if (featured === 'true') filter.isFeatured = true;
    let q = Brand.find(filter).sort({ order: 1, name: 1 });
    if (limit) q = q.limit(parseInt(limit));
    const [brandDocs, counts] = await Promise.all([
      q.lean(),
      // B-15: live per-brand product count. Counts every pair we still own
      // (anything not flagged 'sold'), regardless of which leg of the
      // pipeline it's on. The previous filter only counted Egypt-online stock
      // and made every brand show 0 in the admin table.
      Product.aggregate([
        { $match: { location: { $ne: 'sold' } } },
        { $group: { _id: '$brandRef', count: { $sum: 1 } } },
      ]),
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    const brands = brandDocs.map((b) => ({ ...b, productCount: countMap.get(String(b._id)) || 0 }));
    res.json({ success: true, data: brands });
  } catch (e) { next(e); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const brand = await Brand.findOne({
      $or: [{ slug: req.params.slug }, { _id: req.params.slug.match(/^[0-9a-fA-F]{24}$/) ? req.params.slug : null }],
    });
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.json({ success: true, data: brand });
  } catch (e) { next(e); }
});

router.post('/', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json({ success: true, data: brand });
  } catch (e) { next(e); }
});

router.put('/:id', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.json({ success: true, data: brand });
  } catch (e) { next(e); }
});

router.delete('/:id', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    const inUse = await Product.countDocuments({ brandRef: req.params.id });
    if (inUse > 0) {
      const brand = await Brand.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
      return res.json({ success: true, data: brand, message: 'Brand deactivated (in use by products)' });
    }
    await Brand.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Brand deleted' });
  } catch (e) { next(e); }
});

export default router;
