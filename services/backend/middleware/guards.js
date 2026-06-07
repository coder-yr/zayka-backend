const authenticate = require('./auth');
const authorize = require('./authorize');
const permit = require('./permission');
const outletScope = require('./outletScope');
const { permissionGroups } = require('../utils/permissionHelpers');

const guards = {
  authenticated: [authenticate],

  adminApis: [authenticate, authorize('admin'), permit(...permissionGroups.adminApis)],

  analytics: [authenticate, authorize('admin', 'manager'), permit(...permissionGroups.analytics)],

  kitchenRead: [
    authenticate,
    outletScope({ required: true, roles: ['admin', 'manager', 'kitchen'], permissions: permissionGroups.kitchenQueueRead }),
  ],

  kitchenManage: [
    authenticate,
    outletScope({ required: true, roles: ['admin', 'manager', 'kitchen'], permissions: permissionGroups.kitchenQueueManage }),
  ],

  posRead: [
    authenticate,
    outletScope({ required: true, roles: ['admin', 'manager', 'cashier', 'waiter', 'kitchen'], permissions: permissionGroups.posRead }),
  ],

  posOperate: [
    authenticate,
    outletScope({ required: true, roles: ['admin', 'manager', 'cashier', 'waiter'], permissions: permissionGroups.posOperate }),
  ],

  paymentsManage: [
    authenticate,
    outletScope({ required: true, roles: ['admin', 'manager', 'cashier'], permissions: permissionGroups.payments }),
  ],

  staffOperations: [
    authenticate,
    outletScope({ required: true, roles: ['admin', 'manager', 'cashier', 'waiter', 'kitchen'], permissions: permissionGroups.staffOperations }),
  ],

  managerOperations: [authenticate, authorize('admin', 'manager'), permit('orders.manage')],

  menuManage: [authenticate, authorize('admin', 'manager'), permit(...permissionGroups.menuManagement)],
  tableManage: [authenticate, authorize('admin', 'manager'), permit(...permissionGroups.tableManagement)],
};

module.exports = {
  authenticate,
  authorize,
  permit,
  outletScope,
  guards,
};