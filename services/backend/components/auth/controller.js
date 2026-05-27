const { validationResult } = require('express-validator');
const authService = require('./service');
const env = require('../../../../config/env');

const REFRESH_TTL_MS = parseInt(process.env.REFRESH_TOKEN_TTL_SECONDS || String(60 * 60 * 24 * 30), 10) * 1000;

class AuthController {
	async login(req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ success: false, errors: errors.array() });
		}

		const { email, password } = req.body;
		const result = await authService.login(email, password);

		res.cookie('refreshToken', result.refreshToken, {
			httpOnly: true,
			secure: env.NODE_ENV === 'production',
			sameSite: 'strict',
			path: '/',
			maxAge: REFRESH_TTL_MS,
		});

		res.json({ success: true, message: 'Login successful', data: { token: result.token, user: result.user } });
	}

	async refresh(req, res) {
		const refreshToken = req.cookies && req.cookies.refreshToken;
		try {
			const result = await authService.refresh(refreshToken);

			res.cookie('refreshToken', result.refreshToken, {
				httpOnly: true,
				secure: env.NODE_ENV === 'production',
				sameSite: 'strict',
				path: '/',
				maxAge: REFRESH_TTL_MS,
			});

			return res.json({ success: true, data: { token: result.token, user: result.user } });
		} catch (err) {
			res.clearCookie('refreshToken', { path: '/' });
			throw err;
		}
	}

	async register(req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ success: false, errors: errors.array() });
		}

		const user = await authService.register(req.body);
		res.status(201).json({ success: true, message: 'User registered successfully', data: user });
	}

	async getProfile(req, res) {
		const user = await authService.getProfile(req.user.id);
		res.json({ success: true, data: user });
	}

	async logout(req, res) {
		const refreshToken = req.cookies && req.cookies.refreshToken;
		if (refreshToken) {
			await authService.revokeRefresh(refreshToken);
			res.clearCookie('refreshToken', { path: '/' });
		}
		res.json({ success: true, message: 'Logged out successfully' });
	}
}

module.exports = new AuthController();
