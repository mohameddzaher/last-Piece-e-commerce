import express from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { protect, authorize } from '../middleware/auth.js';
import { calculatePagination } from '../utils/helpers.js';

const router = express.Router();

// Get all reviews (admin)
router.get('/admin', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, isStoreReview } = req.query;
    const { skip, limit: pageLimit } = calculatePagination(page, limit);

    let filter = {};
    if (status) filter.status = status;
    if (isStoreReview !== undefined) filter.isStoreReview = isStoreReview === 'true';

    const reviews = await Review.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('productId', 'name slug thumbnail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    const total = await Review.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: reviews,
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
});

// Get featured/store reviews for homepage (public)
router.get('/featured', async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;

    const reviews = await Review.find({
      status: 'approved',
      $or: [{ isFeatured: true }, { isStoreReview: true }],
    })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

// Get reviews for a product (public)
router.get('/product/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: pageLimit } = calculatePagination(page, limit);

    const reviews = await Review.find({
      productId,
      status: 'approved',
      isStoreReview: false,
    })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    const total = await Review.countDocuments({
      productId,
      status: 'approved',
      isStoreReview: false,
    });

    // Calculate rating stats
    const stats = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      stats,
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
});

// Create a review (authenticated user)
router.post('/', protect, async (req, res, next) => {
  try {
    const { productId, rating, title, comment, isStoreReview } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating and comment are required',
      });
    }

    // Check if user already reviewed this product (if not store review)
    if (!isStoreReview && productId) {
      const existingReview = await Review.findOne({
        userId: req.user.id,
        productId,
        isStoreReview: false,
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this product',
        });
      }
    }

    // Check if user purchased the product
    let verified = false;
    if (productId) {
      const order = await Order.findOne({
        userId: req.user.id,
        'items.productId': productId,
        status: { $in: ['delivered', 'completed'] },
      });
      verified = !!order;
    }

    const review = await Review.create({
      userId: req.user.id,
      productId: isStoreReview ? null : productId,
      rating,
      title,
      comment,
      verified,
      isStoreReview: !!isStoreReview,
      status: 'approved', // Auto-approve
    });

    // Update product rating
    if (productId && !isStoreReview) {
      const productReviews = await Review.find({
        productId,
        status: 'approved',
        isStoreReview: false,
      });

      const avgRating = productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length;

      await Product.findByIdAndUpdate(productId, {
        'rating.average': Math.round(avgRating * 10) / 10,
        'rating.count': productReviews.length,
      });
    }

    await review.populate('userId', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

// Update review status (admin)
router.put('/:id/status', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const review = await Review.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId', 'firstName lastName');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review status updated',
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

// Toggle featured status (admin)
router.put('/:id/featured', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    review.isFeatured = !review.isFeatured;
    await review.save();

    res.status(200).json({
      success: true,
      message: `Review ${review.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

// Delete review (admin)
router.delete('/:id', protect, authorize('admin', 'super-admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Update product rating if it was a product review
    if (review.productId && !review.isStoreReview) {
      const productReviews = await Review.find({
        productId: review.productId,
        status: 'approved',
        isStoreReview: false,
      });

      if (productReviews.length > 0) {
        const avgRating = productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length;
        await Product.findByIdAndUpdate(review.productId, {
          'rating.average': Math.round(avgRating * 10) / 10,
          'rating.count': productReviews.length,
        });
      } else {
        await Product.findByIdAndUpdate(review.productId, {
          'rating.average': 0,
          'rating.count': 0,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
