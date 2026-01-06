const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prestataire = sequelize.define('Prestataire', {
  id_prestataire: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_prestataire'
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  type_prestataire: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'type_prestataire'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contact_email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'contact_email'
  },
  contact_tel: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'contact_tel'
  },
  site_web: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'site_web'
  },
  photo_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'photo_url'
  },
  date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'date_creation'
  }
}, {
  tableName: 'prestataire',
  timestamps: false
});

module.exports = Prestataire;

