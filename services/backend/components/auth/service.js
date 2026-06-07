const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const appConfig = require('../../../../config/appConfig');
const db = require('../../db');
const { buildRbacContext, normalizeRoleCode } = require('../../utils/rbac');
const ApiError = require('../../../../src/utils/ApiError');
const {
	issueRefreshSession,
	rotateRefreshToken,
	revokeByRefreshToken,
	invalidateAllUserSessions,
} = require('./refreshTokenStore');

class AuthService {
	generateAccessToken(user, access, sessionId) {
		return jwt.sign(
			{
				id: user.id,
				email: user.email,
				role: access.primaryRole,
				roles: access.roles,
				permissions: access.permissions,
				outletRoles: access.outletRoles,
				sid: sessionId,
				jti: randomUUID(),
			},
			appConfig.jwt.secret,
			{
				expiresIn: appConfig.jwt.expiresIn,
			}
		);
	}

	async loadActiveUserWithRbac(userIdOrEmail, by = 'email') {
		const where = by === 'email' ? { email: userIdOrEmail, isActive: true } : { id: userIdOrEmail, isActive: true };

		const user = await db.User.findOne({
			where,
			include: [
				{
					model: db.UserRole,
					as: 'roleAssignments',
					required: false,
					where: { isActive: true },
					include: [
						{ model: db.Role, as: 'role', include: [{ model: db.Permission, as: 'permissions' }] },
						{ model: db.Outlet, as: 'outlet' },
					],
				},
			],
		});

		if (!user) {
			throw new ApiError(401, 'Invalid email or password', 'AUTH_INVALID_CREDENTIALS');
		}

		const access = buildRbacContext(user);
		access.primaryRole = access.primaryRole || normalizeRoleCode(user.role);

		if (!access.primaryRole) {
			throw new ApiError(403, 'No active role assigned to this account', 'AUTH_ROLE_MISSING');
		}

		return { user, access };
	}

	async login(email, password, sessionMeta = {}) {
		const { user, access } = await this.loadActiveUserWithRbac(email, 'email');

		const isValid = await user.validatePassword(password);
		if (!isValid) {
			throw new ApiError(401, 'Invalid email or password', 'AUTH_INVALID_CREDENTIALS');
		}

		await user.update({ lastLogin: new Date() });
		const session = await issueRefreshSession(user.id, sessionMeta);
		const token = this.generateAccessToken(user, access, session.session.id);

		return {
			token,
			refreshToken: session.refreshToken,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: access.primaryRole,
				permissions: access.permissions,
				roles: access.roles,
				outletRoles: access.outletRoles,
				sessionId: session.session.id,
			},
		};
	}

	async refresh(oldRefreshToken, sessionMeta = {}, refreshContext = null) {
		const rotation = await rotateRefreshToken(oldRefreshToken, sessionMeta, refreshContext);
		const { user, access } = await this.loadActiveUserWithRbac(rotation.session.userId, 'id');
		const token = this.generateAccessToken(user, access, rotation.session.id);

		return {
			token,
			refreshToken: rotation.refreshToken,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: access.primaryRole,
				permissions: access.permissions,
				roles: access.roles,
				outletRoles: access.outletRoles,
				sessionId: rotation.session.id,
			},
		};
	}

	async revokeRefresh(refreshToken) {
		if (!refreshToken) return false;
		return revokeByRefreshToken(refreshToken, 'logout');
	}

	async invalidateAllSessions(userId) {
		return invalidateAllUserSessions(userId, 'global_logout');
	}

	async register(data) {
		const existing = await db.User.findOne({ where: { email: data.email } });
		if (existing) {
			throw new ApiError(409, 'A user with this email already exists', 'AUTH_EMAIL_EXISTS');
		}

		const user = await db.User.create({
			name: data.name,
			email: data.email,
			password: data.password,
			role: null,
			isActive: false,
		});
		return { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
	}

	async validateSession(userId, sessionId) {
		if (!sessionId) {
			throw new ApiError(401, 'Session is invalid or expired', 'AUTH_SESSION_INVALID');
		}

		const { user, access } = await this.loadActiveUserWithRbac(userId, 'id');

		return {
			authenticated: true,
			sessionId,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: access.primaryRole,
				permissions: access.permissions,
				roles: access.roles,
				outletRoles: access.outletRoles,
			},
		};
	}

	async getProfile(userId) {
		const user = await db.User.findByPk(userId, {
			attributes: { exclude: ['password'] },
		});

		if (!user) {
			throw new ApiError(404, 'User not found', 'AUTH_USER_NOT_FOUND');
		}

		return user;
	}
}

module.exports = new AuthService();
