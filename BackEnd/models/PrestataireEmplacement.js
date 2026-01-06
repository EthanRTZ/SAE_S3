const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PrestataireEmplacement = sequelize.define('PrestataireEmplacement', {
  id_prestataire: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_prestataire',
    references: {
      model: 'prestataire',
      key: 'id_prestataire'
    }
  },
  id_emplacement: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_emplacement',
    references: {
      model: 'emplacements',
      key: 'id_emplacement'
    }
  }
}, {
  tableName: 'prestataire_emplacement',
  timestamps: false
});

module.exports = PrestataireEmplacement;

