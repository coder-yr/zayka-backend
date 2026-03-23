require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 3306,
  DB_NAME: process.env.DB_NAME || 'zayka_pos',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_DIALECT: process.env.DB_DIALECT || 'mysql',

  // Ports
  API_PORT: parseInt(process.env.API_PORT, 10) || 5000,
  ADMIN_PORT: parseInt(process.env.ADMIN_PORT, 10) || 7000,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret-in-production-min-32-chars!!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Admin Panel Credentials (fallback only - use DB user with admin role)
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@zayka.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',

  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000'],
};
