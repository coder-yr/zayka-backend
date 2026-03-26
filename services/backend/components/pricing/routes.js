const express = require('express');
const router = express.Router();
const pricingController = require('./controller');

// @route   GET /api/pricing
// @desc    Get pricing page content
// @access  Public
router.get('/', pricingController.getPricingContent);

module.exports = router;