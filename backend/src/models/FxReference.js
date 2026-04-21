import mongoose from 'mongoose';

/**
 * Manually-managed "book rate" per currency pair.
 *
 * Rationale: FX fluctuates daily, but we want all new purchases/prices within
 * a period to be calculated against a consistent reference rate. The super-
 * admin updates this rate on-demand (pull live OR type it manually). Every
 * new product registration uses this rate as its default `purchaseExchangeRate`.
 * Past products keep the rate they were stored with — nothing is ever
 * overwritten retroactively.
 */
const fxReferenceSchema = new mongoose.Schema(
  {
    from: { type: String, required: true, uppercase: true },
    to: { type: String, required: true, uppercase: true, default: 'EGP' },
    rate: { type: Number, required: true },
    setAt: { type: Date, default: Date.now },
    setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    source: { type: String, enum: ['live', 'manual'], default: 'manual' },
    liveRateAtSet: Number, // the market rate at the moment of setting — for audit
    note: String,
    history: [
      {
        rate: Number,
        setAt: { type: Date, default: Date.now },
        setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        source: String,
        liveRateAtSet: Number,
        note: String,
      },
    ],
  },
  { timestamps: true }
);

fxReferenceSchema.index({ from: 1, to: 1 }, { unique: true });

export default mongoose.model('FxReference', fxReferenceSchema);
