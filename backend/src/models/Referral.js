import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema(
  {
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true, unique: true, uppercase: true },

    rewardType: { type: String, enum: ['percent', 'fixed', 'credit'], default: 'percent' },
    referrerReward: { type: Number, default: 10 }, // percent or amount given to referrer
    refereeReward: { type: Number, default: 10 }, // percent or amount given to new buyer
    currency: { type: String, default: 'EGP' },

    // Individual invitations live in the `ReferralInvitation` collection (a power
    // referrer could invite thousands — an embedded array would grow unbounded
    // on one document). The rollup counters below stay denormalized for fast reads.

    totalInvited: { type: Number, default: 0 },
    totalConverted: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

referralSchema.index({ referrer: 1 });

export default mongoose.model('Referral', referralSchema);
