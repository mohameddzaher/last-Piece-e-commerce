import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false, // Not required for store/homepage reviews
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: String,
    comment: String,
    verified: {
      type: Boolean,
      default: false,
    },
    helpful: {
      type: Number,
      default: 0,
    },
    unhelpful: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    images: [String],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isStoreReview: {
      type: Boolean,
      default: false, // true for homepage reviews, false for product reviews
    },
  },
  {
    timestamps: true,
  }
);

// Product review list: find({ productId, status }).sort(createdAt desc) from one index.
reviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
// Homepage/featured store reviews.
reviewSchema.index({ isStoreReview: 1, status: 1, isFeatured: 1 });
reviewSchema.index({ userId: 1 });

export default mongoose.model('Review', reviewSchema);
