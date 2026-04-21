import mongoose from 'mongoose';

/**
 * Offline sale at the Egypt physical store.
 * Online sales = Order model (customer-facing).
 * Offline sales need their own record because there's no checkout flow.
 */
const saleSchema = new mongoose.Schema(
  {
    saleNumber: { type: String, unique: true },
    channel: { type: String, enum: ['offline', 'online'], default: 'offline' },

    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: String,
        sku: String,
        sellPrice: { type: Number, required: true },
        landedCost: Number,
        profit: Number,
      },
    ],

    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    promoCode: String,
    total: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    currency: { type: String, default: 'EGP' },

    paymentMethod: { type: String, enum: ['cash', 'card', 'transfer', 'other'], default: 'cash' },
    customerName: String,
    customerPhone: String,
    notes: String,

    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
);

saleSchema.pre('save', function (next) {
  if (!this.saleNumber) {
    const ts = Date.now().toString().slice(-6);
    const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.saleNumber = `SALE-${ts}-${rnd}`;
  }
  this.subtotal = (this.items || []).reduce((sum, i) => sum + (i.sellPrice || 0), 0);
  this.totalCost = (this.items || []).reduce((sum, i) => sum + (i.landedCost || 0), 0);
  this.total = this.subtotal - (this.discount || 0);
  this.totalProfit = this.total - this.totalCost;
  next();
});

saleSchema.index({ channel: 1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ soldBy: 1 });

export default mongoose.model('Sale', saleSchema);
