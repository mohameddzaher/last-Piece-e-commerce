import express from 'express';
import Shipment from '../models/Shipment.js';
import Product from '../models/Product.js';
import { protect, authorize } from '../middleware/auth.js';
import { emitShipmentChange, emitProductChange } from '../realtime/io.js';
import { resolveProductImageUrls } from '../utils/helpers.js';
import { calculatePagination } from '../utils/helpers.js';

const router = express.Router();

router.get(
  '/',
  protect,
  authorize('admin', 'super-admin', 'saudi-staff', 'egypt-staff'),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const { skip, limit: pl } = calculatePagination(page, limit);
      const filter = {};
      if (status) filter.status = status;
      const items = await Shipment.find(filter)
        .populate('products', 'name sku thumbnail location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pl);
      const total = await Shipment.countDocuments(filter);
      res.json({ success: true, data: items, pagination: { total, pages: Math.ceil(total / pl), currentPage: parseInt(page), pageSize: pl } });
    } catch (e) { next(e); }
  },
);

router.get(
  '/:id',
  protect,
  authorize('admin', 'super-admin', 'saudi-staff', 'egypt-staff'),
  async (req, res, next) => {
    try {
      const s = await Shipment.findById(req.params.id).populate('products');
      if (!s) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: s });
    } catch (e) { next(e); }
  },
);

/**
 * Create a shipment from Saudi → Egypt.
 * Body: { products: [productId], shippingCost, customsFees, otherFees, carrier, trackingNumber, notes }
 *
 * Side effects: each included product's location flips to 'transit',
 * `shipment` ref is set, allocatedShippingCost & landedCost are recomputed.
 */
router.post(
  '/',
  protect,
  authorize('super-admin', 'admin'),
  async (req, res, next) => {
    try {
      const { products: productIds = [], ...rest } = req.body;
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one product required' });
      }

      const shipment = await Shipment.create({
        ...rest,
        products: productIds,
        createdBy: req.user.id,
        status: rest.status || 'preparing',
      });

      // Allocate cost across products & flip location to transit
      const perProduct = shipment.costPerProduct;
      const products = await Product.find({ _id: { $in: productIds } });
      for (const p of products) {
        p.allocatedShippingCost = perProduct;
        p.landedCost = (p.purchasePrice || 0) + perProduct;
        p.location = 'transit';
        p.shipment = shipment._id;
        p.locationHistory.push({
          location: 'transit',
          changedAt: new Date(),
          changedBy: req.user.id,
          notes: `Added to shipment ${shipment.code}`,
        });
        await p.save();
        emitProductChange('product:updated', resolveProductImageUrls(p));
      }

      emitShipmentChange('shipment:created', shipment);
      res.status(201).json({ success: true, data: shipment });
    } catch (e) { next(e); }
  },
);

router.put(
  '/:id',
  protect,
  authorize('super-admin', 'admin'),
  async (req, res, next) => {
    try {
      const shipment = await Shipment.findById(req.params.id);
      if (!shipment) return res.status(404).json({ success: false, message: 'Not found' });
      Object.assign(shipment, req.body);
      await shipment.save();

      // If status changed to delivered, flip products to egypt-online by default
      if (req.body.status === 'delivered') {
        shipment.receivedAt = new Date();
        await shipment.save();
        const products = await Product.find({ _id: { $in: shipment.products } });
        for (const p of products) {
          if (p.location === 'transit') {
            p.location = 'egypt-online';
            p.locationHistory.push({
              location: 'egypt-online',
              changedAt: new Date(),
              changedBy: req.user.id,
              notes: `Shipment ${shipment.code} delivered`,
            });
            await p.save();
            emitProductChange('product:updated', resolveProductImageUrls(p));
          }
        }
      }

      emitShipmentChange('shipment:updated', shipment);
      res.json({ success: true, data: shipment });
    } catch (e) { next(e); }
  },
);

router.delete(
  '/:id',
  protect,
  authorize('super-admin'),
  async (req, res, next) => {
    try {
      const shipment = await Shipment.findById(req.params.id);
      if (!shipment) return res.status(404).json({ success: false, message: 'Not found' });
      // Roll back products to saudi
      await Product.updateMany(
        { _id: { $in: shipment.products } },
        { $set: { location: 'saudi', shipment: null, allocatedShippingCost: 0 } },
      );
      await shipment.deleteOne();
      emitShipmentChange('shipment:deleted', { _id: shipment._id });
      res.json({ success: true, message: 'Shipment deleted' });
    } catch (e) { next(e); }
  },
);

export default router;
