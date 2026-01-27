import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        productName: String,
        sku: String,
        quantity: Number,
        price: Number,
        subtotal: Number,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'dispatched', 'in_transit', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
    },
    statusTimeline: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
    billingAddress: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    shippingAddress: {
      firstName: String,
      lastName: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    shipping: {
      method: String,
      cost: Number,
      carrier: String,
      trackingNumber: String,
      estimatedDelivery: Date,
      actualDelivery: Date,
    },
    payment: {
      method: {
        type: String,
        enum: ['stripe', 'paypal', 'bank_transfer', 'cash_on_delivery', 'card', 'cod'],
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
      },
      transactionId: String,
      amount: Number,
      currency: {
        type: String,
        default: 'USD',
      },
    },
    pricing: {
      subtotal: Number,
      tax: Number,
      shipping: Number,
      discount: Number,
      couponCode: String,
      total: Number,
    },
    notes: String,
    adminNotes: String,
    coupon: {
      code: String,
      discountAmount: Number,
      discountPercent: Number,
    },
    createdBy: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ userId: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
