const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
  id_rôle: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_rôle'
  },
  nom_rôle: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'nom_rôle'
  }
}, {
  tableName: 'rôles',
  timestamps: false
});

module.exports = Role;

