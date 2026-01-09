const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Programmation = sequelize.define('Programmation', {
  id_programmation: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_programmation'
  },
  id_scene: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_scene',
    references: {
      model: 'scenes',
      key: 'id_scene'
    }
  },
  id_artiste: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_artiste',
    references: {
      model: 'artiste',
      key: 'id_artiste'
    }
  },
  date_concert: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'date_concert'
  },
  heure_debut: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'heure_debut'
  },
  heure_fin: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'heure_fin'
  },
  style_musique: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'style_musique'
  },
  ordre_passage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'ordre_passage'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'programmation',
  timestamps: false
});

module.exports = Programmation;
