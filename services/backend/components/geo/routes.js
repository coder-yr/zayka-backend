const express = require('express');
const router = express.Router();
const geoController = require('./controller');

// @route   GET /api/geo
// @desc    Resolve request geo context for country/currency auto-selection
// @access  Public
router.get('/', geoController.getGeo);

module.exports = router;
