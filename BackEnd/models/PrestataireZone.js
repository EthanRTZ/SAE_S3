const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PrestataireZone = sequelize.define('PrestataireZone', {
  id_prestataire: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_prestataire',
    references: {
      model: 'prestataire',
      key: 'id_prestataire'
    }
  },
  id_zone: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_zone',
    references: {
      model: 'zones',
      key: 'id_zone'
    }
  }
}, {
  tableName: 'prestataire_zone',
  timestamps: false
});

module.exports = PrestataireZone;
