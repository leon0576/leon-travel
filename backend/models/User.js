const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  nickname: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  birthday: {
    type: Sequelize.DATE
  },
  avatar: {
    type: Sequelize.TEXT,
    defaultValue: 'https://i.pravatar.cc/150?u=default'
  },
  background: {
    type: Sequelize.TEXT,
    defaultValue: null
  },
  backgroundOpacity: {
    type: Sequelize.STRING,
    defaultValue: '80'
  },
  glassEffect: {
    type: Sequelize.STRING,
    defaultValue: 'false'
  },
  loginBackground: {
    type: Sequelize.TEXT,
    defaultValue: null
  },
  amapWebKey: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  amapSecurityCode: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  amapRestKey: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  updatedAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;
