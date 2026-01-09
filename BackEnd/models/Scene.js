const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Scene = sequelize.define('Scene', {
  id_scene: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_scene'
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  id_prestataire_sponsor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_prestataire_sponsor',
    references: {
      model: 'prestataire',
      key: 'id_prestataire'
    }
  },
  coordonnees: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'scenes',
  timestamps: false
});

module.exports = Scene;
