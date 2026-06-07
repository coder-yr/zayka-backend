const router = require('express').Router();
const { guards, outletScope, permit } = require('../../middleware/guards');

// Example: admin-only API management route
router.delete('/admin/users/:id', ...guards.adminApis, (req, res) => {
  res.json({ success: true, example: 'admin user delete guard passed' });
});

// Example: analytics route
router.get('/analytics/snapshot', ...guards.analytics, (req, res) => {
  res.json({ success: true, example: 'analytics read guard passed' });
});

// Example: kitchen queue route (outlet-scoped)
router.patch('/kitchen/orders/:orderId/status', ...guards.kitchenManage, (req, res) => {
  res.json({ success: true, example: 'kitchen manage guard passed', outletId: req.outletId || null });
});

// Example: POS order create route (outlet-scoped)
router.post('/pos/orders', ...guards.posOperate, (req, res) => {
  res.json({ success: true, example: 'pos operate guard passed', outletId: req.outletId || null });
});

// Example: staff operation with explicit custom outlet guard + permission check
router.post(
  '/staff/operations',
  ...guards.authenticated,
  outletScope({ required: true, roles: ['manager', 'cashier', 'waiter', 'kitchen'], permissions: ['orders.manage'] }),
  permit('orders.manage'),
  (req, res) => {
    res.json({ success: true, example: 'staff operation guard passed', outletId: req.outletId || null });
  }
);

module.exports = router;