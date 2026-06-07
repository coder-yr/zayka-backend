const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('./controller');
const { guards } = require('../../middleware/guards');

// GET /api/tables         — public
router.get('/', controller.getAll.bind(controller));

// GET /api/tables/:id     — public
router.get('/:id', controller.getById.bind(controller));

// POST /api/tables        — admin, manager
router.post(
  '/',
  ...guards.tableManage,
  [
    body('tableNumber').trim().notEmpty().withMessage('Table number is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  ],
  controller.create.bind(controller)
);

// PUT /api/tables/:id     — admin, manager
router.put('/:id', ...guards.tableManage, controller.update.bind(controller));

// DELETE /api/tables/:id  — admin only
router.delete('/:id', ...guards.adminApis, controller.delete.bind(controller));

module.exports = router;
