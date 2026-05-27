const db = require('../services/backend/db');

async function seed() {
  try {
    console.log('🔄 Seeding POS Database...');
    await db.sequelize.authenticate();
    console.log('🔌 Database connection established.');

    // 1. Seed Users
    const usersCount = await db.User.count();
    let adminUser, staffUser;
    if (usersCount === 0) {
      adminUser = await db.User.create({
        name: 'Admin Cashier',
        email: 'admin@zayka.com',
        password: 'adminpassword',
        role: 'admin',
        isActive: true,
      });
      staffUser = await db.User.create({
        name: 'Jane Cashier',
        email: 'cashier@zayka.com',
        password: 'cashierpassword',
        role: 'staff',
        isActive: true,
      });
      console.log('✅ Created default users: admin@zayka.com / cashier@zayka.com');
    } else {
      adminUser = await db.User.findOne({ where: { role: 'admin' } });
      staffUser = await db.User.findOne({ where: { role: 'staff' } });
      console.log('ℹ️ Users already exist, skipping user seed.');
    }

    // 2. Seed Tables
    const tablesCount = await db.Table.count();
    if (tablesCount === 0) {
      await db.Table.bulkCreate([
        { tableNumber: 'T1', capacity: 2, status: 'occupied', floor: 'Ground', section: 'Main Dining' },
        { tableNumber: 'T2', capacity: 4, status: 'available', floor: 'Ground', section: 'Main Dining' },
        { tableNumber: 'T3', capacity: 4, status: 'reserved', floor: 'Ground', section: 'Window Side' },
        { tableNumber: 'T4', capacity: 6, status: 'available', floor: 'Rooftop', section: 'Terrace' },
        { tableNumber: 'T5', capacity: 2, status: 'occupied', floor: 'Rooftop', section: 'Terrace' },
        { tableNumber: 'T6', capacity: 8, status: 'available', floor: 'First Floor', section: 'VIP Cabin' },
      ]);
      console.log('✅ Created restaurant tables T1-T6');
    } else {
      console.log('ℹ️ Tables already exist, skipping table seed.');
    }

    // 3. Seed Products
    const productsCount = await db.Product.count();
    if (productsCount === 0) {
      await db.Product.bulkCreate([
        {
          name: 'Paneer Butter Masala',
          description: 'Cubes of cottage cheese cooked in a rich, creamy tomato and butter gravy.',
          price: 280.00,
          category: 'Mains',
          isAvailable: true,
          stock: 50,
          sku: 'MA-PBM-01',
        },
        {
          name: 'Garlic Naan',
          description: 'Traditional leavened flatbread topped with minced garlic and butter.',
          price: 60.00,
          category: 'Mains',
          isAvailable: true,
          stock: 120,
          sku: 'MA-GN-02',
        },
        {
          name: 'Veg Dum Biryani',
          description: 'Fragrant basmati rice layered with spiced vegetables, saffron, and mint, cooked on dum.',
          price: 320.00,
          category: 'Mains',
          isAvailable: true,
          stock: 35,
          sku: 'MA-VDB-03',
        },
        {
          name: 'Crispy Spring Rolls',
          description: 'Golden fried wrappers stuffed with seasoned shredded vegetables, served with sweet chili sauce.',
          price: 180.00,
          category: 'Starters',
          isAvailable: true,
          stock: 40,
          sku: 'ST-CSR-01',
        },
        {
          name: 'Tandoori Paneer Tikka',
          description: 'Cottage cheese cubes marinated in spiced yogurt and grilled in a clay oven.',
          price: 240.00,
          category: 'Starters',
          isAvailable: true,
          stock: 30,
          sku: 'ST-TPT-02',
        },
        {
          name: 'Gulab Jamun',
          description: 'Warm, soft milk-solid dumplings soaked in cardamom flavor sugar syrup.',
          price: 90.00,
          category: 'Desserts',
          isAvailable: true,
          stock: 80,
          sku: 'DE-GJ-01',
        },
        {
          name: 'Warm Chocolate Lava Cake',
          description: 'Rich chocolate cake with a molten liquid center, served with vanilla ice cream.',
          price: 180.00,
          category: 'Desserts',
          isAvailable: true,
          stock: 25,
          sku: 'DE-CLC-02',
        },
        {
          name: 'Mango Lassi',
          description: 'Creamy yogurt drink blended with fresh sweet mango pulp and cardamoms.',
          price: 120.00,
          category: 'Beverages',
          isAvailable: true,
          stock: 60,
          sku: 'BE-ML-01',
        },
        {
          name: 'Iced Peach Tea',
          description: 'Brewed black tea infused with peach syrup, served chilled over ice.',
          price: 95.00,
          category: 'Beverages',
          isAvailable: true,
          stock: 75,
          sku: 'BE-IPT-02',
        },
        {
          name: 'Fresh Caesar Salad',
          description: 'Crisp romaine lettuce, garlic croutons, and parmesan cheese tossed in caesar dressing.',
          price: 210.00,
          category: 'Starters',
          isAvailable: true,
          stock: 20,
          sku: 'ST-CS-03',
        }
      ]);
      console.log('✅ Created premium menu products');
    } else {
      console.log('ℹ️ Products already exist, skipping product seed.');
    }

    console.log('🎉 Seeding successfully completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
