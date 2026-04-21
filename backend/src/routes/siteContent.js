import express from 'express';
import SiteContent from '../models/SiteContent.js';
import { protect, authorize } from '../middleware/auth.js';
import { emitSiteContentChange } from '../realtime/io.js';

const router = express.Router();

// Public: get all published content (or a single key, or a section)
router.get('/', async (req, res, next) => {
  try {
    const { section, key, lang } = req.query;
    const filter = { isPublished: true };
    if (section) filter.section = section;
    if (key) filter.key = key;
    const items = await SiteContent.find(filter).sort({ section: 1, order: 1 });
    const data = items.map((it) => {
      const obj = it.toObject();
      // Resolve i18n value: prefer requested lang, fall back to base value
      if (lang && obj.i18n && obj.i18n[lang] != null) obj.value = obj.i18n[lang];
      return obj;
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/by-key/:key', async (req, res, next) => {
  try {
    const { lang } = req.query;
    const item = await SiteContent.findOne({ key: req.params.key, isPublished: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    const obj = item.toObject();
    if (lang && obj.i18n && obj.i18n[lang] != null) obj.value = obj.i18n[lang];
    res.json({ success: true, data: obj });
  } catch (e) { next(e); }
});

// Admin: list everything
router.get('/admin/all', protect, authorize('admin', 'super-admin'), async (_req, res, next) => {
  try {
    const items = await SiteContent.find().sort({ section: 1, order: 1 });
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
});

// Upsert by key
router.put('/:key', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    const item = await SiteContent.findOneAndUpdate(
      { key: req.params.key },
      { ...req.body, key: req.params.key, updatedBy: req.user.id },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    emitSiteContentChange('site-content:updated', item);
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
});

router.delete('/:key', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    await SiteContent.findOneAndDelete({ key: req.params.key });
    emitSiteContentChange('site-content:deleted', { key: req.params.key });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
});

export default router;
