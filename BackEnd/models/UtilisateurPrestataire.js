const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UtilisateurPrestataire = sequelize.define('UtilisateurPrestataire', {
  id_utilisateur: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_utilisateur',
    references: {
      model: 'utilisateurs',
      key: 'id_utilisateur'
    }
  },
  id_prestataire: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_prestataire',
    references: {
      model: 'prestataire',
      key: 'id_prestataire'
    }
  }
}, {
  tableName: 'utilisateur_prestataire',
  timestamps: false
});

module.exports = UtilisateurPrestataire;
