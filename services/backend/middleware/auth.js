const jwt = require('jsonwebtoken');
const appConfig = require('../../../config/appConfig');

/**
 * JWT authentication middleware.
 * Expects: Authorization: Bearer <token>
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No authentication token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, appConfig.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid authentication token';
    return res.status(401).json({ success: false, message });
  }
};
