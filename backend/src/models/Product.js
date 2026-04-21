import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true,
      maxlength: 200,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide description'],
    },
    shortDescription: {
      type: String,
      maxlength: 500,
    },
    // Public selling price (kept for customer-facing API & old code).
    // Resolves to onlinePrice when product is online, else offlinePrice.
    price: {
      type: Number,
      required: [true, 'Please provide price'],
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },

    // ---- Last Piece pricing pipeline ----
    // Saudi-staff sees this. Egypt-staff and customers MUST NOT see it.
    purchasePrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    purchaseCurrency: {
      type: String,
      enum: ['SAR', 'EGP', 'USD'],
      default: 'SAR',
    },
    // FX rate used to convert purchaseCurrency → EGP on the day we bought this pair.
    // Frozen so P&L reports reflect the real cost even after the market moves.
    purchaseExchangeRate: {
      type: Number,
      default: 0,
    },
    // Denormalized: purchasePrice * purchaseExchangeRate, stored for fast reporting.
    purchasePriceEGP: {
      type: Number,
      default: 0,
    },
    // Set by super-admin. Egypt-staff sees these.
    onlinePrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    offlinePrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    minSellPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    sellingCurrency: {
      type: String,
      enum: ['EGP', 'SAR', 'USD'],
      default: 'EGP',
    },

    // Where the product physically lives & where it can be sold.
    location: {
      type: String,
      enum: ['saudi', 'transit', 'egypt-online', 'egypt-offline', 'egypt-both', 'sold'],
      default: 'saudi',
    },
    locationHistory: [
      {
        location: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        notes: String,
      },
    ],

    // Sourcing info — Saudi-staff fills this in.
    supplier: {
      name: String,
      contact: String,
      city: String,
      notes: String,
    },
    purchaseDate: Date,
    batchCode: String,
    qrCode: String,

    // Cached cost analytics (recomputed when shipments / expenses change).
    landedCost: { type: Number, default: 0 },
    allocatedShippingCost: { type: Number, default: 0 },
    shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },

    sku: {
      type: String,
      unique: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    brandRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
    },
    gender: {
      type: String,
      enum: ['men', 'women', 'kids', 'unisex'],
      default: 'unisex',
    },
    size: String,
    color: String,
    condition: {
      type: String,
      enum: ['new', 'like-new', 'used'],
      default: 'new',
    },
    images: [
      {
        url: String,
        alt: String,
        isPrimary: Boolean,
      },
    ],
    thumbnail: String,
    model3D: {
      url: String,
      format: String, // 'gltf', 'glb', 'fbx', etc.
    },
    stock: {
      type: Number,
      default: 1, // Last Piece - always 1
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    brand: String,
    materials: [String],
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'in', 'm'],
        default: 'cm',
      },
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['kg', 'lb', 'g'],
        default: 'kg',
      },
    },
    tags: [String],
    collection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
    },
    badges: [
      {
        label: String,
        type: {
          type: String,
          enum: ['new', 'trending', 'limited', 'exclusive'],
        },
        expiresAt: Date,
      },
    ],
    // Per-product FAQ — questions specific to this pair (sizing notes, condition, story).
    faqs: [
      {
        question: String,
        answer: String,
      },
    ],
    promotion: {
      isActive: Boolean,
      discountPercent: {
        type: Number,
        min: 0,
        max: 100,
      },
      discountedPrice: Number,
      startDate: Date,
      endDate: Date,
      countdownTimer: Date,
    },
    rating: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
    },
    wishlistCount: {
      type: Number,
      default: 0,
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      canonicalUrl: String,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'discontinued'],
      default: 'draft',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate slug, SKU, and keep purchasePriceEGP in sync.
productSchema.pre('save', async function (next) {
  try {
    if (this.isModified('name') || !this.slug) {
      this.slug = this.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    if (!this.sku) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      const namePrefix = this.name.slice(0, 3).toUpperCase();
      this.sku = `LP-${namePrefix}-${timestamp}-${random}`;
    }

    // If this is a new purchase in a non-EGP currency and the caller didn't
    // specify a rate, auto-fill from the active FxReference ("book rate").
    // This is the "set the rate once, everything uses it" behaviour.
    if (
      this.isNew &&
      this.purchasePrice > 0 &&
      this.purchaseCurrency &&
      this.purchaseCurrency !== 'EGP' &&
      !this.purchaseExchangeRate
    ) {
      try {
        const FxReference = (await import('./FxReference.js')).default;
        const ref = await FxReference.findOne({
          from: this.purchaseCurrency,
          to: 'EGP',
        });
        if (ref?.rate) this.purchaseExchangeRate = ref.rate;
      } catch { /* fall through — keep rate unset */ }
    }

    // Keep the frozen-EGP value up to date whenever purchase fields change.
    if (
      this.isModified('purchasePrice') ||
      this.isModified('purchaseExchangeRate') ||
      this.isModified('purchaseCurrency')
    ) {
      const rate =
        this.purchaseCurrency === 'EGP' ? 1 : Number(this.purchaseExchangeRate || 0);
      this.purchasePriceEGP = Number(this.purchasePrice || 0) * rate;
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Text index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Index for common queries
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ location: 1 });
productSchema.index({ brandRef: 1 });
productSchema.index({ gender: 1 });
productSchema.index({ shipment: 1 });

export default mongoose.model('Product', productSchema);
