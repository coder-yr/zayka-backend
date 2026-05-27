const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');

// GET /api/orders
router.get('/', authenticate, controller.getAll.bind(controller));

// GET /api/orders/:id
router.get('/:id', authenticate, controller.getById.bind(controller));

// POST /api/orders
router.post(
  '/',
  authenticate,
  [
    body('totalAmount').optional().isFloat({ min: 0 }).withMessage('totalAmount must be a positive number'),
    body('tableId').optional().isUUID().withMessage('tableId must be a valid UUID'),
    body('productIds').optional().isArray().withMessage('productIds must be an array'),
    body('items').optional().isArray().withMessage('items must be an array'),
  ],
  controller.create.bind(controller)
);

// PATCH /api/orders/:id/status
router.patch(
  '/:id/status',
  authenticate,
  [
    body('status')
      .isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
      .withMessage('Invalid status value'),
  ],
  controller.updateStatus.bind(controller)
);

// PATCH /api/orders/:id/payment
router.patch(
  '/:id/payment',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('paymentStatus').isIn(['pending', 'paid', 'failed', 'refunded']).withMessage('Invalid payment status'),
    body('paymentMethod').optional().isIn(['cash', 'card', 'upi', 'online']),
  ],
  controller.updatePayment.bind(controller)
);

// DELETE /api/orders/:id
router.delete('/:id', authenticate, authorize('admin', 'manager'), controller.delete.bind(controller));

module.exports = router;
