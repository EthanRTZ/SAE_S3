const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Equipement = sequelize.define('Equipement', {
  id_equipement: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_equipement'
  },
  type_equipement: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'type_equipement'
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'equipements',
  timestamps: false
});

module.exports = Equipement;
