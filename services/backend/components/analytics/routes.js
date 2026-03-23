const router = require('express').Router();
const controller = require('./controller');
const authenticate = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');

// All analytics routes require authentication and manager/admin role
router.use(authenticate, authorize('admin', 'manager'));

// GET /api/analytics/dashboard
router.get('/dashboard', controller.getDashboard.bind(controller));

// GET /api/analytics/revenue?days=7
router.get('/revenue', controller.getRevenue.bind(controller));

// GET /api/analytics/top-products?limit=5
router.get('/top-products', controller.getTopProducts.bind(controller));

module.exports = router;
