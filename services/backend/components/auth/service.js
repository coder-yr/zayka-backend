const jwt = require('jsonwebtoken');
const appConfig = require('../../../../config/appConfig');
const db = require('../../db');

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

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.expiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
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
