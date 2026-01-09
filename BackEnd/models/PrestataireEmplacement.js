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
  },
  date_demande: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'date_demande'
  },
  date_attribution: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'date_attribution'
  },
  date_debut: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'date_debut'
  },
  date_fin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'date_fin'
  },
  statut: {
    type: DataTypes.STRING(20),
    defaultValue: 'demandé'
  }
}, {
  tableName: 'prestataire_emplacement',
  timestamps: false
});

module.exports = PrestataireEmplacement;

