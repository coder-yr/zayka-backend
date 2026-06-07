const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('./controller');
const { guards } = require('../../middleware/guards');

// GET /api/products          — public
router.get('/', controller.getAll.bind(controller));

// GET /api/products/:id      — public
router.get('/:id', controller.getById.bind(controller));

// POST /api/products         — admin, manager
router.post(
  '/',
  ...guards.menuManage,
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').trim().notEmpty().withMessage('Category is required'),
  ],
  controller.create.bind(controller)
);

// PUT /api/products/:id      — admin, manager
router.put('/:id', ...guards.menuManage, controller.update.bind(controller));

// DELETE /api/products/:id   — admin only
router.delete('/:id', ...guards.adminApis, controller.delete.bind(controller));

module.exports = router;
