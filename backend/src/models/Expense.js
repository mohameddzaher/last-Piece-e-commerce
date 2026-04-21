import mongoose from 'mongoose';

/**
 * Operating expenses (overhead). NOT allocated into per-product landed cost.
 * Shown separately on the dashboard P&L.
 */
const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: [
        'salary-saudi',
        'salary-egypt',
        'rent-egypt',
        'fitout-egypt',
        'utilities-egypt',
        'marketing',
        'customs',
        'bank-fees',
        'shipping-other',
        'other',
      ],
      required: true,
    },
    title: { type: String, required: true },
    description: String,
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['SAR', 'EGP', 'USD'], default: 'EGP' },

    // Recurring monthly expense?
    isRecurring: { type: Boolean, default: false },
    recurrenceDay: Number, // day of month, 1–31

    // Who/what does it relate to?
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedShipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },

    incurredOn: { type: Date, default: Date.now },
    paidOn: Date,
    paymentMethod: String,
    receiptUrl: String,

    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

expenseSchema.index({ category: 1 });
expenseSchema.index({ incurredOn: -1 });
expenseSchema.index({ isRecurring: 1 });

export default mongoose.model('Expense', expenseSchema);
