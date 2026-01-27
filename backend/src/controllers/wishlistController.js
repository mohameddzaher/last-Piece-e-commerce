import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

export const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user.id }).populate('items.productId');

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user.id, items: [] });
    }

    res.status(200).json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

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

    let wishlist = await Wishlist.findOne({ userId: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user.id, items: [] });
    }

    const existingItem = wishlist.items.find((item) => item.productId.toString() === productId);

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist',
      });
    }

    wishlist.items.push({ productId });
    product.wishlistCount += 1;

    await wishlist.save();
    await product.save();
    await wishlist.populate('items.productId');

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const wishlist = await Wishlist.findOne({ userId: req.user.id });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
    }

    const itemIndex = wishlist.items.findIndex((item) => item.productId.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not in wishlist',
      });
    }

    wishlist.items.splice(itemIndex, 1);

    const product = await Product.findById(productId);
    if (product && product.wishlistCount > 0) {
      product.wishlistCount -= 1;
      await product.save();
    }

    await wishlist.save();
    await wishlist.populate('items.productId');

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};

export const clearWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: req.user.id },
      { items: [] },
      { new: true }
    );

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared',
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};
