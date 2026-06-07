const { hasRole, resolveRequestOutletId, normalizeRoleCode } = require('../utils/rbac');

/**
 * Role-based authorization middleware factory.
 * Usage: authorize('admin', 'manager')
 */
module.exports =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const requiredRoles = roles.map(normalizeRoleCode).filter(Boolean);
    const outletId = resolveRequestOutletId(req);

    if (!hasRole(req.user, requiredRoles, outletId)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${requiredRoles.join(' or ')}`,
      });
    }

    next();
  };
