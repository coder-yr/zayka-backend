const express = require('express');
const router = express.Router();
const controller = require('./controller');

// @route   GET /api/home-content
// @desc    Get dynamic content for home page
// @access  Public
router.get('/', controller.getHomeContent);

module.exports = router;
