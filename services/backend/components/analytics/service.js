const { Op, fn, col, literal } = require('sequelize');
const db = require('../../db');

class AnalyticsService {
  async getDashboardSummary() {
    const [totalOrders, totalRevenue, totalProducts, totalTables, pendingOrders] = await Promise.all([
      db.Order.count(),
      db.Order.sum('totalAmount', { where: { paymentStatus: 'paid' } }),
      db.Product.count({ where: { isAvailable: true } }),
      db.Table.count({ where: { isActive: true } }),
      db.Order.count({ where: { status: { [Op.in]: ['pending', 'confirmed', 'preparing'] } } }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, todayRevenue] = await Promise.all([
      db.Order.count({ where: { createdAt: { [Op.gte]: today } } }),
      db.Order.sum('totalAmount', {
        where: { paymentStatus: 'paid', createdAt: { [Op.gte]: today } },
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: parseFloat(totalRevenue) || 0,
      totalProducts,
      totalTables,
      pendingOrders,
      todayOrders,
      todayRevenue: parseFloat(todayRevenue) || 0,
    };
  }

  async getRevenueByDate(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days, 10));

    const rows = await db.Order.findAll({
      where: {
        paymentStatus: 'paid',
        createdAt: { [Op.gte]: since },
      },
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('SUM', col('total_amount')), 'revenue'],
        [fn('COUNT', col('id')), 'orderCount'],
      ],
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    return rows;
  }

  async getTopProducts(limit = 5) {
    const rows = await db.sequelize.query(
      `SELECT p.id, p.name, p.category, COUNT(oi.order_id) AS orderCount
       FROM products p
       LEFT JOIN order_items oi ON p.id = oi.product_id
       GROUP BY p.id, p.name, p.category
       ORDER BY orderCount DESC
       LIMIT :limit`,
      { replacements: { limit: parseInt(limit, 10) }, type: db.Sequelize.QueryTypes.SELECT }
    );

    return rows;
  }
}

module.exports = new AnalyticsService();
