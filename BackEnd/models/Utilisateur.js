const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Utilisateur = sequelize.define('Utilisateur', {
  id_utilisateur: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_utilisateur'
  },
  nom_utilisateur: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'nom_utilisateur'
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },
  mot_de_passe: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'mot_de_passe'
  },
  id_rôle: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_rôle',
    references: {
      model: 'rôles',
      key: 'id_rôle'
    }
  },
  date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'date_creation'
  }
}, {
  tableName: 'utilisateurs',
  timestamps: false
});

module.exports = Utilisateur;

