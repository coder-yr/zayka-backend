const db = require('../services/backend/db');
const env = require('./config/env');

async function sync() {
  try {
    console.log('🔄 Starting Database Sync...');
    await db.sequelize.authenticate();
    console.log('✅ Connection established.');
    
    // We use alter: true here specifically for deliberate schema updates
    await db.sequelize.sync({ alter: true });
    console.log('✅ Database schema synchronized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

sync();
