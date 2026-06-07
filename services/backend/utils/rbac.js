const ROLE_CODES = ['admin', 'manager', 'cashier', 'waiter', 'kitchen', 'delivery_rider'];

const PERMISSIONS = [
  { code: 'rbac.manage_roles', resource: 'rbac', action: 'manage_roles', description: 'Manage roles and assignments' },
  { code: 'rbac.manage_permissions', resource: 'rbac', action: 'manage_permissions', description: 'Manage permissions' },
  { code: 'outlets.manage', resource: 'outlets', action: 'manage', description: 'Manage outlets' },
  { code: 'users.manage', resource: 'users', action: 'manage', description: 'Manage users' },
  { code: 'menu.manage', resource: 'menu', action: 'manage', description: 'Manage menu content and products' },
  { code: 'orders.manage', resource: 'orders', action: 'manage', description: 'Create and manage orders' },
  { code: 'orders.read', resource: 'orders', action: 'read', description: 'Read order data' },
  { code: 'orders.update_status', resource: 'orders', action: 'update_status', description: 'Update order status' },
  { code: 'payments.manage', resource: 'payments', action: 'manage', description: 'Manage payments' },
  { code: 'tables.manage', resource: 'tables', action: 'manage', description: 'Manage tables' },
  { code: 'tables.read', resource: 'tables', action: 'read', description: 'Read tables' },
  { code: 'kitchen.read', resource: 'kitchen', action: 'read', description: 'View kitchen queue' },
  { code: 'kitchen.manage', resource: 'kitchen', action: 'manage', description: 'Manage kitchen queue' },
  { code: 'inventory.manage', resource: 'inventory', action: 'manage', description: 'Manage inventory and ingredients' },
  { code: 'reports.read', resource: 'reports', action: 'read', description: 'Read analytics and reports' },
  { code: 'content.manage', resource: 'content', action: 'manage', description: 'Manage website content' },
  { code: 'pricing.manage', resource: 'pricing', action: 'manage', description: 'Manage pricing content' },
  { code: 'delivery.manage', resource: 'delivery', action: 'manage', description: 'Manage delivery workflows' },
];

const ROLE_PERMISSIONS = {
  admin: PERMISSIONS.map((permission) => permission.code),
  manager: [
    'menu.manage',
    'orders.manage',
    'orders.read',
    'orders.update_status',
    'payments.manage',
    'tables.manage',
    'tables.read',
    'kitchen.read',
    'inventory.manage',
    'reports.read',
    'content.manage',
    'pricing.manage',
  ],
  cashier: ['orders.manage', 'orders.read', 'orders.update_status', 'payments.manage', 'tables.read'],
  waiter: ['orders.manage', 'orders.read', 'orders.update_status', 'tables.read', 'kitchen.read'],
  kitchen: ['kitchen.read', 'kitchen.manage', 'orders.read', 'orders.update_status'],
  delivery_rider: ['delivery.manage', 'orders.read', 'orders.update_status'],
};

const LEGACY_ROLE_ALIASES = {
  staff: 'waiter',
};

function normalizeRoleCode(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return LEGACY_ROLE_ALIASES[normalized] || normalized;
}

function isValidRoleCode(role) {
  return ROLE_CODES.includes(normalizeRoleCode(role));
}

function normalizePermissionCode(permission) {
  return String(permission || '').trim().toLowerCase();
}

function getDefaultPermissionsForRole(role) {
  const normalizedRole = normalizeRoleCode(role);
  return ROLE_PERMISSIONS[normalizedRole] || [];
}

function collectPermissionsFromRoleAssignments(roleAssignments = []) {
  const permissions = new Set();

  roleAssignments.forEach((assignment) => {
    const role = assignment?.role || assignment?.Role || {};
    const assignmentPermissions = role?.permissions || role?.Permissions || [];

    assignmentPermissions.forEach((permission) => {
      const code = normalizePermissionCode(permission?.code);
      if (code) permissions.add(code);
    });
  });

  return [...permissions];
}

function resolveRequestOutletId(req) {
  return (
    req?.params?.outletId ||
    req?.body?.outletId ||
    req?.query?.outletId ||
    req?.headers?.['x-outlet-id'] ||
    null
  );
}

function getEffectiveRoleCodes(user, outletId = null) {
  const assignments = Array.isArray(user?.roleAssignments) ? user.roleAssignments : [];
  const activeAssignments = assignments.filter((assignment) => {
    if (assignment?.isActive === false) return false;
    if (!outletId) return true;
    return !assignment?.outletId || String(assignment.outletId) === String(outletId);
  });

  const assignmentRoleCodes = activeAssignments
    .map((assignment) => normalizeRoleCode(assignment?.role?.code || assignment?.role?.name || assignment?.roleCode || assignment?.Role?.code || assignment?.role))
    .filter(isValidRoleCode);

  const tokenOutletRoles = Array.isArray(user?.outletRoles)
    ? user.outletRoles
        .filter((assignment) => {
          if (!outletId) return true;
          return !assignment?.outletId || String(assignment.outletId) === String(outletId);
        })
        .map((assignment) => normalizeRoleCode(assignment?.role || assignment?.code || assignment?.name))
        .filter(isValidRoleCode)
    : [];

  assignmentRoleCodes.push(...tokenOutletRoles);

  const legacyRole = normalizeRoleCode(user?.role);
  if (isValidRoleCode(legacyRole)) {
    assignmentRoleCodes.unshift(legacyRole);
  }

  return [...new Set(assignmentRoleCodes)];
}

function getEffectivePermissionCodes(user, outletId = null) {
  const assignmentPermissions = collectPermissionsFromRoleAssignments(Array.isArray(user?.roleAssignments) ? user.roleAssignments : []);
  const rolePermissions = getEffectiveRoleCodes(user, outletId).flatMap((roleCode) => getDefaultPermissionsForRole(roleCode));
  const allPermissions = new Set([...assignmentPermissions, ...rolePermissions]);
  return [...allPermissions];
}

function buildRbacContext(user, outletId = null) {
  const roleCodes = getEffectiveRoleCodes(user, outletId);
  const permissions = getEffectivePermissionCodes(user, outletId);
  const outletRoles = (Array.isArray(user?.roleAssignments) ? user.roleAssignments : [])
    .filter((assignment) => assignment?.isActive !== false)
    .map((assignment) => ({
      outletId: assignment?.outletId || null,
      isPrimary: Boolean(assignment?.isPrimary),
      role: normalizeRoleCode(assignment?.role?.code || assignment?.role?.name || assignment?.roleCode || assignment?.Role?.code),
    }));

  return {
    primaryRole: roleCodes[0] || normalizeRoleCode(user?.role) || null,
    roles: roleCodes,
    permissions,
    outletRoles,
  };
}

function hasRole(user, requiredRoles = [], outletId = null) {
  if (!user) return false;
  const requestedRoles = requiredRoles.map(normalizeRoleCode).filter(Boolean);
  if (requestedRoles.length === 0) return true;

  if (normalizeRoleCode(user?.role) === 'admin') return true;

  return getEffectiveRoleCodes(user, outletId).some((roleCode) => requestedRoles.includes(roleCode));
}

function hasPermission(user, requiredPermissions = [], outletId = null) {
  if (!user) return false;
  const requestedPermissions = requiredPermissions.map(normalizePermissionCode).filter(Boolean);
  if (requestedPermissions.length === 0) return true;

  if (normalizeRoleCode(user?.role) === 'admin') return true;

  const effectivePermissions = getEffectivePermissionCodes(user, outletId);
  return requestedPermissions.every((permission) => effectivePermissions.includes(permission));
}

async function ensureDefaultRbac(db) {
  const roleRows = await Promise.all(
    ROLE_CODES.map((code, index) =>
      db.Role.findOrCreate({
        where: { code },
        defaults: {
          code,
          name: code
            .split('_')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' '),
          description: `System role: ${code}`,
          scope: code === 'admin' || code === 'manager' ? 'global' : 'outlet',
          priority: index + 1,
          isSystem: true,
          isActive: true,
        },
      })
    )
  );

  const permissionRows = await Promise.all(
    PERMISSIONS.map((permission) =>
      db.Permission.findOrCreate({
        where: { code: permission.code },
        defaults: permission,
      })
    )
  );

  const roleByCode = new Map(roleRows.map(([role]) => [role.code, role]));
  const permissionByCode = new Map(permissionRows.map(([permission]) => [permission.code, permission]));

  for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = roleByCode.get(roleCode);
    if (!role) continue;

    for (const permissionCode of permissionCodes) {
      const permission = permissionByCode.get(permissionCode);
      if (!permission) continue;

      await db.RolePermission.findOrCreate({
        where: { roleId: role.id, permissionId: permission.id },
        defaults: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  return {
    roles: [...roleByCode.values()],
    permissions: [...permissionByCode.values()],
  };
}

module.exports = {
  ROLE_CODES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  normalizeRoleCode,
  isValidRoleCode,
  normalizePermissionCode,
  getDefaultPermissionsForRole,
  resolveRequestOutletId,
  getEffectiveRoleCodes,
  getEffectivePermissionCodes,
  buildRbacContext,
  hasRole,
  hasPermission,
  ensureDefaultRbac,
};