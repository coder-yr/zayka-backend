const { body } = require('express-validator');

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const registerValidation = [
  body('name').trim().notEmpty().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').not().exists().withMessage('Role cannot be set during registration'),
  body('isActive').not().exists().withMessage('Account activation is controlled by the system'),
];

const refreshValidation = [
  body('refreshToken').optional({ nullable: true }).isString().withMessage('refreshToken must be a string'),
];

module.exports = {
  loginValidation,
  registerValidation,
  refreshValidation,
};