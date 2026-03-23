const { validationResult } = require('express-validator');
const productService = require('./service');

class ProductController {
  async getAll(req, res) {
    const result = await productService.getAll(req.query);
    res.json({ success: true, data: result });
  }

  async getById(req, res) {
    const product = await productService.getById(req.params.id);
    res.json({ success: true, data: product });
  }

  async create(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const product = await productService.create(req.body);
    res.status(201).json({ success: true, message: 'Product created', data: product });
  }

  async update(req, res) {
    const product = await productService.update(req.params.id, req.body);
    res.json({ success: true, message: 'Product updated', data: product });
  }

  async delete(req, res) {
    const result = await productService.delete(req.params.id);
    res.json({ success: true, ...result });
  }
}

module.exports = new ProductController();
