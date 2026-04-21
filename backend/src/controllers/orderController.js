import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { generateOrderNumber } from '../utils/helpers.js';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '../utils/email.js';
import { calculatePagination } from '../utils/helpers.js';
import { emitOrderChange, emitDashboardRefresh, emitProductChange } from '../realtime/io.js';
import { resolveProductImageUrls } from '../utils/helpers.js';

export const createOrder = async (req, res, next) => {
  try {
    const { billingAddress, shippingAddress, paymentMethod } = req.body;

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

    // Validate each product is still available. One-of-one inventory means if
    // another order reserved it in the meantime, we must reject before we take
    // this customer's money. Also guards against the "price = 0" public listing
    // slipping through if a catalog edit didn't set a selling price.
    for (const item of cart.items) {
      const p = item.productId;
      if (!p) continue;
      if (p.location === 'sold' || p.status !== 'active') {
        return res.status(409).json({
          success: false,
          message: `"${p.name}" is no longer available. Remove it from your cart.`,
        });
      }
      if (!(p.price > 0) && !(item.price > 0)) {
        return res.status(400).json({
          success: false,
          message: `"${p.name}" has no price set. Please contact us.`,
        });
      }
    }

    const user = await User.findById(req.user.id);

    const orderNumber = generateOrderNumber();
    const order = await Order.create({
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
        amount: cart.total,
      },
      pricing: {
        subtotal: cart.subtotal,
        tax: cart.tax,
        shipping: cart.shipping,
        discount: cart.discount,
        total: cart.total,
      },
      statusTimeline: [
        {
          status: 'pending',
          timestamp: new Date(),
          notes: 'Order created',
        },
      ],
    });

    // Reserve the pairs — since our inventory is strictly one-of-one, as soon
    // as a customer places an order we mark the product as sold so nobody else
    // can buy the same pair while we ship it. If the order is later cancelled,
    // the cancellation handler flips them back to their previous location.
    const reservedProductIds = cart.items.map((item) => item.productId._id);
    const soldProducts = [];
    for (const p of await Product.find({ _id: { $in: reservedProductIds } })) {
      p.locationHistory.push({
        location: 'sold',
        changedAt: new Date(),
        changedBy: req.user.id,
        notes: `Reserved by online order ${orderNumber}`,
      });
      p.location = 'sold';
      p.status = 'inactive';
      await p.save();
      soldProducts.push(p);
    }

    // Clear cart
    await Cart.findOneAndUpdate({ userId: req.user.id }, { items: [], total: 0 });

    // Send confirmation email
    await sendOrderConfirmation(user.email, order);

    // Update user stats
    user.metadata.totalOrders += 1;
    user.metadata.totalSpent += order.pricing.total;
    user.metadata.averageOrderValue = user.metadata.totalSpent / user.metadata.totalOrders;
    await user.save();

    emitOrderChange('order:created', order, req.user.id);
    // Broadcast each product:updated so public listings drop the pair live.
    soldProducts.forEach((p) => emitProductChange('product:updated', resolveProductImageUrls(p)));
    emitDashboardRefresh();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
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

    const orders = await Order.find(filter)
      .skip(skip)
      .limit(pageLimit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

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

    const order = await Order.findOne({ _id: id, userId: req.user.id });

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

    // Send status update email
    const user = await User.findById(order.userId);
    await sendOrderStatusUpdate(user.email, order, status);

    emitOrderChange('order:status-changed', order, order.userId);
    emitDashboardRefresh();

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: order,
    });
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

    // Send cancellation email
    const user = await User.findById(order.userId);
    await sendOrderStatusUpdate(user.email, order, 'cancelled');

    emitOrderChange('order:status-changed', order, order.userId);
    released.forEach((p) => emitProductChange('product:updated', resolveProductImageUrls(p)));
    emitDashboardRefresh();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
