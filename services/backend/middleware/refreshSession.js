const { resolveRefreshTokenContext } = require('../components/auth/refreshTokenStore');

function extractRefreshToken(req) {
  if (req?.cookies?.refreshToken) return req.cookies.refreshToken;
  if (typeof req?.body?.refreshToken === 'string' && req.body.refreshToken.trim()) {
    return req.body.refreshToken.trim();
  }

  const header = req?.headers?.['x-refresh-token'];
  if (typeof header === 'string' && header.trim()) {
    return header.trim();
  }

  return null;
}

module.exports =
  ({ required = true } = {}) =>
  async (req, res, next) => {
    const refreshToken = extractRefreshToken(req);

    if (!refreshToken) {
      if (!required) {
        return next();
      }
      return res.status(401).json({ success: false, message: 'Refresh token missing' });
    }

    try {
      const context = await resolveRefreshTokenContext(refreshToken);
      req.refreshToken = refreshToken;
      req.refreshContext = context;
      next();
    } catch (error) {
      const statusCode = error.statusCode || 401;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Invalid refresh token',
      });
    }
  };