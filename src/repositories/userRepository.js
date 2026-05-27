const path = require('path');
const db = require(path.resolve(__dirname, '../../services/backend/db'));

const findByEmail = async (email) => db.User.findOne({ where: { email, isActive: true } });
const findById = async (id, options = {}) => db.User.findByPk(id, options);
const createUser = async (data) => db.User.create(data);
const updateLastLogin = async (userId) => db.User.update({ lastLogin: new Date() }, { where: { id: userId } });

module.exports = {
  findByEmail,
  findById,
  createUser,
  updateLastLogin,
};
