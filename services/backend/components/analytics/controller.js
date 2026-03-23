const analyticsService = require('./service');

class AnalyticsController {
  async getDashboard(req, res) {
    const summary = await analyticsService.getDashboardSummary();
    res.json({ success: true, data: summary });
  }

  async getRevenue(req, res) {
    const days = parseInt(req.query.days, 10) || 7;
    const data = await analyticsService.getRevenueByDate(days);
    res.json({ success: true, data });
  }

  async getTopProducts(req, res) {
    const limit = parseInt(req.query.limit, 10) || 5;
    const data = await analyticsService.getTopProducts(limit);
    res.json({ success: true, data });
  }
}

module.exports = new AnalyticsController();
