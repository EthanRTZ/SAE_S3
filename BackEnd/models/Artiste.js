const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Artiste = sequelize.define('Artiste', {
  id_artiste: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_artiste'
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  style_musique: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'style_musique'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pays_origine: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'pays_origine'
  },
  photo_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'photo_url'
  },
  cachet: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'date_creation'
  },
  lien_deezer: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'lien_deezer'
  }
}, {
  tableName: 'artiste',
  timestamps: false
});

module.exports = Artiste;

