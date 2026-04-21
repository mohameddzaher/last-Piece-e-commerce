import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: String,

    type: { type: String, enum: ['percent', 'fixed', 'free-shipping'], default: 'percent' },
    value: { type: Number, required: true, min: 0 }, // percent (0–100) or fixed amount
    currency: { type: String, default: 'EGP' },

    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: Number, // cap for percent-type

    appliesTo: { type: String, enum: ['all', 'category', 'brand', 'product'], default: 'all' },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    brands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }],
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usageLimitPerUser: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    usedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        usedAt: { type: Date, default: Date.now },
        discountApplied: Number,
      },
    ],

    startsAt: Date,
    expiresAt: Date,
    isActive: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

promoCodeSchema.index({ isActive: 1, expiresAt: 1 });

promoCodeSchema.methods.isValidNow = function () {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.startsAt && this.startsAt > now) return false;
  if (this.expiresAt && this.expiresAt < now) return false;
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit) return false;
  return true;
};

export default mongoose.model('PromoCode', promoCodeSchema);
