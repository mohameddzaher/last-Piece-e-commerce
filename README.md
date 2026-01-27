# 🛍️ Last Piece - Exclusive E-Commerce Platform

A modern, high-performance e-commerce platform specializing in unique, one-of-a-kind products with only one piece available per item.

## ✨ Features

### 🔐 **Security First**
- **Advanced Security Headers** - HSTS, CSP, XSS Protection, Frame Options
- **Rate Limiting** - Protection against DDoS and brute force attacks
- **JWT Authentication** - Secure token-based authentication with refresh tokens
- **Input Validation** - Comprehensive validation on all API endpoints
- **SQL Injection Protection** - MongoDB parameterized queries
- **Role-Based Access Control** - Admin, Super Admin, and Customer roles

### ⚡ **Performance Optimized**
- **Next.js 13+** - Server-side rendering and static generation
- **Image Optimization** - Automatic WebP/AVIF conversion
- **Code Splitting** - Optimized bundle sizes
- **Lazy Loading** - Images and components loaded on demand
- **Caching Strategy** - Redis-ready for production
- **Gzip Compression** - Reduced payload sizes

### 🎯 **SEO Excellence**
- **Meta Tags** - Dynamic Open Graph and Twitter Cards
- **Structured Data** - Schema.org markup for rich snippets
- **Sitemap & robots.txt** - Optimized for search engines
- **Canonical URLs** - Proper URL canonicalization
- **Mobile Optimized** - Fully responsive design

### 💼 **Business Features**
- **Product Management** - CRUD operations with image upload
- **Category System** - Dynamic categories with filtering
- **Shopping Cart** - Persistent cart with local storage sync
- **Wishlist** - Save products for later
- **Order Management** - Complete order tracking system
- **Review System** - Customer reviews with ratings
- **Admin Dashboard** - Complete admin panel with analytics
- **Financial Reports** - Sales and revenue tracking (Super Admin only)
- **Excel Export** - Export products, orders, and users data

## 🏗️ Tech Stack

### Frontend
- **Next.js 13+** - React framework with SSR/SSG
- **React 18** - Latest React features
- **Zustand** - Lightweight state management
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **React Icons** - Icon library
- **Axios** - HTTP client
- **React Toastify** - Toast notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - JSON Web Tokens
- **Bcrypt** - Password hashing
- **Helmet** - Security headers
- **Express Rate Limit** - Rate limiting
- **Multer** - File uploads
- **ExcelJS** - Excel file generation

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm/yarn
- MongoDB 5.0+
- Git

### Clone Repository
```bash
git clone https://github.com/mohameddzaher/last-Piece-e-commerce.git
cd last-Piece-e-commerce
```

### Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Update .env with your configuration
nano .env

# Start MongoDB (if not running)
# mongod

# Run backend
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install

# Create .env.local file
cp .env.example .env.local

# Update .env.local with your configuration
nano .env.local

# Run frontend
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
# Server
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/lastpiece

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3001
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

## 🚀 Deployment

### Production Build

#### Backend
```bash
cd backend
npm run build
npm start
```

#### Frontend
```bash
cd frontend
npm run build
npm start
```

### Recommended Hosting
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Render, DigitalOcean
- **Database**: MongoDB Atlas

## 📱 Default Accounts

### Super Admin
- **Email**: superadmin@lastpiece.com
- **Password**: SuperAdmin@12345

### Admin
- **Email**: admin@lastpiece.com
- **Password**: Admin@12345

### Customer
- **Email**: user@lastpiece.com
- **Password**: User@12345

⚠️ **IMPORTANT**: Change these credentials in production!

## 🔒 Security Best Practices

1. **Environment Variables** - Never commit `.env` files
2. **Password Policy** - Enforce strong passwords
3. **HTTPS Only** - Use SSL certificates in production
4. **Rate Limiting** - Enabled on all API routes
5. **Input Sanitization** - All user inputs are validated
6. **SQL Injection Protection** - Parameterized queries
7. **XSS Protection** - Content Security Policy headers
8. **CSRF Protection** - Token-based protection

## 📊 Performance Metrics

- **Lighthouse Score**: 95+ (Target)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Core Web Vitals**: All Green

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Mohamed Zaher**
- GitHub: [@mohameddzaher](https://github.com/mohameddzaher)

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Special thanks to all contributors
- Icons by [React Icons](https://react-icons.github.io/react-icons/)

## 📞 Support

For support, email support@lastpiece.com or open an issue in the repository.

---

**Last Piece** - Where Every Product Has a Story 🌟
