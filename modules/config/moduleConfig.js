const path = require('path');
const dbConfig = require('../../config/database');

module.exports = {
  database: dbConfig,
  modelsPath: path.resolve(__dirname, '../models'),
  services: {
    api: {
      name: 'backend-api',
      port: 5000,
      description: 'REST API server for the frontend application',
    },
    admin: {
      name: 'admin-panel',
      port: 7000,
      description: 'AdminJS dashboard for managing restaurant data',
    },
  },
};
