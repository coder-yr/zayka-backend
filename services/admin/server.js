const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const createAdmin = require('./admin');
const db = require('./db');
const env = require('../../config/env');
const appConfig = require('../../config/appConfig');

const app = express();

// ─── Logging ─────────────────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ─── Session Store (Sequelize-backed) ────────────────────────────────────────
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sessionStore = new SequelizeStore({ db: db.sequelize });

const sessionOptions = {
  secret: env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  },
};

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'admin-panel', timestamp: new Date().toISOString() });
});

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/public', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use('/public', express.static(path.resolve(__dirname, '../../public')));

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = appConfig.admin.port;
const formidableUploadDir = path.resolve(__dirname, '../../public/uploads/tmp');

async function startServer() {
  try {
    if (!fs.existsSync(formidableUploadDir)) {
      fs.mkdirSync(formidableUploadDir, { recursive: true });
    }

    await db.sequelize.authenticate();
    console.log('✅ Database connection established.');

    const syncOptions = {
      alter: env.DB_SYNC_ALTER,
      force: env.DB_SYNC_FORCE,
    };
    await db.sequelize.sync(syncOptions);
    await sessionStore.sync();
    console.log('✅ Database models synchronized.');

    const [{ default: AdminJSExpress }, adminJs] = await Promise.all([
      import('@adminjs/express'),
      createAdmin(),
    ]);

    if (env.NODE_ENV === 'development') {
      adminJs.watch();
    }

    const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
      adminJs,
      {
        authenticate: async (email, password) => {
          try {
            const user = await db.User.findOne({ where: { email, isActive: true, role: 'admin' } });
            if (!user) return null;

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) return null;

            return { email: user.email, role: user.role, id: user.id };
          } catch {
            return null;
          }
        },
        cookieName: 'adminjs_session',
        cookiePassword: env.JWT_SECRET,
      },
      null,
      sessionOptions,
      {
        uploadDir: formidableUploadDir,
        keepExtensions: true,
      }
    );

    app.use(adminJs.options.rootPath, adminRouter);

    // AdminJS expects body parser middleware to be mounted after the admin router.
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.listen(PORT, () => {
      console.log(`🚀 Admin panel running at http://localhost:${PORT}${adminJs.options.rootPath}`);
    });
  } catch (error) {
    console.error('❌ Failed to start Admin server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
