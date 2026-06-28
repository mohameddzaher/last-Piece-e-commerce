import mongoose from 'mongoose';

/**
 * One document per time a promo code is redeemed on an order. Replaces the
 * embedded `PromoCode.usedBy` array, which grew unbounded on popular codes and
 * made the per-user usage check an in-memory scan. Now that check is an indexed
 * countDocuments, and recording a redemption is a single insert.
 */
const promoRedemptionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true },
    promoCode: { type: mongoose.Schema.Types.ObjectId, ref: 'PromoCode' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    discountApplied: { type: Number, default: 0 },
    usedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Per-user usage check (countDocuments) and per-code reporting.
promoRedemptionSchema.index({ code: 1, user: 1 });

export default mongoose.model('PromoRedemption', promoRedemptionSchema);
