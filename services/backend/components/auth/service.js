const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const appConfig = require('../../../../config/appConfig');
const db = require('../../db');
const redis = require('../../lib/redisClient');

const REFRESH_TTL = parseInt(process.env.REFRESH_TOKEN_TTL_SECONDS || String(60 * 60 * 24 * 30), 10);

class AuthService {
	async login(email, password) {
		const user = await db.User.findOne({ where: { email, isActive: true } });

		if (!user) {
			const error = new Error('Invalid email or password');
			error.statusCode = 401;
			throw error;
		}

		const isValid = await user.validatePassword(password);
		if (!isValid) {
			const error = new Error('Invalid email or password');
			error.statusCode = 401;
			throw error;
		}

		await user.update({ lastLogin: new Date() });

		const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, appConfig.jwt.secret, {
			expiresIn: appConfig.jwt.expiresIn,
		});

		const refreshToken = randomBytes(64).toString('hex');
		await redis.set(`refresh:${refreshToken}`, { userId: user.id }, REFRESH_TTL);

		return {
			token,
			refreshToken,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		};
	}

	async refresh(oldRefreshToken) {
		if (!oldRefreshToken) {
			const err = new Error('Refresh token missing');
			err.statusCode = 401;
			throw err;
		}

		const key = `refresh:${oldRefreshToken}`;
		const data = await redis.get(key);
		if (!data || !data.userId) {
			const err = new Error('Invalid or expired refresh token');
			err.statusCode = 401;
			throw err;
		}

		await redis.del(key);
		const refreshToken = randomBytes(64).toString('hex');
		await redis.set(`refresh:${refreshToken}`, { userId: data.userId }, REFRESH_TTL);

		const user = await db.User.findByPk(data.userId);
		if (!user) {
			const err = new Error('User not found');
			err.statusCode = 404;
			throw err;
		}

		const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, appConfig.jwt.secret, {
			expiresIn: appConfig.jwt.expiresIn,
		});

		return {
			token,
			refreshToken,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		};
	}

	async revokeRefresh(refreshToken) {
		if (!refreshToken) return false;
		await redis.del(`refresh:${refreshToken}`);
		return true;
	}

	async register(data) {
		const existing = await db.User.findOne({ where: { email: data.email } });
		if (existing) {
			const error = new Error('A user with this email already exists');
			error.statusCode = 409;
			throw error;
		}

		const user = await db.User.create(data);
		return { id: user.id, name: user.name, email: user.email, role: user.role };
	}

	async getProfile(userId) {
		const user = await db.User.findByPk(userId, {
			attributes: { exclude: ['password'] },
		});

		if (!user) {
			const error = new Error('User not found');
			error.statusCode = 404;
			throw error;
		}

		return user;
	}
}

module.exports = new AuthService();
