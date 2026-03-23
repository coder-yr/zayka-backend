const { DataTypes } = require('sequelize');
const { randomUUID } = require('crypto');

module.exports = (sequelize) => {
  const Table = sequelize.define(
    'Table',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => randomUUID(),
        primaryKey: true,
      },
      tableNumber: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4,
        validate: { min: 1 },
      },
      status: {
        type: DataTypes.ENUM('available', 'occupied', 'reserved', 'maintenance'),
        defaultValue: 'available',
      },
      floor: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      section: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'tables',
    }
  );

  Table.associate = (models) => {
    Table.hasMany(models.Order, { foreignKey: 'tableId', as: 'orders' });
  };

  return Table;
};
