import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Recompute totals from the prices already stored on each cart item. The old
// code re-fetched every product on every cart mutation (an N+1 on the busiest
// authenticated endpoint); the item price is captured at add-time and refreshed
// whenever the product is re-added, so an in-memory reduce is both correct and
// O(1) queries.
const recalcCartTotals = (cart) => {
  cart.subtotal = cart.items.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );
  cart.tax = 0; // No VAT on consumer side — tax was inflating cart vs checkout mismatch
  cart.total = cart.subtotal + cart.tax + cart.shipping - cart.discount;
  cart.lastUpdated = new Date();
};

export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');

    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [] });
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock',
      });
    }

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [] });
    }

    const existingItem = cart.items.find((item) => item.productId.toString() === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
      // Keep the stored price fresh in case the catalog price changed.
      existingItem.price = product.price;
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.price,
      });
    }

    recalcCartTotals(cart);

    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);

    recalcCartTotals(cart);

    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and quantity are required',
      });
    }

    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const item = cart.items.find((item) => item.productId.toString() === productId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not in cart',
      });
    }

    item.quantity = quantity;

    recalcCartTotals(cart);

    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { userId: req.user.id },
      {
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        discount: 0,
        lastUpdated: new Date(),
      },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const applyCoupon = async (req, res, next) => {
  try {
    const { couponCode } = req.body;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required',
      });
    }

    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    // TODO: Implement coupon validation logic
    cart.couponCode = couponCode;
    cart.discount = cart.subtotal * 0.1; // Placeholder: 10% discount
    cart.total = cart.subtotal + cart.tax + cart.shipping - cart.discount;

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Coupon applied',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};
