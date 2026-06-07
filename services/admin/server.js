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
const { ensureDefaultRbac } = require('../backend/utils/rbac');
const {
  buildAdminContext,
  createAdminAuditMiddleware,
  createAdminSessionMiddleware,
  isAdminAllowed,
  recordAdminAudit,
} = require('./middleware');

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
    sameSite: appConfig.auth.cookieSameSite,
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

const loadAdminUserWithAccess = async (email) => {
  return db.User.findOne({
    where: { email, isActive: true },
    include: [
      {
        model: db.UserRole,
        as: 'roleAssignments',
        required: false,
        where: { isActive: true },
        include: [
          {
            model: db.Role,
            as: 'role',
            required: false,
            include: [
              {
                model: db.Permission,
                as: 'permissions',
                required: false,
                through: { attributes: [] },
              },
            ],
          },
          {
            model: db.Outlet,
            as: 'outlet',
            required: false,
          },
        ],
      },
    ],
  });
};

async function startServer() {
  try {
    app.disable('x-powered-by');

    app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'same-origin');
      next();
    });

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
    await ensureDefaultRbac(db);
    await sessionStore.sync();
    console.log('✅ Database models synchronized.');

    const [{ default: AdminJSExpress }, adminJs] = await Promise.all([
      import('@adminjs/express'),
      createAdmin(),
    ]);

    if (env.NODE_ENV === 'development') {
      adminJs.watch();
    }

    // Serve AdminJS frontend bundles and assets from the local .adminjs folder
    // This must be mounted before the admin session middleware so assets are
    // publicly accessible and served with correct MIME types.
    const adminAssetsDir = path.resolve(__dirname, '.adminjs');
    app.use(
      path.join(adminJs.options.rootPath, 'frontend', 'assets'),
      express.static(adminAssetsDir)
    );

    const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
      adminJs,
      {
        authenticate: async (email, password) => {
          try {
            const user = await loadAdminUserWithAccess(email);
            if (!user) {
              await recordAdminAudit(db, {
                actor: { email, role: 'unknown' },
                action: 'adminjs.auth.login.failure',
                resource: 'adminjs',
                route: '/login',
                method: 'POST',
                statusCode: 401,
                outcome: 'failure',
                metadata: { reason: 'user-not-found-or-inactive' },
              });
              return null;
            }

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
              await recordAdminAudit(db, {
                actor: { email, role: 'unknown' },
                action: 'adminjs.auth.login.failure',
                resource: 'adminjs',
                route: '/login',
                method: 'POST',
                statusCode: 401,
                outcome: 'failure',
                metadata: { reason: 'invalid-password' },
              });
              return null;
            }

            const adminContext = buildAdminContext(user);
            if (!isAdminAllowed(adminContext)) {
              await recordAdminAudit(db, {
                actor: adminContext,
                action: 'adminjs.auth.login.denied',
                resource: 'adminjs',
                route: '/login',
                method: 'POST',
                statusCode: 403,
                outcome: 'denied',
                metadata: { reason: 'role-not-allowed' },
              });
              return null;
            }

            await recordAdminAudit(db, {
              actor: adminContext,
              action: 'adminjs.auth.login.success',
              resource: 'adminjs',
              route: '/login',
              method: 'POST',
              statusCode: 200,
              outcome: 'success',
              metadata: {
                role: adminContext.role,
                permissions: adminContext.permissions,
              },
            });

            return adminContext;
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

    app.use(adminJs.options.rootPath, session(sessionOptions));
    app.use(adminJs.options.rootPath, createAdminSessionMiddleware({ db, rootPath: adminJs.options.rootPath }));
    app.use(adminJs.options.rootPath, createAdminAuditMiddleware({ db, rootPath: adminJs.options.rootPath }));
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
