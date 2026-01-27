import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import { generateOrderNumber } from '../utils/helpers.js';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '../utils/email.js';
import { calculatePagination } from '../utils/helpers.js';

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

    // Clear cart
    await Cart.findOneAndUpdate({ userId: req.user.id }, { items: [], total: 0 });

    // Send confirmation email
    await sendOrderConfirmation(user.email, order);

    // Update user stats
    user.metadata.totalOrders += 1;
    user.metadata.totalSpent += order.pricing.total;
    user.metadata.averageOrderValue = user.metadata.totalSpent / user.metadata.totalOrders;
    await user.save();

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

    // Send cancellation email
    const user = await User.findById(order.userId);
    await sendOrderStatusUpdate(user.email, order, 'cancelled');

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
