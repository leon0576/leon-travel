const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Trip = sequelize.define('Trip', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  cover: {
    type: Sequelize.TEXT,
    defaultValue: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT
  },
  transport: {
    type: Sequelize.STRING
  },
  participants: {
    type: Sequelize.STRING
  },
  startLocation: {
    type: Sequelize.STRING
  },
  endLocation: {
    type: Sequelize.STRING
  },
  attractions: {
    type: Sequelize.STRING
  },
  startDate: {
    type: Sequelize.DATE,
    allowNull: false
  },
  endDate: {
    type: Sequelize.DATE,
    allowNull: false
  },
  days: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  dailyPlans: {
    type: Sequelize.JSON,
    defaultValue: []
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
  tableName: 'trips',
  timestamps: true
});

module.exports = Trip;