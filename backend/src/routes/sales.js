import express from 'express';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import { protect, authorize } from '../middleware/auth.js';
import { emitSaleChange, emitProductChange, emitDashboardRefresh } from '../realtime/io.js';
import { resolveProductImageUrls, calculatePagination } from '../utils/helpers.js';

const router = express.Router();

router.use(protect, authorize('admin', 'super-admin', 'egypt-staff'));

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, channel, from, to } = req.query;
    const { skip, limit: pl } = calculatePagination(page, limit);
    const filter = {};
    if (channel) filter.channel = channel;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const items = await Sale.find(filter)
      .populate('items.product', 'name sku thumbnail')
      .populate('soldBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pl);
    const total = await Sale.countDocuments(filter);

    // Egypt staff doesn't see profit/cost
    let payload = items;
    if (req.user.role === 'egypt-staff') {
      payload = items.map((s) => {
        const obj = s.toObject();
        delete obj.totalCost;
        delete obj.totalProfit;
        obj.items = obj.items.map((it) => {
          delete it.landedCost;
          delete it.profit;
          return it;
        });
        return obj;
      });
    }

    res.json({ success: true, data: payload, pagination: { total, pages: Math.ceil(total / pl), currentPage: parseInt(page), pageSize: pl } });
  } catch (e) { next(e); }
});

/**
 * Log an offline sale at the Egypt store.
 * Body: { items: [{ product, sellPrice }], discount, promoCode, paymentMethod, customerName, customerPhone, notes }
 */
router.post('/', async (req, res, next) => {
  try {
    const { items = [], ...rest } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Sale must have at least one item' });
    }

    const products = await Product.find({ _id: { $in: items.map((i) => i.product) } });
    const productMap = Object.fromEntries(products.map((p) => [String(p._id), p]));

    // Validate min sell price + availability (only egypt-located products)
    for (const it of items) {
      const p = productMap[String(it.product)];
      if (!p) return res.status(404).json({ success: false, message: `Product ${it.product} not found` });
      if (!['egypt-online', 'egypt-offline', 'egypt-both'].includes(p.location)) {
        return res.status(400).json({ success: false, message: `Product ${p.name} not available in Egypt inventory` });
      }
      if (p.minSellPrice && it.sellPrice < p.minSellPrice) {
        return res.status(400).json({
          success: false,
          message: `${p.name}: sell price ${it.sellPrice} is below minimum ${p.minSellPrice}`,
        });
      }
    }

    const enrichedItems = items.map((it) => {
      const p = productMap[String(it.product)];
      const landedCost = p.landedCost || p.purchasePrice || 0;
      return {
        product: p._id,
        productName: p.name,
        sku: p.sku,
        sellPrice: it.sellPrice,
        landedCost,
        profit: it.sellPrice - landedCost,
      };
    });

    const sale = await Sale.create({
      ...rest,
      channel: 'offline',
      items: enrichedItems,
      soldBy: req.user.id,
    });

    // Mark products as sold
    for (const p of products) {
      p.location = 'sold';
      p.status = 'inactive';
      p.locationHistory.push({
        location: 'sold',
        changedAt: new Date(),
        changedBy: req.user.id,
        notes: `Sold offline (${sale.saleNumber})`,
      });
      await p.save();
      emitProductChange('product:updated', resolveProductImageUrls(p));
    }

    emitSaleChange('sale:created', sale);
    emitDashboardRefresh();

    res.status(201).json({ success: true, data: sale });
  } catch (e) { next(e); }
});

export default router;
