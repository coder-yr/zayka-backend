const { Op } = require('sequelize');
const db = require('../../db');

class ProductService {
  async getAll(query = {}) {
    const { page = 1, limit = 20, category, search, isAvailable } = query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = {};

    if (category) where.category = category;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
    if (search) where.name = { [Op.like]: `%${search}%` };

    const { count, rows } = await db.Product.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      products: rows,
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / parseInt(limit, 10)),
    };
  }

  async getById(id) {
    const product = await db.Product.findByPk(id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  async create(data) {
    return db.Product.create(data);
  }

  async update(id, data) {
    const product = await this.getById(id);
    return product.update(data);
  }

  async delete(id) {
    const product = await this.getById(id);
    await product.destroy();
    return { message: 'Product deleted successfully' };
  }
}

module.exports = new ProductService();
