const { validationResult } = require('express-validator');
const authService = require('./service');

class AuthController {
  async login(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, message: 'Login successful', data: result });
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
    // JWT is stateless — the client is responsible for discarding the token
    res.json({ success: true, message: 'Logged out successfully' });
  }
}

module.exports = new AuthController();
