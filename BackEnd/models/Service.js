const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('Service', {
  id_service: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_service'
  },
  id_prestataire: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_prestataire',
    references: {
      model: 'prestataire',
      key: 'id_prestataire'
    }
  },
  nom_service_fr: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'nom_service_fr'
  },
  nom_service_en: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'nom_service_en'
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
  prix_estime: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'prix_estime'
  }
}, {
  tableName: 'services',
  timestamps: false
});

module.exports = Service;

