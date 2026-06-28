import mongoose from 'mongoose';

/**
 * One document per person invited via a referral code. Split out of the
 * embedded `Referral.invitations` array so a single referrer inviting thousands
 * of people can't grow one document toward the 16 MB BSON limit, and so the
 * per-referrer list can be paginated and indexed.
 */
const referralInvitationSchema = new mongoose.Schema(
  {
    referral: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', required: true },
    invitedEmail: String,
    invitedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signedUpAt: Date,
    firstOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    firstOrderAt: Date,
    rewardPaid: { type: Boolean, default: false },
    rewardAmount: Number,
  },
  { timestamps: true }
);

referralInvitationSchema.index({ referral: 1, createdAt: -1 });
referralInvitationSchema.index({ invitedUser: 1 });

export default mongoose.model('ReferralInvitation', referralInvitationSchema);
