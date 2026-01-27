# Database Schema

## User Collection

```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  avatar: String,
  role: String (customer | admin | super-admin),
  status: String (active | inactive | blocked),
  emailVerified: Boolean,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date,
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    isDefault: Boolean
  },
  preferences: {
    newsletter: Boolean,
    notifications: Boolean,
    theme: String (light | dark)
  },
  metadata: {
    totalOrders: Number,
    totalSpent: Number,
    averageOrderValue: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Product Collection

```javascript
{
  _id: ObjectId,
  name: String (unique),
  slug: String (unique),
  description: String,
  shortDescription: String,
  price: Number,
  originalPrice: Number,
  sku: String (unique),
  category: ObjectId (ref: Category),
  subcategory: ObjectId (ref: Category),
  images: [
    {
      url: String,
      alt: String,
      isPrimary: Boolean
    }
  ],
  thumbnail: String,
  model3D: {
    url: String,
    format: String (gltf | glb | fbx)
  },
  stock: Number (default: 1),
  isAvailable: Boolean,
  brand: String,
  materials: [String],
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: String (cm | in | m)
  },
  weight: {
    value: Number,
    unit: String (kg | lb | g)
  },
  tags: [String],
  collection: ObjectId (ref: Collection),
  badges: [
    {
      label: String,
      type: String (new | trending | limited | exclusive),
      expiresAt: Date
    }
  ],
  promotion: {
    isActive: Boolean,
    discountPercent: Number,
    discountedPrice: Number,
    startDate: Date,
    endDate: Date,
    countdownTimer: Date
  },
  rating: {
    average: Number,
    count: Number
  },
  reviews: [ObjectId] (ref: Review),
  viewCount: Number,
  wishlistCount: Number,
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    canonicalUrl: String
  },
  status: String (draft | active | inactive | discontinued),
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## Category Collection

```javascript
{
  _id: ObjectId,
  name: String (unique),
  slug: String (unique),
  description: String,
  image: String,
  icon: String,
  parent: ObjectId (ref: Category),
  level: Number (0 for top-level),
  order: Number,
  isActive: Boolean,
  productCount: Number,
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Cart Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, unique),
  items: [
    {
      productId: ObjectId (ref: Product),
      quantity: Number,
      price: Number,
      addedAt: Date
    }
  ],
  subtotal: Number,
  tax: Number,
  shipping: Number,
  discount: Number,
  couponCode: String,
  total: Number,
  lastUpdated: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Order Collection

```javascript
{
  _id: ObjectId,
  orderNumber: String (unique),
  userId: ObjectId (ref: User),
  items: [
    {
      productId: ObjectId (ref: Product),
      productName: String,
      sku: String,
      quantity: Number,
      price: Number,
      subtotal: Number
    }
  ],
  status: String (pending | confirmed | processing | dispatched | in_transit | delivered | cancelled | returned),
  statusTimeline: [
    {
      status: String,
      timestamp: Date,
      notes: String
    }
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
    country: String
  },
  shippingAddress: {
    firstName: String,
    lastName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  shipping: {
    method: String,
    cost: Number,
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date
  },
  payment: {
    method: String (stripe | paypal | bank_transfer | cash_on_delivery),
    status: String (pending | completed | failed | refunded),
    transactionId: String,
    amount: Number,
    currency: String
  },
  pricing: {
    subtotal: Number,
    tax: Number,
    shipping: Number,
    discount: Number,
    total: Number
  },
  notes: String,
  adminNotes: String,
  coupon: {
    code: String,
    discountAmount: Number,
    discountPercent: Number
  },
  createdBy: String (customer | admin),
  createdAt: Date,
  updatedAt: Date
}
```

## Wishlist Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, unique),
  items: [
    {
      productId: ObjectId (ref: Product),
      addedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## Review Collection

```javascript
{
  _id: ObjectId,
  productId: ObjectId (ref: Product),
  userId: ObjectId (ref: User),
  orderId: ObjectId (ref: Order),
  rating: Number (1-5),
  title: String,
  comment: String,
  verified: Boolean,
  helpful: Number,
  unhelpful: Number,
  status: String (pending | approved | rejected),
  images: [String],
  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

### User Collection
- `email` (unique)
- `role`
- `status`

### Product Collection
- `slug` (unique)
- `sku` (unique)
- `category`
- `status`
- `createdAt`
- Text index: `name`, `description`, `tags`

### Order Collection
- `userId`
- `orderNumber` (unique)
- `status`
- `createdAt`

### Cart Collection
- `userId` (unique)

### Wishlist Collection
- `userId` (unique)

### Review Collection
- `productId`
- `userId`
- `status`

## Relationships

```
User
├── Orders (1 to Many)
├── Cart (1 to 1)
├── Wishlist (1 to 1)
└── Reviews (1 to Many)

Product
├── Category (Many to 1)
├── Images (1 to Many)
├── Reviews (1 to Many)
└── Orders (Many to Many through OrderItems)

Category
└── Subcategories (Self-referencing)

Order
├── User (Many to 1)
├── OrderItems (1 to Many)
└── Payment (1 to 1)
```
