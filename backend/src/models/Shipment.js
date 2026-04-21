import mongoose from 'mongoose';

/**
 * A single Saudi → Egypt batch.
 * Shipping cost allocates ONLY across the products in this shipment
 * (not across the whole catalog) — per the user's rule.
 */
const shipmentSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true },
    fromLocation: { type: String, default: 'saudi' },
    toLocation: { type: String, default: 'egypt' },

    products: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    ],
    productCount: { type: Number, default: 0 },

    shippingCost: { type: Number, default: 0, min: 0 },
    shippingCurrency: { type: String, enum: ['SAR', 'EGP', 'USD'], default: 'SAR' },
    customsFees: { type: Number, default: 0, min: 0 },
    otherFees: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },

    // Allocated cost per pair = totalCost / productCount.
    costPerProduct: { type: Number, default: 0 },

    carrier: String,
    trackingNumber: String,
    notes: String,

    status: {
      type: String,
      enum: ['preparing', 'in-transit', 'delivered', 'cancelled'],
      default: 'preparing',
    },
    statusTimeline: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        notes: String,
      },
    ],

    sentAt: Date,
    receivedAt: Date,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

shipmentSchema.pre('save', function (next) {
  if (!this.code) {
    const ts = Date.now().toString().slice(-6);
    const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.code = `SHP-${ts}-${rnd}`;
  }
  this.productCount = this.products?.length || 0;
  this.totalCost = (this.shippingCost || 0) + (this.customsFees || 0) + (this.otherFees || 0);
  this.costPerProduct = this.productCount > 0 ? this.totalCost / this.productCount : 0;
  next();
});

shipmentSchema.index({ status: 1 });
shipmentSchema.index({ createdAt: -1 });

export default mongoose.model('Shipment', shipmentSchema);
