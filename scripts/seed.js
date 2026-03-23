/**
 * seed.js — Populate the database with sample data.
 * Usage: node scripts/seed.js
 *
 * WARNING: This calls sequelize.sync({ force: true }) which DROPS all tables first.
 * Only run this in development.
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

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('🔌 Database connected.');

    // Drop and recreate all tables
    await sequelize.sync({ force: true });
    console.log('🗑️  Tables reset.\n');

    // ── Users ──────────────────────────────────────────────────────────────
    const [adminUser, manager, staff] = await Promise.all([
      models.User.create({
        name: 'Admin User',
        email: 'admin@zayka.com',
        password: 'admin123',
        role: 'admin',
      }),
      models.User.create({
        name: 'Rahul Sharma',
        email: 'manager@zayka.com',
        password: 'manager123',
        role: 'manager',
      }),
      models.User.create({
        name: 'Priya Singh',
        email: 'staff@zayka.com',
        password: 'staff123',
        role: 'staff',
      }),
    ]);
    console.log('✅ Users seeded (3 records)');

    // ── Products ───────────────────────────────────────────────────────────
    const products = await models.Product.bulkCreate([
      { name: 'Butter Chicken', description: 'Rich creamy tomato-based curry', price: 280.00, category: 'Main Course', isAvailable: true, stock: 50, sku: 'MC-001' },
      { name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 220.00, category: 'Starters', isAvailable: true, stock: 30, sku: 'ST-001' },
      { name: 'Veg Biryani', description: 'Fragrant basmati rice with vegetables', price: 260.00, category: 'Main Course', isAvailable: true, stock: 40, sku: 'MC-002' },
      { name: 'Chicken Biryani', description: 'Aromatic rice with tender chicken', price: 320.00, category: 'Main Course', isAvailable: true, stock: 35, sku: 'MC-003' },
      { name: 'Mango Lassi', description: 'Fresh mango yogurt drink', price: 80.00, category: 'Beverages', isAvailable: true, stock: 100, sku: 'BV-001' },
      { name: 'Masala Chai', description: 'Spiced Indian tea', price: 40.00, category: 'Beverages', isAvailable: true, stock: 200, sku: 'BV-002' },
      { name: 'Garlic Naan', description: 'Soft leavened bread with garlic', price: 50.00, category: 'Breads', isAvailable: true, stock: 200, sku: 'BR-001' },
      { name: 'Dal Makhani', description: 'Slow-cooked black lentils in butter', price: 180.00, category: 'Main Course', isAvailable: true, stock: 60, sku: 'MC-004' },
      { name: 'Gulab Jamun', description: 'Soft dumplings soaked in sugar syrup', price: 90.00, category: 'Desserts', isAvailable: true, stock: 80, sku: 'DS-001' },
      { name: 'Samosa (2 pcs)', description: 'Crispy pastry with spiced filling', price: 60.00, category: 'Starters', isAvailable: true, stock: 150, sku: 'ST-002' },
    ]);
    console.log(`✅ Products seeded (${products.length} records)`);

    // ── Tables ─────────────────────────────────────────────────────────────
    const tables = await models.Table.bulkCreate([
      { tableNumber: 'T1', capacity: 2, floor: 'Ground', section: 'Window', status: 'available' },
      { tableNumber: 'T2', capacity: 4, floor: 'Ground', section: 'Main', status: 'available' },
      { tableNumber: 'T3', capacity: 4, floor: 'Ground', section: 'Main', status: 'available' },
      { tableNumber: 'T4', capacity: 4, floor: 'Ground', section: 'Corner', status: 'available' },
      { tableNumber: 'T5', capacity: 6, floor: 'Ground', section: 'Family', status: 'available' },
      { tableNumber: 'T6', capacity: 8, floor: 'First', section: 'VIP', status: 'available' },
      { tableNumber: 'T7', capacity: 2, floor: 'First', section: 'Rooftop', status: 'available' },
      { tableNumber: 'T8', capacity: 4, floor: 'First', section: 'Rooftop', status: 'maintenance' },
    ]);
    console.log(`✅ Tables seeded (${tables.length} records)`);

    // ── Orders ─────────────────────────────────────────────────────────────
    const order1 = await models.Order.create({
      totalAmount: 560.00,
      taxAmount: 56.00,
      discountAmount: 0,
      status: 'delivered',
      paymentStatus: 'paid',
      paymentMethod: 'cash',
      tableId: tables[0].id,
      userId: manager.id,
      notes: 'Less spicy',
    });
    await order1.setProducts([products[0].id, products[6].id]);

    const order2 = await models.Order.create({
      totalAmount: 380.00,
      taxAmount: 38.00,
      discountAmount: 20.00,
      status: 'preparing',
      paymentStatus: 'pending',
      tableId: tables[1].id,
      userId: staff.id,
    });
    await order2.setProducts([products[1].id, products[4].id]);

    console.log('✅ Orders seeded (2 records)');

    console.log('\n🎉 Seed completed successfully!');
    console.log('─────────────────────────────────────────');
    console.log('Admin login:   admin@zayka.com / admin123');
    console.log('Manager login: manager@zayka.com / manager123');
    console.log('Staff login:   staff@zayka.com / staff123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
