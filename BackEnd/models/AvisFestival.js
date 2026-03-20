const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AvisFestival = sequelize.define('AvisFestival', {
  id_avis_festival: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_avis_festival'
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
  id_festival: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_festival',
    references: {
      model: 'festival',
      key: 'id_festival'
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
  tableName: 'avis_festival',
  timestamps: false
});

module.exports = AvisFestival;

