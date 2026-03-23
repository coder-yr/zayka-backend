const { DataTypes } = require('sequelize');
const { randomUUID } = require('crypto');

module.exports = (sequelize) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => randomUUID(),
        primaryKey: true,
      },
      orderNumber: {
        type: DataTypes.STRING(30),
        unique: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'),
        defaultValue: 'pending',
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
        defaultValue: 'pending',
      },
      paymentMethod: {
        type: DataTypes.ENUM('cash', 'card', 'upi', 'online'),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tableId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'orders',
      hooks: {
        beforeCreate: (order) => {
          if (!order.orderNumber) {
            const ts = Date.now().toString().slice(-6);
            const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            order.orderNumber = `ORD-${ts}-${rand}`;
          }
        },
      },
    }
  );

  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Order.belongsTo(models.Table, { foreignKey: 'tableId', as: 'table' });
    Order.belongsToMany(models.Product, {
      through: 'OrderItems',
      foreignKey: 'orderId',
      otherKey: 'productId',
      as: 'products',
    });
  };

  return Order;
};
