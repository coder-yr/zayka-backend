const db = require('../../db');

/**
 * Get all features with optional filtering
 */
exports.getFeatures = async (req, res) => {
  try {
    const { showInMenu, showOnHome, isActive, sort, limit } = req.query;
    
    const whereClause = {};
    if (showInMenu === 'true') whereClause.showInMenu = true;
    if (showOnHome === 'true') whereClause.showOnHome = true;
    if (isActive === 'true') whereClause.isActive = true;

    // Default sorting
    let orderClause = [['order', 'ASC']];
    if (sort === 'menuOrder') orderClause = [['menuOrder', 'ASC']];
    else if (sort === 'homeOrder') orderClause = [['homeOrder', 'ASC']];

    const queryOptions = {
      where: whereClause,
      order: orderClause,
    };

    if (limit) {
      queryOptions.limit = parseInt(limit, 10);
    }

    const features = await db.Feature.findAll(queryOptions);

    res.status(200).json({
      success: true,
      count: features.length,
      data: features,
    });
  } catch (error) {
    console.error('[FeatureController] getFeatures error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch features',
      error: error.message,
    });
  }
};

/**
 * Get single feature by slug
 */
exports.getFeatureBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const feature = await db.Feature.findOne({
      where: { slug }
    });

    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found',
      });
    }

    res.status(200).json({
      success: true,
      data: feature,
    });
  } catch (error) {
    console.error('[FeatureController] getFeatureBySlug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feature',
      error: error.message,
    });
  }
};
