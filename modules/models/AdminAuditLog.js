const { DataTypes } = require('sequelize');
const { randomUUID } = require('crypto');

module.exports = (sequelize) => {
  const AdminAuditLog = sequelize.define(
    'AdminAuditLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => randomUUID(),
        primaryKey: true,
      },
      actorId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      actorEmail: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      actorRole: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      resource: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      resourceId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      route: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      method: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      statusCode: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      outcome: {
        type: DataTypes.ENUM('success', 'failure', 'denied'),
        allowNull: false,
        defaultValue: 'success',
      },
      ipAddress: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      outletId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'admin_audit_logs',
      updatedAt: false,
    }
  );

  AdminAuditLog.associate = (models) => {
    AdminAuditLog.belongsTo(models.User, { foreignKey: 'actorId', as: 'actor' });
    AdminAuditLog.belongsTo(models.Outlet, { foreignKey: 'outletId', as: 'outlet' });
  };

  return AdminAuditLog;
};