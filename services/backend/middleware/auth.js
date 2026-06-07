const jwt = require('jsonwebtoken');
const appConfig = require('../../../config/appConfig');
const { isSessionActive } = require('../components/auth/refreshTokenStore');

/**
 * JWT authentication middleware.
 * Expects: Authorization: Bearer <token>
 */
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies && req.cookies.accessToken;

  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : cookieToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No authentication token provided' });
  }

  try {
    const decoded = jwt.verify(token, appConfig.jwt.secret);

    if (!decoded.sid) {
      return res.status(401).json({ success: false, message: 'Session information missing from token' });
    }

    const activeSession = await isSessionActive(decoded.sid);
    if (!activeSession) {
      return res.status(401).json({ success: false, message: 'Session is invalidated' });
    }

    req.authToken = token;
    req.user = decoded;
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid authentication token';
    return res.status(401).json({ success: false, message });
  }
};
