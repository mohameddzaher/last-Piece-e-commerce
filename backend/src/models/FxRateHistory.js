import mongoose from 'mongoose';

/**
 * Append-only change log for FX reference rates. Previously embedded in
 * `FxReference.history`, which grew without bound on the single doc per pair.
 * Each rate change writes the SUPERSEDED rate here, so the timeline is the
 * history rows plus the current rate on FxReference.
 */
const fxRateHistorySchema = new mongoose.Schema(
  {
    from: { type: String, required: true, uppercase: true },
    to: { type: String, required: true, uppercase: true, default: 'EGP' },
    rate: Number,
    setAt: { type: Date, default: Date.now },
    setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    source: String,
    liveRateAtSet: Number,
    note: String,
  },
  { timestamps: true }
);

fxRateHistorySchema.index({ from: 1, to: 1, setAt: -1 });

export default mongoose.model('FxRateHistory', fxRateHistorySchema);
