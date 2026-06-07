const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('./controller');
const { guards } = require('../../middleware/guards');

// GET /api/orders                  — POS read
router.get('/', ...guards.posRead, controller.getAll.bind(controller));

// GET /api/orders/:id              — POS read
router.get('/:id', ...guards.posRead, controller.getById.bind(controller));

// POST /api/orders                 — POS operate
router.post(
  '/',
  ...guards.posOperate,
  [
    body('totalAmount').optional().isFloat({ min: 0 }).withMessage('totalAmount must be a positive number'),
    body('tableId').optional().isUUID().withMessage('tableId must be a valid UUID'),
    body('outletId').optional().isUUID().withMessage('outletId must be a valid UUID'),
    body('productIds').optional().isArray().withMessage('productIds must be an array'),
    body('items').optional().isArray().withMessage('items must be an array'),
  ],
  controller.create.bind(controller)
);

// PATCH /api/orders/:id/status     — Kitchen + staff operations
router.patch(
  '/:id/status',
  ...guards.kitchenManage,
  [
    body('status')
      .isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
      .withMessage('Invalid status value'),
  ],
  controller.updateStatus.bind(controller)
);

// PATCH /api/orders/:id/payment    — Payments management
router.patch(
  '/:id/payment',
  ...guards.paymentsManage,
  [
    body('paymentStatus').isIn(['pending', 'paid', 'failed', 'refunded']).withMessage('Invalid payment status'),
    body('paymentMethod').optional().isIn(['cash', 'card', 'upi', 'online']),
  ],
  controller.updatePayment.bind(controller)
);

// DELETE /api/orders/:id           — Manager/Admin operations
router.delete('/:id', ...guards.managerOperations, controller.delete.bind(controller));

module.exports = router;
