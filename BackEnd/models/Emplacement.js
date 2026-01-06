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
    allowNull: false,
    field: 'nom_emplacement'
  },
  coord_x: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'coord_x'
  },
  coord_y: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'coord_y'
  },
  zone: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'emplacements',
  timestamps: false
});

module.exports = Emplacement;

