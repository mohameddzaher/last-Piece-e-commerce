# Last Piece - Enterprise E-Commerce Platform

**Last Piece** is a premium, enterprise-grade e-commerce platform for selling unique, one-of-a-kind products. The application is built with modern technologies, focusing on performance, security, scalability, SEO optimization, and exceptional user experience.

## 🌟 Key Features

- **Unique Product System**: Each item exists only once in the world
- **Advanced Search**: Full-text search with autocomplete and filters
- **3D Product Visualization**: Interactive Three.js models for products
- **User Authentication**: Secure JWT-based auth with refresh tokens
- **Shopping Cart**: Persistent cart with real-time updates
- **Order Management**: Complete order workflow with status tracking
- **Admin Dashboard**: Comprehensive dashboard for managing products, users, and orders
- **User Dashboard**: Profile, orders, wishlist, and recommendations
- **Payment Integration**: Stripe payment processing
- **Email Notifications**: Order confirmations and status updates
- **Rate Limiting**: Protection against abuse and DDoS attacks
- **Responsive Design**: Mobile-first responsive UI
- **Dark/Light Mode**: Theme toggle for user preference
- **Accessibility**: WCAG 2.1 AA compliant
- **SEO Optimized**: Structured data, sitemaps, meta tags

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with SSR/SSG
- **Tailwind CSS** - Utility-first CSS framework
- **Three.js** - 3D graphics library
- **Zustand** - State management
- **React Query** - Server state management
- **Axios** - HTTP client
- **Framer Motion** - Animation library

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **Stripe** - Payment processing
- **Nodemailer** - Email service

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Container orchestration
- **GitHub Actions** - CI/CD pipeline
- **MongoDB Atlas** - Cloud database

## 📁 Project Structure

```
last-piece/
├── backend/
│   ├── src/
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API routes
│   │   ├── controllers/      # Business logic
│   │   ├── middleware/       # Custom middleware
│   │   ├── utils/            # Utility functions
│   │   ├── config/           # Configuration
│   │   └── server.js         # Main server file
│   ├── tests/                # Backend tests
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/            # Next.js pages
│   │   ├── components/       # React components
│   │   ├── store/            # Zustand stores
│   │   ├── utils/            # Utility functions
│   │   ├── styles/           # Global styles
│   │   └── hooks/            # Custom hooks
│   ├── public/               # Static files
│   ├── tests/                # Frontend tests
│   ├── package.json
│   ├── Dockerfile
│   ├── next.config.js
│   └── .env.example
├── docs/                     # Documentation
├── devops/
│   ├── docker-compose.yml    # Docker Compose config
│   └── deployment/           # Deployment scripts
├── .github/
│   └── workflows/            # CI/CD workflows
└── package.json              # Root package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/last-piece.git
cd last-piece
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Backend:
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

Frontend:
```bash
cd ../frontend
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Start the development servers**

Using Docker Compose:
```bash
npm run docker:up
```

Or locally:
```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017

## 📚 API Documentation

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Verify Email
```
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification_token"
}
```

### Product Endpoints

#### Get All Products
```
GET /api/products?page=1&limit=10&category=&search=&minPrice=0&maxPrice=10000&sort=-createdAt
```

#### Get Product by Slug
```
GET /api/products/:slug
```

#### Search Products
```
GET /api/products/search?query=sneaker&limit=10
```

### Cart Endpoints

#### Get Cart
```
GET /api/cart
Authorization: Bearer {accessToken}
```

#### Add to Cart
```
POST /api/cart/add
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "productId": "product_id",
  "quantity": 1
}
```

#### Remove from Cart
```
POST /api/cart/remove
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "productId": "product_id"
}
```

### Order Endpoints

#### Create Order
```
POST /api/orders
Authorization: Bearer {accessToken}
Content-Type: application/json

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

#### Get Orders
```
GET /api/orders?page=1&limit=10&status=
Authorization: Bearer {accessToken}
```

#### Get Order by ID
```
GET /api/orders/:id
Authorization: Bearer {accessToken}
```

## 🧪 Testing

### Run all tests
```bash
npm run test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run E2E tests
```bash
npm run test:e2e
```

## 📦 Deployment

### Using Docker Compose (Local)
```bash
npm run docker:build
npm run docker:up
```

### Using Vercel (Frontend)
```bash
vercel deploy
```

### Using Render/Railway (Backend)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy from dashboard

### Using MongoDB Atlas (Database)
1. Create a cluster at mongodb.com/cloud/atlas
2. Get connection string
3. Add to backend .env

## 🔐 Security Features

- ✅ HTTPS/SSL support
- ✅ JWT token-based authentication
- ✅ Password hashing with bcryptjs
- ✅ Rate limiting
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ CSRF protection headers
- ✅ XSS protection
- ✅ SQL injection prevention (MongoDB)
- ✅ Secure password reset flow
- ✅ Email verification
- ✅ Account lockout after failed attempts

## 📊 Database Schema

### User
- _id, firstName, lastName, email, password, phone, avatar
- role (customer, admin, super-admin), status (active, inactive, blocked)
- emailVerified, address, preferences
- metadata (totalOrders, totalSpent, averageOrderValue)

### Product
- _id, name, slug, description, price, originalPrice, sku
- category, subcategory, images, thumbnail, model3D
- stock, brand, materials, dimensions, weight
- tags, collection, badges, promotion
- rating, reviews, viewCount, wishlistCount
- seo, status, createdBy, updatedBy

### Cart
- userId, items (productId, quantity, price, addedAt)
- subtotal, tax, shipping, discount, couponCode, total

### Order
- orderNumber, userId, items
- status, statusTimeline (status, timestamp, notes)
- billingAddress, shippingAddress
- shipping (method, cost, carrier, trackingNumber, estimatedDelivery, actualDelivery)
- payment (method, status, transactionId, amount)
- pricing (subtotal, tax, shipping, discount, total)

### Wishlist
- userId, items (productId, addedAt)

### Review
- productId, userId, orderId
- rating, title, comment, verified
- helpful, unhelpful, status (pending, approved, rejected)

## 🎨 UI/UX Design

### Color Palette
- Primary: #0F172A (Dark Navy)
- Secondary: #1E293B (Slate)
- Accent: #F59E0B (Amber)
- Success: #10B981 (Green)
- Error: #EF4444 (Red)
- Info: #3B82F6 (Blue)

### Typography
- Headings: Playfair Display (serif)
- Body: Inter (sans-serif)

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📞 Support

For support, email support@lastpiece.com or open an issue on GitHub.

## 🚀 Roadmap

- [ ] Advanced product filtering and faceted search
- [ ] Social media integration (share listings)
- [ ] Seller dashboard for multiple sellers
- [ ] Auction system for rare items
- [ ] AR product visualization
- [ ] Live chat support
- [ ] Recommendation engine
- [ ] Advanced analytics
- [ ] Mobile app (React Native)

## 👏 Acknowledgments

Built with ❤️ by the Last Piece team.
