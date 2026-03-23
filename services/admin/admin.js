const db = require('./db');
const appConfig = require('../../config/appConfig');

async function createAdmin() {
  const [{ default: AdminJS }, AdminJSSequelize] = await Promise.all([
    import('adminjs'),
    import('@adminjs/sequelize'),
  ]);

  AdminJS.registerAdapter({
    Resource: AdminJSSequelize.Resource,
    Database: AdminJSSequelize.Database,
  });

  const userResource = {
    resource: db.User,
    options: {
      navigation: { name: 'User Management', icon: 'User' },
      listProperties: ['id', 'name', 'email', 'role', 'isActive', 'lastLogin', 'createdAt'],
      filterProperties: ['name', 'email', 'role', 'isActive'],
      showProperties: ['id', 'name', 'email', 'role', 'isActive', 'lastLogin', 'createdAt', 'updatedAt'],
      editProperties: ['name', 'email', 'password', 'role', 'isActive'],
      properties: {
        password: {
          isVisible: { list: false, filter: false, show: false, edit: true },
          type: 'password',
        },
        id: { isVisible: { list: true, filter: false, show: true, edit: false } },
      },
      actions: {
        delete: {
          guard: 'Are you sure you want to delete this user?',
          isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        },
      },
    },
  };

  const productResource = {
    resource: db.Product,
    options: {
      navigation: { name: 'Menu Management', icon: 'Tag' },
      listProperties: ['name', 'category', 'price', 'isAvailable', 'stock', 'createdAt'],
      filterProperties: ['name', 'category', 'isAvailable'],
      editProperties: ['name', 'description', 'price', 'category', 'imageUrl', 'isAvailable', 'stock', 'sku'],
      properties: {
        description: { type: 'textarea' },
        price: { type: 'number' },
      },
    },
  };

  const orderResource = {
    resource: db.Order,
    options: {
      navigation: { name: 'Order Management', icon: 'Clipboard' },
      listProperties: ['orderNumber', 'status', 'totalAmount', 'paymentStatus', 'paymentMethod', 'createdAt'],
      filterProperties: ['status', 'paymentStatus', 'paymentMethod'],
      showProperties: [
        'id', 'orderNumber', 'status', 'totalAmount', 'taxAmount',
        'discountAmount', 'paymentStatus', 'paymentMethod', 'notes',
        'tableId', 'userId', 'createdAt', 'updatedAt',
      ],
      editProperties: ['status', 'paymentStatus', 'paymentMethod', 'notes', 'discountAmount'],
      actions: {
        new: { isAccessible: false },
        delete: {
          isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
          guard: 'Are you sure you want to delete this order?',
        },
      },
    },
  };

  const tableResource = {
    resource: db.Table,
    options: {
      navigation: { name: 'Table Management', icon: 'Layout' },
      listProperties: ['tableNumber', 'capacity', 'status', 'floor', 'section', 'isActive'],
      filterProperties: ['status', 'floor', 'isActive'],
      editProperties: ['tableNumber', 'capacity', 'status', 'floor', 'section', 'isActive'],
    },
  };

  return new AdminJS({
    databases: [db.sequelize],
    rootPath: appConfig.admin.path,
    resources: [userResource, productResource, orderResource, tableResource],
    branding: {
      companyName: 'ZaykaPOS Admin',
      logo: false,
      softwareBrothers: false,
      theme: {
        colors: {
          primary100: '#FF6B35',
          primary80: '#FF8C5A',
          primary60: '#FFB08A',
          primary40: '#FFD0BA',
          primary20: '#FFF0EB',
          accent: '#FF6B35',
          love: '#e05780',
          filterBg: '#ffffff',
          hoverBg: '#fff5f0',
          inputBorder: '#d6d6d6',
        },
      },
    },
    locale: {
      language: 'en',
      translations: {
        en: {
          messages: {
            welcomeOnBoard_title: 'Welcome to ZaykaPOS Admin',
            welcomeOnBoard_subtitle: 'Manage your restaurant - products, orders, tables and users.',
          },
        },
      },
    },
  });
}

module.exports = createAdmin;
