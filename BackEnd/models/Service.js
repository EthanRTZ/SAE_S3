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
  nom_service: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'nom_service'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
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

