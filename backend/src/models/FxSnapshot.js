import mongoose from 'mongoose';

/**
 * One FX rate observation per day per currency pair.
 * Populated on demand: first admin hit of the day triggers a fetch + save.
 * Keeps history so we can compute 7-day drift, sparklines, and alerts.
 */
const fxSnapshotSchema = new mongoose.Schema(
  {
    from: { type: String, required: true, uppercase: true }, // SAR / USD / ...
    to: { type: String, required: true, uppercase: true, default: 'EGP' },
    rate: { type: Number, required: true },
    // Stored as YYYY-MM-DD string so uniqueness is per-day and queries are fast.
    date: { type: String, required: true },
    fetchedAt: { type: Date, default: Date.now },
    source: { type: String, default: 'open.er-api.com' },
  },
  { timestamps: true }
);

fxSnapshotSchema.index({ from: 1, to: 1, date: 1 }, { unique: true });
fxSnapshotSchema.index({ from: 1, to: 1, date: -1 });

export default mongoose.model('FxSnapshot', fxSnapshotSchema);
