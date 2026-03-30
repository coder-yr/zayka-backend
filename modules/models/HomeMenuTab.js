const { DataTypes } = require('sequelize');
const { randomUUID } = require('crypto');

module.exports = (sequelize) => {
  const HomeMenuTab = sequelize.define(
    'HomeMenuTab',
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
      tableName: 'home_menu_tabs',
    }
  );

  return HomeMenuTab;
};
