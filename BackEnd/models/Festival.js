const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Festival = sequelize.define('Festival', {
  id_festival: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_festival'
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  annee: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date_debut: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'date_debut'
  },
  date_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'date_fin'
  },
  lieu_nom: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'lieu_nom'
  },
  lieu_coordonnees: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'lieu_coordonnees'
  },
  description_fr: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description_fr'
  },
  description_en: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description_en'
  },
  nombre_festivaliers: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'nombre_festivaliers'
  },
  version: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'festival',
  timestamps: false
});

module.exports = Festival;
