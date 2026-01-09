const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Billet = sequelize.define('Billet', {
  id_billet: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_billet'
  },
  type_billet: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'type_billet'
  },
  label_fr: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'label_fr'
  },
  label_en: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'label_en'
  },
  prix: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock_disponible: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'stock_disponible'
  },
  stock_total: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'stock_total'
  },
  jours_associes: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'jours_associes'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'billets',
  timestamps: false
});

module.exports = Billet;
