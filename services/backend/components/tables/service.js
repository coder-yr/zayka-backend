const { Op } = require('sequelize');
const db = require('../../db');

class TableService {
  async getAll(query = {}) {
    const { status, floor } = query;
    const where = { isActive: true };

    if (status) where.status = status;
    if (floor) where.floor = floor;

    return db.Table.findAll({
      where,
      order: [['tableNumber', 'ASC']],
    });
  }

  async getById(id) {
    const table = await db.Table.findByPk(id, {
      include: [
        {
          model: db.Order,
          as: 'orders',
          where: { status: { [Op.in]: ['pending', 'confirmed', 'preparing', 'ready'] } },
          required: false,
        },
      ],
    });

    if (!table) {
      const error = new Error('Table not found');
      error.statusCode = 404;
      throw error;
    }

    return table;
  }

  async create(data) {
    return db.Table.create(data);
  }

  async update(id, data) {
    const table = await this.getById(id);
    return table.update(data);
  }

  async delete(id) {
    const table = await this.getById(id);
    await table.destroy();
    return { message: 'Table deleted successfully' };
  }
}

module.exports = new TableService();
