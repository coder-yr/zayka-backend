const router = require('express').Router();
const controller = require('./controller');
const authenticate = require('../../middleware/auth');
const refreshSession = require('../../middleware/refreshSession');
const { loginValidation, registerValidation, refreshValidation } = require('./validation');

// POST /api/auth/login
router.post('/login', loginValidation, controller.login.bind(controller));

// POST /api/auth/register
router.post('/register', registerValidation, controller.register.bind(controller));

// GET /api/auth/profile  (protected)
router.get('/profile', authenticate, controller.getProfile.bind(controller));

// GET /api/auth/session  (protected)
router.get('/session', authenticate, controller.session.bind(controller));

// POST /api/auth/refresh  (rotating refresh token)
router.post('/refresh', refreshValidation, refreshSession({ required: true }), controller.refresh.bind(controller));

// POST /api/auth/logout  (protected)
router.post('/logout', refreshSession({ required: false }), controller.logout.bind(controller));

// POST /api/auth/logout-all  (protected)
router.post('/logout-all', authenticate, controller.logoutAll.bind(controller));

module.exports = router;
