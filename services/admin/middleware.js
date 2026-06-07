const { hasPermission, hasRole, normalizeRoleCode, buildRbacContext } = require('../backend/utils/rbac');

const ADMIN_ALLOWED_ROLES = ['admin', 'manager'];

const PUBLIC_ADMIN_PATHS = ['/','/login','/logout','/assets','/bundle','/favicon.ico','/frontend'];

function isPublicAdminRoute(pathname = '') {
  return PUBLIC_ADMIN_PATHS.some((publicPath) => pathname === publicPath || pathname.startsWith(`${publicPath}/`));
}

function wantsJson(req) {
  return Boolean(req.xhr || (typeof req.accepts === 'function' && req.accepts(['json']) === 'json'));
}

function getSessionAdmin(req) {
  return (
    req.session?.adminUser ||
    req.session?.currentAdmin ||
    req.session?.admin ||
    req.currentAdmin ||
    null
  );
}

async function loadAdminUser(db, sessionAdmin) {
  const adminId = sessionAdmin?.id || sessionAdmin?.userId || sessionAdmin?.email || null;
  const where = adminId && String(adminId).includes('@') ? { email: adminId } : adminId ? { id: adminId } : null;

  if (!where) {
    return null;
  }

  return db.User.findOne({
    where,
    include: [
      {
        model: db.UserRole,
        as: 'roleAssignments',
        required: false,
        where: { isActive: true },
        include: [
          {
            model: db.Role,
            as: 'role',
            required: false,
            include: [
              {
                model: db.Permission,
                as: 'permissions',
                required: false,
                through: { attributes: [] },
              },
            ],
          },
          {
            model: db.Outlet,
            as: 'outlet',
            required: false,
          },
        ],
      },
    ],
  });
}

function buildAdminContext(user) {
  if (!user) {
    return null;
  }

  const rbacContext = buildRbacContext(user);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: normalizeRoleCode(user.role),
    isActive: user.isActive,
    roleAssignments: user.roleAssignments || [],
    permissions: rbacContext.permissions,
    roles: rbacContext.roles,
    outletRoles: rbacContext.outletRoles,
    primaryRole: rbacContext.primaryRole,
  };
}

function isAdminAllowed(currentAdmin) {
  if (!currentAdmin) {
    return false;
  }

  const role = normalizeRoleCode(currentAdmin.role);
  return ADMIN_ALLOWED_ROLES.includes(role);
}

function canAccessAdmin(currentAdmin, permissions = [], roles = ADMIN_ALLOWED_ROLES) {
  if (!currentAdmin) {
    return false;
  }

  if (normalizeRoleCode(currentAdmin.role) === 'admin') {
    return true;
  }

  if (roles.length > 0 && !hasRole(currentAdmin, roles)) {
    return false;
  }

  if (!permissions || permissions.length === 0) {
    return true;
  }

  return hasPermission(currentAdmin, permissions);
}

function mergeHooks(existingHooks, nextHook) {
  if (!nextHook) {
    return existingHooks;
  }

  if (!existingHooks) {
    return nextHook;
  }

  if (Array.isArray(existingHooks)) {
    return [...existingHooks, nextHook];
  }

  return [existingHooks, nextHook];
}

function createAdminActionAuditHook({ db, resource, action }) {
  return async (response, request, context) => {
    try {
      const currentAdmin = context?.currentAdmin || context?.adminUser || null;
      const recordId =
        response?.record?.params?.id ||
        response?.record?.params?.recordId ||
        response?.record?.id ||
        context?.record?.params?.id ||
        null;

      await recordAdminAudit(db, {
        actor: currentAdmin,
        action: `adminjs.${resource}.${action}`,
        resource,
        resourceId: recordId,
        route: request?.url || request?.path || null,
        method: request?.method || null,
        statusCode: response?.notice ? 200 : 200,
        outcome: 'success',
        metadata: {
          notice: response?.notice || null,
          params: request?.payload ? Object.keys(request.payload) : [],
        },
      });
    } catch (error) {
      console.error('[AdminAudit] Failed to record admin action', error);
    }

    return response;
  };
}

function createAdminAuditMiddleware({ db, rootPath }) {
  return (req, res, next) => {
    if (!req.path || isPublicAdminRoute(req.path)) {
      return next();
    }

    const startedAt = Date.now();

    res.on('finish', async () => {
      if (!req.originalUrl || !req.originalUrl.startsWith(rootPath)) {
        return;
      }

      if (req.path.startsWith('/assets') || req.path.startsWith('/bundle') || req.path.startsWith('/favicon.ico')) {
        return;
      }

      try {
        await recordAdminAudit(db, {
          actor: req.adminUser || getSessionAdmin(req),
          action: `adminjs.route.${String(req.method || 'GET').toLowerCase()}`,
          resource: 'adminjs',
          route: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          outcome: res.statusCode >= 400 ? 'failure' : 'success',
          metadata: {
            durationMs: Date.now() - startedAt,
          },
        });
      } catch (error) {
        console.error('[AdminAudit] Failed to log admin route', error);
      }
    });

    next();
  };
}

function createAdminSessionMiddleware({ db, rootPath }) {
  return async (req, res, next) => {
    if (isPublicAdminRoute(req.path)) {
      return next();
    }

    const sessionAdmin = getSessionAdmin(req);
    if (!sessionAdmin) {
      return wantsJson(req)
        ? res.status(401).json({ success: false, message: 'Admin session is required' })
        : res.redirect(`${rootPath}/login`);
    }

    const user = await loadAdminUser(db, sessionAdmin);
    if (!user || !user.isActive || !isAdminAllowed(user)) {
      try {
        await recordAdminAudit(db, {
          actor: user || sessionAdmin,
          action: 'adminjs.session.invalid',
          resource: 'adminjs',
          route: req.originalUrl || req.path,
          method: req.method,
          statusCode: 401,
          outcome: 'failure',
          metadata: {
            reason: !user ? 'missing-user' : !user.isActive ? 'inactive-user' : 'role-not-allowed',
          },
        });
      } catch (error) {
        console.error('[AdminAudit] Failed to log invalid admin session', error);
      }

      if (req.session) {
        req.session.destroy(() => {});
      }

      return wantsJson(req)
        ? res.status(401).json({ success: false, message: 'Admin session is no longer valid' })
        : res.redirect(`${rootPath}/login`);
    }

    const context = buildAdminContext(user);
    req.adminUser = context;
    req.currentAdmin = context;
    if (req.session) {
      req.session.adminUser = context;
    }

    return next();
  };
}

async function recordAdminAudit(db, entry = {}) {
  const actor = entry.actor || null;
  const metadataValue = entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : null;

  return db.AdminAuditLog.create({
    actorId: actor?.id || null,
    actorEmail: actor?.email || null,
    actorRole: normalizeRoleCode(actor?.role || null) || null,
    action: entry.action || 'adminjs.event',
    resource: entry.resource || 'adminjs',
    resourceId: entry.resourceId || null,
    route: entry.route || null,
    method: entry.method || null,
    statusCode: entry.statusCode ?? null,
    outcome: entry.outcome || 'success',
    ipAddress: actor?.ipAddress || null,
    userAgent: actor?.userAgent || null,
    outletId: entry.outletId || null,
    metadata: metadataValue,
  });
}

function decorateAdminResource(resource, config = {}) {
  const options = resource.options || {};
  const actions = options.actions || {};
  const readPermissions = config.readPermissions || [];
  const writePermissions = config.writePermissions || readPermissions;
  const deletePermissions = config.deletePermissions || writePermissions;
  const allowedRoles = config.allowedRoles || ADMIN_ALLOWED_ROLES;

  const decorateAction = (action, permissions, auditAction) => {
    if (action === false) {
      return false;
    }

    const nextAction = { ...(action || {}) };
    const existingAccessible = nextAction.isAccessible;
    nextAction.isAccessible = (context = {}) => {
      const currentAdmin = context.currentAdmin || context.adminUser || null;
      const currentAllowed = typeof existingAccessible === 'function'
        ? existingAccessible(context)
        : existingAccessible === undefined || Boolean(existingAccessible);

      return currentAllowed && canAccessAdmin(currentAdmin, permissions, allowedRoles);
    };

    if (auditAction) {
      nextAction.after = mergeHooks(nextAction.after, createAdminActionAuditHook({ db: config.db, resource: config.resourceName, action: auditAction }));
    }

    return nextAction;
  };

  return {
    ...resource,
    options: {
      ...options,
      actions: {
        ...actions,
        list: decorateAction(actions.list, readPermissions, 'list'),
        show: decorateAction(actions.show, readPermissions, 'show'),
        new: decorateAction(actions.new, writePermissions, 'create'),
        edit: decorateAction(actions.edit, writePermissions, 'update'),
        delete: decorateAction(actions.delete, deletePermissions, 'delete'),
      },
    },
  };
}

module.exports = {
  ADMIN_ALLOWED_ROLES,
  buildAdminContext,
  canAccessAdmin,
  createAdminActionAuditHook,
  createAdminAuditMiddleware,
  createAdminSessionMiddleware,
  decorateAdminResource,
  isAdminAllowed,
  isPublicAdminRoute,
  mergeHooks,
  recordAdminAudit,
};