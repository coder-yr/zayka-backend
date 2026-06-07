require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

const appConfig = require('../../config/appConfig');
const env = require('../../config/env');
const db = require('./db');

// Route imports
const authRoutes = require('./components/auth/routes');
const productRoutes = require('./components/products/routes');
const orderRoutes = require('./components/orders/routes');
const tableRoutes = require('./components/tables/routes');
const analyticsRoutes = require('./components/analytics/routes');
const featuresRoutes = require('./components/features/routes');
const pricingRoutes = require('./components/pricing/routes');
const geoRoutes = require('./components/geo/routes');
const homeContentRoutes = require('./components/home-content/routes');
const { ensureDefaultRbac } = require('./utils/rbac');

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: appConfig.cors.origins,
    methods: appConfig.cors.methods,
    allowedHeaders: appConfig.cors.allowedHeaders,
    credentials: appConfig.cors.credentials,
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Request Logging ─────────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/public', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use('/public', express.static(path.resolve(__dirname, '../../public')));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend-api', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const { prefix } = appConfig.api;
app.use(`${prefix}/auth`, authRoutes);
app.use(`${prefix}/products`, productRoutes);
app.use(`${prefix}/orders`, orderRoutes);
app.use(`${prefix}/tables`, tableRoutes);
app.use(`${prefix}/analytics`, analyticsRoutes);
app.use(`${prefix}/features`, featuresRoutes);
app.use(`${prefix}/pricing`, pricingRoutes);
app.use(`${prefix}/geo`, geoRoutes);
app.use(`${prefix}/home-content`, homeContentRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = appConfig.api.port;

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connection established.');

    const syncOptions = {
      alter: env.DB_SYNC_ALTER,
      force: env.DB_SYNC_FORCE,
    };
    await db.sequelize.sync(syncOptions);
    await ensureDefaultRbac(db);
    console.log('✅ Database models synchronized.');

    app.listen(PORT, () => {
      console.log(`🚀 Backend API running at http://localhost:${PORT}`);
      console.log(`📋 API prefix: ${prefix}`);
    });
  } catch (error) {
    console.error('❌ Failed to start Backend API server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
