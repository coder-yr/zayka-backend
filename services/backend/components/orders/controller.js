const { validationResult } = require('express-validator');
const orderService = require('./service');

class OrderController {
  async getAll(req, res) {
    const result = await orderService.getAll(req.query);
    res.json({ success: true, data: result });
  }

  async getById(req, res) {
    const order = await orderService.getById(req.params.id);
    res.json({ success: true, data: order });
  }

  async create(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const order = await orderService.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, message: 'Order created', data: order });
  }

  async updateStatus(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const order = await orderService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, message: 'Order status updated', data: order });
  }

  async updatePayment(req, res) {
    const order = await orderService.updatePayment(req.params.id, req.body);
    res.json({ success: true, message: 'Payment updated', data: order });
  }

  async delete(req, res) {
    const result = await orderService.delete(req.params.id);
    res.json({ success: true, ...result });
  }
}

module.exports = new OrderController();
