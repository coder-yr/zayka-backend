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
    const transaction = await db.sequelize.transaction();
    try {
      const { items = [], productIds = [], ...orderData } = data;

      let subtotal = 0;
      let calculatedTax = 0;
      let calculatedDiscount = 0;
      const resolvedItems = [];

      if (items && items.length > 0) {
        for (const item of items) {
          const product = await db.Product.findByPk(item.productId, { transaction });
          if (!product) {
            throw new Error(`Product with ID ${item.productId} not found`);
          }
          const price = parseFloat(item.unitPrice || product.price);
          const qty = parseInt(item.quantity || 1, 10);
          subtotal += price * qty;
          resolvedItems.push({
            productId: item.productId,
            quantity: qty,
            unitPrice: price,
          });
        }

        if (orderData.discountAmount !== undefined) {
          calculatedDiscount = parseFloat(orderData.discountAmount);
        } else if (orderData.discountPercent) {
          calculatedDiscount = (subtotal * parseFloat(orderData.discountPercent)) / 100;
        }

        const taxRate = parseFloat(orderData.taxRate !== undefined ? orderData.taxRate : 5) / 100;
        const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
        calculatedTax = taxableAmount * taxRate;

        orderData.subtotal = subtotal;
        orderData.discountAmount = calculatedDiscount;
        orderData.taxAmount = calculatedTax;
        orderData.totalAmount = taxableAmount + calculatedTax;
      } else {
        if (orderData.totalAmount && !orderData.subtotal) {
          orderData.subtotal = parseFloat(orderData.totalAmount);
        }
      }

      const order = await db.Order.create(orderData, { transaction });

      if (resolvedItems.length > 0) {
        for (const item of resolvedItems) {
          await order.addProduct(item.productId, {
            through: {
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            },
            transaction,
          });
        }
      } else if (productIds.length > 0) {
        await order.setProducts(productIds, { transaction });
      }

      await transaction.commit();
      return this.getById(order.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
