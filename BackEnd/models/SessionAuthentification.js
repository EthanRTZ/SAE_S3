const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SessionAuthentification = sequelize.define('SessionAuthentification', {
  id_session: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_session'
  },
  id_utilisateur: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_utilisateur',
    references: {
      model: 'utilisateurs',
      key: 'id_utilisateur'
    }
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'date_creation'
  },
  date_expiration: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'date_expiration'
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ip_adresse: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_adresse'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  }
}, {
  tableName: 'session_authentification',
  timestamps: false
});

module.exports = SessionAuthentification;

