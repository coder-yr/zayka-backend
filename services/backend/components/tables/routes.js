const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');

// GET /api/tables         — public
router.get('/', controller.getAll.bind(controller));

// GET /api/tables/:id     — public
router.get('/:id', controller.getById.bind(controller));

// POST /api/tables        — admin, manager
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('tableNumber').trim().notEmpty().withMessage('Table number is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  ],
  controller.create.bind(controller)
);

// PUT /api/tables/:id     — admin, manager
router.put('/:id', authenticate, authorize('admin', 'manager'), controller.update.bind(controller));

// DELETE /api/tables/:id  — admin only
router.delete('/:id', authenticate, authorize('admin'), controller.delete.bind(controller));

module.exports = router;
