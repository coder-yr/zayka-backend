const db = require('../../db');

class OrderService {
  async getAll(query = {}) {
    const { page = 1, limit = 20, status, paymentStatus } = query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = {};

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const { count, rows } = await db.Order.findAndCountAll({
      where,
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: db.Table, as: 'table', attributes: ['id', 'tableNumber', 'floor'] },
        { model: db.Product, as: 'products', through: { attributes: ['quantity', 'unitPrice'] } },
      ],
      limit: parseInt(limit, 10),
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    return {
      orders: rows,
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / parseInt(limit, 10)),
    };
  }

  async getById(id) {
    const order = await db.Order.findByPk(id, {
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: db.Table, as: 'table' },
        { model: db.Product, as: 'products', through: { attributes: ['quantity', 'unitPrice'] } },
      ],
    });

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    return order;
  }

  async create(data) {
    const { productIds = [], ...orderData } = data;
    const order = await db.Order.create(orderData);

    if (productIds.length > 0) {
      await order.setProducts(productIds);
    }

    return this.getById(order.id);
  }

  async updateStatus(id, status) {
    const order = await this.getById(id);
    return order.update({ status });
  }

  async updatePayment(id, paymentData) {
    const order = await this.getById(id);
    return order.update(paymentData);
  }

  async delete(id) {
    const order = await this.getById(id);
    await order.destroy();
    return { message: 'Order deleted successfully' };
  }
}

module.exports = new OrderService();
