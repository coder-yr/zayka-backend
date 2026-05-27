/**
 * migrate.js — Synchronize database models to the database.
 *
 * Usage:
 *   node scripts/migrate.js           → safe sync (add new tables/columns only)
 *   node scripts/migrate.js --alter   → alter existing tables to match models
 *   node scripts/migrate.js --force   → DROP and recreate all tables (data loss!)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const dbConfig = require('../config/database');

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: console.log,
  define: dbConfig.define,
});

// Load models
const models = {};
const modelsPath = path.resolve(__dirname, '../modules/models');
fs.readdirSync(modelsPath)
  .filter((f) => f.endsWith('.js'))
  .forEach((file) => {
    const model = require(path.join(modelsPath, file))(sequelize);
    models[model.name] = model;
  });
Object.values(models).forEach((m) => m.associate && m.associate(models));

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('🔌 Database connection established.');

    const force = process.argv.includes('--force');
    const alter = process.argv.includes('--alter');

    if (force) {
      console.warn('⚠️  Running with --force: all tables will be DROPPED and recreated!');
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    }

    await sequelize.sync({ force, alter });

    if (force) {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    }

    console.log(`\n✅ Migration completed. [force=${force}, alter=${alter}]`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
