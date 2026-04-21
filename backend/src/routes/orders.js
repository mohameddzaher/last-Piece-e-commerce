import express from 'express';
import Order from '../models/Order.js';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Public order tracking. Caller provides an order number + the email that
 * was used on the shipping address. We match both to avoid enumeration.
 * Returns a trimmed order payload (no admin fields).
 */
router.post('/track', async (req, res, next) => {
  try {
    const { orderNumber, email } = req.body || {};
    if (!orderNumber || !email) {
      return res.status(400).json({ success: false, message: 'Order number and email are required' });
    }
    const order = await Order.findOne({
      orderNumber: orderNumber.trim(),
      $or: [
        { 'shippingAddress.email': email.trim().toLowerCase() },
        { 'billingAddress.email': email.trim().toLowerCase() },
      ],
    }).select('orderNumber status statusTimeline items pricing shipping payment.method payment.currency createdAt shippingAddress');

    if (!order) {
      return res.status(404).json({ success: false, message: 'No order found with these details' });
    }
    res.json({ success: true, data: order });
  } catch (e) { next(e); }
});

router.post('/', protect, createOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, authorize('admin', 'super-admin'), updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);

export default router;
