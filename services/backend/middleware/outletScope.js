const {
  resolveRequestOutletId,
  hasRole,
  hasPermission,
  normalizeRoleCode,
  normalizePermissionCode,
} = require('../utils/rbac');

function hasOutletAssignment(user, outletId) {
  if (!outletId) return false;

  const assignmentFromToken = Array.isArray(user?.outletRoles)
    ? user.outletRoles.some(
        (assignment) =>
          assignment && assignment.outletId && String(assignment.outletId) === String(outletId)
      )
    : false;

  const assignmentFromModel = Array.isArray(user?.roleAssignments)
    ? user.roleAssignments.some(
        (assignment) =>
          assignment && assignment.outletId && String(assignment.outletId) === String(outletId)
      )
    : false;

  return assignmentFromToken || assignmentFromModel;
}

module.exports =
  ({ required = true, allowGlobal = true, roles = [], permissions = [] } = {}) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const outletId = resolveRequestOutletId(req);
    req.outletId = outletId;

    if (!outletId) {
      if (!required) return next();
      return res.status(400).json({
        success: false,
        message: 'Outlet scope is required. Provide outletId in params/body/query or x-outlet-id header.',
      });
    }

    const isGlobalAdmin = normalizeRoleCode(req.user.role) === 'admin';
    if (allowGlobal && isGlobalAdmin) {
      return next();
    }

    if (!hasOutletAssignment(req.user, outletId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this outlet',
      });
    }

    const requiredRoles = roles.map(normalizeRoleCode).filter(Boolean);
    if (requiredRoles.length > 0 && !hasRole(req.user, requiredRoles, outletId)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required outlet role: ${requiredRoles.join(' or ')}`,
      });
    }

    const requiredPermissions = permissions.map(normalizePermissionCode).filter(Boolean);
    if (requiredPermissions.length > 0 && !hasPermission(req.user, requiredPermissions, outletId)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required outlet permission: ${requiredPermissions.join(' and ')}`,
      });
    }

    next();
  };