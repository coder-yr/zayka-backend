const env = require('./env');

module.exports = {
  api: {
    port: env.API_PORT,
    prefix: '/api',
  },
  admin: {
    port: env.ADMIN_PORT,
    path: '/admin',
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  },
  auth: {
    refreshTtlSeconds: env.REFRESH_TOKEN_TTL_SECONDS,
    cookieSameSite: env.COOKIE_SAME_SITE,
    cookieSecure: env.NODE_ENV === 'production' ? true : env.COOKIE_SECURE,
  },
  cors: {
    origins: env.ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  },
};
