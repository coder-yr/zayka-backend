const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  controller.login.bind(controller)
);

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'manager', 'staff']).withMessage('Invalid role'),
  ],
  controller.register.bind(controller)
);

// GET /api/auth/profile  (protected)
router.get('/profile', authenticate, controller.getProfile.bind(controller));

// POST /api/auth/logout  (protected)
router.post('/logout', authenticate, controller.logout.bind(controller));

module.exports = router;
