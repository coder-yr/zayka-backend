const { validationResult } = require('express-validator');
const authService = require('./service');
const { getAccessCookieOptions, getRefreshCookieOptions } = require('./cookies');

function getClientMeta(req) {
	const forwardedFor = req.headers['x-forwarded-for'];
	const ipAddress = Array.isArray(forwardedFor)
		? forwardedFor[0]
		: typeof forwardedFor === 'string' && forwardedFor.length > 0
			? forwardedFor.split(',')[0].trim()
			: req.ip;

	return {
		ipAddress,
		userAgent: req.get('user-agent') || null,
	};
}

class AuthController {
	async login(req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ success: false, errors: errors.array() });
		}

		const { email, password } = req.body;
		const result = await authService.login(email, password, getClientMeta(req));

		res.cookie('accessToken', result.token, getAccessCookieOptions());
		res.cookie('refreshToken', result.refreshToken, {
			...getRefreshCookieOptions(),
		});

		res.json({ success: true, message: 'Login successful', data: { token: result.token, user: result.user } });
	}

	async refresh(req, res) {
		const refreshToken = req.refreshToken || ((req.cookies && req.cookies.refreshToken) || req.body.refreshToken);
		try {
			const result = await authService.refresh(refreshToken, getClientMeta(req), req.refreshContext);

			res.cookie('accessToken', result.token, getAccessCookieOptions());
			res.cookie('refreshToken', result.refreshToken, {
				...getRefreshCookieOptions(),
			});

			return res.json({ success: true, data: { token: result.token, user: result.user } });
		} catch (err) {
			res.clearCookie('accessToken', { path: '/' });
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

	async session(req, res) {
		const result = await authService.validateSession(req.user.id, req.user.sid);
		res.json({ success: true, data: result });
	}

	async logout(req, res) {
		const refreshToken = req.refreshToken || (req.cookies && req.cookies.refreshToken);
		if (refreshToken) {
			await authService.revokeRefresh(refreshToken);
		}
		res.clearCookie('accessToken', { path: '/' });
		res.clearCookie('refreshToken', { path: '/' });
		res.json({ success: true, message: 'Logged out successfully' });
	}

	async logoutAll(req, res) {
		const count = await authService.invalidateAllSessions(req.user.id);
		res.clearCookie('accessToken', { path: '/' });
		res.clearCookie('refreshToken', { path: '/' });
		res.json({ success: true, message: 'All sessions invalidated', data: { invalidatedSessions: count } });
	}
}

module.exports = new AuthController();
