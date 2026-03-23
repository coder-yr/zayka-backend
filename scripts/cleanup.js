/**
 * cleanup.js — Maintenance script for routine database cleanup tasks.
 *
 * Tasks performed:
 *  1. Delete cancelled orders older than 30 days.
 *  2. Reset 'occupied' tables that have no active orders.
 *  3. Deactivate out-of-stock products.
 *
 * Usage: node scripts/cleanup.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Sequelize, Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const dbConfig = require('../config/database');

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: false,
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

const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready'];

async function cleanup() {
  try {
    await sequelize.authenticate();
    console.log('🧹 Starting cleanup...\n');

    // ── 1. Remove old cancelled orders ─────────────────────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedOrders = await models.Order.destroy({
      where: {
        status: 'cancelled',
        createdAt: { [Op.lt]: thirtyDaysAgo },
      },
    });
    console.log(`✅ Removed ${deletedOrders} cancelled orders older than 30 days`);

    // ── 2. Reset occupied tables with no active orders ─────────────────────
    const occupiedTables = await models.Table.findAll({ where: { status: 'occupied' } });
    let resetCount = 0;

    for (const table of occupiedTables) {
      const activeCount = await models.Order.count({
        where: {
          tableId: table.id,
          status: { [Op.in]: ACTIVE_ORDER_STATUSES },
        },
      });

      if (activeCount === 0) {
        await table.update({ status: 'available' });
        resetCount++;
        console.log(`   ↩️  Table ${table.tableNumber} reset to available`);
      }
    }
    console.log(`✅ Reset ${resetCount} stale occupied tables`);

    // ── 3. Mark out-of-stock products as unavailable ───────────────────────
    const [outOfStockCount] = await models.Product.update(
      { isAvailable: false },
      { where: { stock: 0, isAvailable: true } }
    );
    console.log(`✅ Marked ${outOfStockCount} out-of-stock products as unavailable`);

    console.log('\n🎉 Cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup();
