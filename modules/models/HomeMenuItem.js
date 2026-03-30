const { DataTypes } = require('sequelize');
const { randomUUID } = require('crypto');

module.exports = (sequelize) => {
  const HomeMenuItem = sequelize.define(
    'HomeMenuItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => randomUUID(),
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(180),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'home_menu_items',
    }
  );

  return HomeMenuItem;
};
