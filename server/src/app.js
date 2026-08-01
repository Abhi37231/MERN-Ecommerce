/**
 * app.js — Express application setup.
 *
 * This file is responsible for:
 *  1. Loading all middleware (security, parsing, logging)
 *  2. Registering all API routes
 *  3. Handling 404s and global errors
 *
 * It does NOT start the server — that happens in server.js.
 * Separating app from server makes the app testable in isolation.
 *
 * Security layers applied (in order):
 *  - helmet        → sets secure HTTP headers
 *  - rate-limit    → prevents brute force / DDoS
 *  - mongo-sanitize → prevents NoSQL injection
 *  - xss-clean     → strips HTML/script tags from user input
 *  - hpp           → prevents HTTP parameter pollution
 *  - cors          → restricts cross-origin requests to allowed origins
 *  - cookie-parser → parses httpOnly cookies for JWT auth
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const path = require('path');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const couponRoutes = require('./routes/couponRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const customRequestRoutes = require('./routes/customRequestRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// ─── 1. Trust Proxy (required for Render/Heroku behind load balancers) ─────
app.set('trust proxy', 1);

// ─── 2. Security HTTP Headers ────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow CDN images
  })
);

// ─── 3. CORS ─────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman), explicit allowed origins, or Vercel preview links
      if (
        !origin || 
        allowedOrigins.includes(origin) || 
        /^https:\/\/mern-ecommerce-.*\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin "${origin}" is not allowed.`));
      }
    },
    credentials: true, // Required to send httpOnly cookies cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── 4. Rate Limiting ─────────────────────────────────────────────────────────
// Global limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

// Stricter limiter for auth routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

if (process.env.NODE_ENV === 'production') {
  app.use('/api', globalLimiter);
  app.use('/api/v1/auth', authLimiter);
}

// ─── 5. Body Parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));       // Reject JSON payloads > 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── 6. Data Sanitization ────────────────────────────────────────────────────
app.use(mongoSanitize()); // Remove $ and . from user input (NoSQL injection)
app.use(xssClean());       // Strip HTML/script tags from user input

// ─── 7. HTTP Parameter Pollution Protection ───────────────────────────────────
app.use(
  hpp({
    // Whitelist query params that legitimately appear multiple times
    whitelist: ['sort', 'fields', 'category', 'tags', 'sizes', 'colors'],
  })
);

// ─── 8. Request Logging ───────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined')); // Apache-style logs in production
}

// ─── 9. Static Files (local uploads fallback) ────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── 10. Health Check ────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 Welcome to ShopSphere API',
    tagline: 'Discover. Shop. Smile.',
    version: '1.0.0',
    docs: `${process.env.CLIENT_URL}/api-docs`,
  });
});

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ShopSphere API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── 11. API Routes ───────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/custom-requests', customRequestRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// ─── 12. 404 Handler (must be after all routes) ──────────────────────────────
app.use(notFound);

// ─── 13. Global Error Handler (must be last) ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
