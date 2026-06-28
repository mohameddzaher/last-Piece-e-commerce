import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { initSocket } from './realtime/io.js';
import { ensureFxDefaults } from './utils/ensureFxDefaults.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import wishlistRoutes from './routes/wishlist.js';
import adminRoutes from './routes/admin.js';
import categoryRoutes from './routes/categories.js';
import reviewRoutes from './routes/reviews.js';
import uploadRoutes from './routes/upload.js';
import brandRoutes from './routes/brands.js';
import shipmentRoutes from './routes/shipments.js';
import expenseRoutes from './routes/expenses.js';
import saleRoutes from './routes/sales.js';
import siteContentRoutes from './routes/siteContent.js';
import promoCodeRoutes from './routes/promoCodes.js';
import referralRoutes from './routes/referrals.js';
import fxRoutes from './routes/fx.js';

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Behind Render/Netlify/any reverse proxy, the real client IP is in
// X-Forwarded-For. Without this, express-rate-limit keys every request to the
// proxy IP (so one user's burst throttles everyone) and throws a validation
// error. Trust the first proxy hop only.
app.set('trust proxy', 1);

// Connect to database, then seed FX defaults so the admin Dashboard's rate
// cards (SAR, USD, EUR) aren't blank on a fresh deploy.
connectDB().then((conn) => {
  if (conn) ensureFxDefaults();
});

// Security middleware - Enhanced
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3001'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration - allow frontend URLs
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://last-piece.netlify.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// gzip responses — cuts JSON/list payload bandwidth dramatically under load.
app.use(compression());

// Body parser middleware with security limits
app.use(express.json({
  limit: '10mb',
  verify: (_req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ success: false, message: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ limit: '10mb', extended: true, parameterLimit: 10000 }));

// Parse cookies so auth can read an httpOnly token cookie (set on login/refresh).
app.use(cookieParser());

// Rate limiting - skip in development if causing issues
if (process.env.NODE_ENV !== 'development') {
  app.use('/api/', apiLimiter);
}

// Root route. The `build` marker is a manually-bumped string we use to
// confirm Render actually picked up the latest deploy from main — when this
// shows up in the response, we know the new code is live.
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Last Piece API Server',
    version: '1.0.0',
    build: '2026-04-22-r3',
    status: 'running',
    environment: process.env.NODE_ENV,
    commit: process.env.RENDER_GIT_COMMIT || 'unknown',
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/fx', fxRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;
const httpServer = http.createServer(app);
initSocket(httpServer);
const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
  console.log(`🛰  Socket.IO URL: ws://localhost:${PORT}`);
});

// Graceful shutdown — on SIGTERM (Render redeploy/scale-down) stop accepting
// new connections, let in-flight requests finish, then close DB cleanly so we
// don't drop active checkouts or leak Atlas connections.
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  httpServer.close(async () => {
    try {
      const { disconnectDB } = await import('./config/database.js');
      await disconnectDB();
    } catch { /* ignore */ }
    process.exit(0);
  });
  // Hard-exit if connections don't drain in time.
  setTimeout(() => process.exit(1), 15000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  // Don't crash the server, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  // Don't crash the server, just log the error
});

export default app;
