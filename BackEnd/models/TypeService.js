const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TypeService = sequelize.define('TypeService', {
  id_type_service: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_type_service'
  },
  nom: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  label_fr: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'label_fr'
  },
  label_en: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'label_en'
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
  icone: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  champs_requis: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    field: 'champs_requis'
  }
}, {
  tableName: 'type_service',
  timestamps: false
});

module.exports = TypeService;

