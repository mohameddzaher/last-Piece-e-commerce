import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import PromoCode from '../models/PromoCode.js';
import PromoRedemption from '../models/PromoRedemption.js';
import { evaluatePromo } from '../routes/promoCodes.js';
import { generateOrderNumber } from '../utils/helpers.js';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '../utils/email.js';
import { calculatePagination } from '../utils/helpers.js';
import { emitOrderChange, emitDashboardRefresh, emitProductChange } from '../realtime/io.js';
import { resolveProductImageUrls } from '../utils/helpers.js';

export const createOrder = async (req, res, next) => {
  try {
    const { billingAddress, shippingAddress, paymentMethod, promoCode } = req.body;

    if (!billingAddress || !shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    // Price sanity check (cheap, no writes). Availability is enforced atomically
    // during reservation below, not here — checking-then-writing separately is
    // exactly the race that let two customers buy the same one-of-one pair.
    for (const item of cart.items) {
      const p = item.productId;
      if (!p) continue;
      if (!(p.price > 0) && !(item.price > 0)) {
        return res.status(400).json({
          success: false,
          message: `"${p.name}" has no price set. Please contact us.`,
        });
      }
    }

    // Validate & price the promo SERVER-SIDE (never trust a client-sent amount).
    // This is the authoritative discount that actually gets charged.
    let discount = 0;
    let appliedPromo = null;
    if (promoCode) {
      const result = await evaluatePromo({
        code: promoCode,
        subtotal: cart.subtotal,
        userId: req.user.id,
      });
      if (!result.ok) {
        return res.status(result.status || 400).json({ success: false, message: result.message });
      }
      discount = result.discount;
      appliedPromo = result.promo;
    }
    const orderTotal = Math.max(
      0,
      (cart.subtotal || 0) + (cart.tax || 0) + (cart.shipping || 0) - discount
    );

    const user = await User.findById(req.user.id);
    const orderNumber = generateOrderNumber();

    // --- Atomic reservation (race-safe) ---
    // Each pair is one-of-one. We flip it to `sold` with a conditional update
    // that only matches if it's still active & unsold, so under concurrent
    // checkouts exactly ONE order wins each pair. If any pair can't be claimed,
    // we roll back the ones we already grabbed and reject before taking money.
    const reserved = []; // { id, prevLocation }
    let conflict = null;
    for (const item of cart.items) {
      const p = item.productId;
      if (!p) continue;
      const claimed = await Product.findOneAndUpdate(
        { _id: p._id, status: 'active', location: { $nin: ['sold'] } },
        {
          $set: { location: 'sold', status: 'inactive' },
          $push: {
            locationHistory: {
              location: 'sold',
              changedAt: new Date(),
              changedBy: req.user.id,
              notes: `Reserved by online order ${orderNumber}`,
            },
          },
        },
        { new: true }
      );
      if (!claimed) {
        conflict = p;
        break;
      }
      reserved.push({ id: p._id, prevLocation: p.location, doc: claimed });
    }

    if (conflict) {
      // Release the pairs we already claimed so they go back on sale.
      await Promise.all(
        reserved.map((r) =>
          Product.updateOne(
            { _id: r.id },
            {
              $set: { location: r.prevLocation, status: 'active' },
              $push: {
                locationHistory: {
                  location: r.prevLocation,
                  changedAt: new Date(),
                  changedBy: req.user.id,
                  notes: `Released — order ${orderNumber} aborted (item conflict)`,
                },
              },
            }
          )
        )
      );
      return res.status(409).json({
        success: false,
        message: `"${conflict.name}" is no longer available. Remove it from your cart.`,
      });
    }

    let order;
    try {
      order = await Order.create({
      orderNumber,
      userId: req.user.id,
      items: cart.items.map((item) => ({
        productId: item.productId._id,
        productName: item.productId.name,
        sku: item.productId.sku,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      })),
      billingAddress: { ...billingAddress, email: user.email },
      shippingAddress,
      shipping: {
        method: 'standard',
        cost: 0,
      },
      payment: {
        method: paymentMethod,
        status: 'pending',
        amount: orderTotal,
      },
      pricing: {
        subtotal: cart.subtotal,
        tax: cart.tax,
        shipping: cart.shipping,
        discount,
        total: orderTotal,
        couponCode: appliedPromo ? appliedPromo.code : undefined,
      },
      statusTimeline: [
        {
          status: 'pending',
          timestamp: new Date(),
          notes: 'Order created',
        },
      ],
      });
    } catch (err) {
      // Order persistence failed after we reserved the pairs — release them so
      // inventory isn't stuck "sold" against a non-existent order.
      await Promise.all(
        reserved.map((r) =>
          Product.updateOne(
            { _id: r.id },
            { $set: { location: r.prevLocation, status: 'active' } }
          )
        )
      );
      throw err;
    }

    // Clear cart
    await Cart.findOneAndUpdate({ userId: req.user.id }, { items: [], total: 0 });

    // Record the promo redemption (one row per use) so the per-user limit and
    // global usage count are enforced going forward.
    if (appliedPromo) {
      try {
        await PromoRedemption.create({
          code: appliedPromo.code,
          promoCode: appliedPromo._id,
          user: req.user.id,
          order: order._id,
          discountApplied: discount,
        });
        PromoCode.updateOne({ _id: appliedPromo._id }, { $inc: { usedCount: 1 } }).catch(() => {});
      } catch (e) {
        console.error('Promo redemption record failed:', e.message);
      }
    }

    // Update user lifetime stats atomically ($inc avoids lost updates if the
    // same customer has two orders in flight), then refresh the derived AOV.
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { 'metadata.totalOrders': 1, 'metadata.totalSpent': order.pricing.total } },
      { new: true }
    );
    if (updatedUser) {
      const m = updatedUser.metadata;
      updatedUser.metadata.averageOrderValue = m.totalOrders ? m.totalSpent / m.totalOrders : 0;
      await updatedUser.save();
    }

    // Respond first; email + realtime broadcasts must never block (or fail) the
    // checkout response. A slow/down SMTP provider used to stall every order.
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });

    sendOrderConfirmation(user.email, order).catch((e) =>
      console.error('Order confirmation email failed:', e.message)
    );
    emitOrderChange('order:created', order, req.user.id);
    // Broadcast each product:updated so public listings drop the pair live.
    reserved.forEach((r) =>
      emitProductChange('product:updated', resolveProductImageUrls(r.doc))
    );
    emitDashboardRefresh();
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { skip, limit: pageLimit } = calculatePagination(page, limit);

    let filter = { userId: req.user.id };

    if (status) {
      filter.status = status;
    }

    // Run list + count concurrently; .lean() returns plain objects (read-only
    // response, no doc hydration) — meaningfully cheaper under load.
    const [orders, total] = await Promise.all([
      Order.find(filter).skip(skip).limit(pageLimit).sort({ createdAt: -1 }).lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        pages: Math.ceil(total / pageLimit),
        currentPage: parseInt(page),
        pageSize: pageLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, userId: req.user.id }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      {
        status,
        $push: {
          statusTimeline: {
            status,
            timestamp: new Date(),
            notes,
          },
        },
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: order,
    });

    // Email + broadcasts after responding — never block the admin action.
    const user = await User.findById(order.userId).select('email').lean();
    if (user?.email) {
      sendOrderStatusUpdate(user.email, order, status).catch((e) =>
        console.error('Status update email failed:', e.message)
      );
    }
    emitOrderChange('order:status-changed', order, order.userId);
    emitDashboardRefresh();
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, userId: req.user.id });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be cancelled',
      });
    }

    order.status = 'cancelled';
    order.statusTimeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      notes: 'Order cancelled by customer',
    });

    await order.save();

    // Release the reserved products back to egypt-online so other customers
    // can buy them again. Counterpart of the reservation in createOrder.
    const productIds = (order.items || []).map((i) => i.productId);
    const released = [];
    for (const p of await Product.find({ _id: { $in: productIds }, location: 'sold' })) {
      p.locationHistory.push({
        location: 'egypt-online',
        changedAt: new Date(),
        changedBy: req.user.id,
        notes: `Released — order ${order.orderNumber} cancelled`,
      });
      p.location = 'egypt-online';
      p.status = 'active';
      await p.save();
      released.push(p);
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });

    // Email + broadcasts after responding — never block the customer action.
    const user = await User.findById(order.userId).select('email').lean();
    if (user?.email) {
      sendOrderStatusUpdate(user.email, order, 'cancelled').catch((e) =>
        console.error('Cancellation email failed:', e.message)
      );
    }
    emitOrderChange('order:status-changed', order, order.userId);
    released.forEach((p) => emitProductChange('product:updated', resolveProductImageUrls(p)));
    emitDashboardRefresh();
  } catch (error) {
    next(error);
  }
};
