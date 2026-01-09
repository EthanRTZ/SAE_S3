const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Emplacement = sequelize.define('Emplacement', {
  id_emplacement: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_emplacement'
  },
  nom_emplacement: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'nom_emplacement'
  },
  coord_x: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    field: 'coord_x'
  },
  coord_y: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    field: 'coord_y'
  },
  coordonnees_completes: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'coordonnees_completes'
  },
  id_zone: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_zone',
    references: {
      model: 'zones',
      key: 'id_zone'
    }
  },
  statut: {
    type: DataTypes.STRING(20),
    defaultValue: 'libre'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  moyens_logistiques: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'moyens_logistiques'
  },
  surface_volume: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'surface_volume'
  },
  nombre_prises: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'nombre_prises'
  },
  acces_eau: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'acces_eau'
  }
}, {
  tableName: 'emplacements',
  timestamps: false
});

module.exports = Emplacement;

