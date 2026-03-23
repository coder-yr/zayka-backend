const express = require('express');
const router = express.Router();
const featureController = require('./controller');

// @route   GET /api/features
// @desc    Get all features
// @access  Public
router.get('/', featureController.getFeatures);

// @route   GET /api/features/:slug
// @desc    Get feature by slug
// @access  Public
router.get('/:slug', featureController.getFeatureBySlug);

module.exports = router;
