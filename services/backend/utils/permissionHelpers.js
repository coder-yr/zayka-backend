const permissionGroups = {
  adminApis: ['users.manage', 'rbac.manage_roles'],
  analytics: ['reports.read'],
  kitchenQueueRead: ['kitchen.read', 'orders.read'],
  kitchenQueueManage: ['kitchen.manage', 'orders.update_status'],
  posRead: ['orders.read', 'tables.read'],
  posOperate: ['orders.manage', 'orders.update_status'],
  payments: ['payments.manage'],
  staffOperations: ['orders.manage', 'orders.update_status', 'tables.read'],
  menuManagement: ['menu.manage'],
  tableManagement: ['tables.manage'],
};

function getPermissionGroup(name) {
  return permissionGroups[name] || [];
}

module.exports = {
  permissionGroups,
  getPermissionGroup,
};