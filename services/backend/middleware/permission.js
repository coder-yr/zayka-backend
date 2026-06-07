const { hasPermission, resolveRequestOutletId, normalizePermissionCode } = require('../utils/rbac');

module.exports =
  (...permissions) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const requiredPermissions = permissions.map(normalizePermissionCode).filter(Boolean);
    if (requiredPermissions.length === 0) {
      return next();
    }

    const outletId = resolveRequestOutletId(req);
    if (!hasPermission(req.user, requiredPermissions, outletId)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${requiredPermissions.join(' and ')}`,
      });
    }

    next();
  };