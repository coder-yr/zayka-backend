const { validationResult } = require('express-validator');
const tableService = require('./service');

class TableController {
  async getAll(req, res) {
    const tables = await tableService.getAll(req.query);
    res.json({ success: true, data: tables });
  }

  async getById(req, res) {
    const table = await tableService.getById(req.params.id);
    res.json({ success: true, data: table });
  }

  async create(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const table = await tableService.create(req.body);
    res.status(201).json({ success: true, message: 'Table created', data: table });
  }

  async update(req, res) {
    const table = await tableService.update(req.params.id, req.body);
    res.json({ success: true, message: 'Table updated', data: table });
  }

  async delete(req, res) {
    const result = await tableService.delete(req.params.id);
    res.json({ success: true, ...result });
  }
}

module.exports = new TableController();
