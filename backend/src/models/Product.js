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
    price: {
      type: Number,
      required: [true, 'Please provide price'],
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
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

// Pre-save hook to generate slug and SKU
productSchema.pre('save', function (next) {
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
  next();
});

// Text index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Index for common queries
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ createdAt: -1 });

export default mongoose.model('Product', productSchema);
