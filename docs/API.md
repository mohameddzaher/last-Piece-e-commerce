# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require an `Authorization` header with a Bearer token:
```
Authorization: Bearer {accessToken}
```

---

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "customer",
    "status": "active"
  }
}
```

### 2. Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

### 3. Verify Email
**POST** `/auth/verify-email`

**Request Body:**
```json
{
  "token": "verification_token_from_email"
}
```

### 4. Forgot Password
**POST** `/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

### 5. Reset Password
**POST** `/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

### 6. Get Profile
**GET** `/auth/profile`

**Headers:**
```
Authorization: Bearer {accessToken}
```

### 7. Update Profile
**PUT** `/auth/profile`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  }
}
```

---

## Product Endpoints

### 1. Get All Products
**GET** `/products`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `category` - Filter by category ID
- `search` - Search query
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `sort` - Sort order (default: -createdAt)

**Example:**
```
GET /products?page=1&limit=10&search=sneaker&minPrice=100&maxPrice=500
```

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "pages": 10,
    "currentPage": 1,
    "pageSize": 10
  }
}
```

### 2. Get Product by Slug
**GET** `/products/:slug`

**Example:**
```
GET /products/vintage-leather-jacket
```

### 3. Search Products
**GET** `/products/search`

**Query Parameters:**
- `query` (required) - Search query
- `limit` - Results limit (default: 10)

### 4. Get Related Products
**GET** `/products/:id/related`

**Query Parameters:**
- `limit` - Number of related products (default: 4)

### 5. Create Product (Admin)
**POST** `/products`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Vintage Leather Jacket",
  "description": "An authentic vintage leather jacket from the 1980s...",
  "price": 299.99,
  "originalPrice": 399.99,
  "category": "category_id",
  "images": [
    {
      "url": "image_url",
      "alt": "Jacket front view",
      "isPrimary": true
    }
  ],
  "brand": "Levi's",
  "materials": ["Leather"],
  "tags": ["vintage", "leather", "jacket"]
}
```

---

## Cart Endpoints

### 1. Get Cart
**GET** `/cart`

**Headers:**
```
Authorization: Bearer {accessToken}
```

### 2. Add to Cart
**POST** `/cart/add`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "product_id",
  "quantity": 1
}
```

### 3. Remove from Cart
**POST** `/cart/remove`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "product_id"
}
```

### 4. Update Cart Item
**PUT** `/cart/update`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "product_id",
  "quantity": 2
}
```

### 5. Apply Coupon
**POST** `/cart/apply-coupon`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "couponCode": "SUMMER20"
}
```

### 6. Clear Cart
**DELETE** `/cart/clear`

**Headers:**
```
Authorization: Bearer {accessToken}
```

---

## Order Endpoints

### 1. Create Order
**POST** `/orders`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "billingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  },
  "shippingAddress": { ... },
  "paymentMethod": "stripe"
}
```

### 2. Get Orders
**GET** `/orders`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` - Filter by order status

### 3. Get Order by ID
**GET** `/orders/:id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

### 4. Update Order Status (Admin)
**PUT** `/orders/:id/status`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "dispatched",
  "notes": "Package dispatched from warehouse"
}
```

### 5. Cancel Order
**PUT** `/orders/:id/cancel`

**Headers:**
```
Authorization: Bearer {accessToken}
```

---

## Wishlist Endpoints

### 1. Get Wishlist
**GET** `/wishlist`

**Headers:**
```
Authorization: Bearer {accessToken}
```

### 2. Add to Wishlist
**POST** `/wishlist/add`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "product_id"
}
```

### 3. Remove from Wishlist
**POST** `/wishlist/remove`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "product_id"
}
```

### 4. Clear Wishlist
**DELETE** `/wishlist/clear`

**Headers:**
```
Authorization: Bearer {accessToken}
```

---

## Admin Endpoints

### 1. Get All Users
**GET** `/admin/users`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` - Search by name/email
- `role` - Filter by role
- `status` - Filter by status

### 2. Update User Role
**PUT** `/admin/users/:userId/role`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "role": "admin"
}
```

### 3. Block User
**PUT** `/admin/users/:userId/block`

**Headers:**
```
Authorization: Bearer {accessToken}
```

### 4. Get All Orders
**GET** `/admin/orders`

**Headers:**
```
Authorization: Bearer {accessToken}
```

### 5. Dashboard Stats
**GET** `/admin/dashboard/stats`

**Headers:**
```
Authorization: Bearer {accessToken}
```

---

## Error Handling

All endpoints return error responses in the following format:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `423` - Locked (account locked)
- `500` - Internal Server Error

---

## Rate Limiting

The API implements rate limiting:
- **Auth endpoints**: 5 requests per 15 minutes
- **Search endpoints**: 30 requests per minute
- **General API**: 100 requests per 15 minutes

Rate limit information is included in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1234567890
```
