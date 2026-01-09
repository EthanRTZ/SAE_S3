const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Avis = sequelize.define('Avis', {
  id_avis: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_avis'
  },
  id_utilisateur: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_utilisateur',
    references: {
      model: 'utilisateurs',
      key: 'id_utilisateur'
    }
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
  note: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date_avis: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'date_avis'
  },
  valide: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'avis',
  timestamps: false
});

module.exports = Avis;
