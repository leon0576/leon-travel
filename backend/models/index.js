const User = require('./User');
const Trip = require('./Trip');

// 建立关系
User.hasMany(Trip, {
  foreignKey: 'userId',
  as: 'trips'
});

Trip.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  User,
  Trip
};