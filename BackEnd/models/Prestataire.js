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
    allowNull: false,
    unique: true
  },
  type_prestataire: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'type_prestataire'
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
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'prestataire',
  timestamps: false
});

module.exports = Prestataire;

