const { DataTypes } = require('sequelize');
const { randomUUID } = require('crypto');

module.exports = (sequelize) => {
  const HomeCategory = sequelize.define(
    'HomeCategory',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => randomUUID(),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
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
      tableName: 'home_categories',
    }
  );

  return HomeCategory;
};
