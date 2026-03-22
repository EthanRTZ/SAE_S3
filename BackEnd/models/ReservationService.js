const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReservationService = sequelize.define('ReservationService', {
  id_reservation_service: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_reservation_service'
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
  id_service: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_service',
    references: {
      model: 'services',
      key: 'id_service'
    }
  },
  id_prestataire: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_prestataire',
    references: {
      model: 'prestataire',
      key: 'id_prestataire'
    }
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1 }
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  prix_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'prix_total'
  },
  statut: {
    type: DataTypes.STRING(20),
    defaultValue: 'réservé'
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'transaction_id'
  },
  date_reservation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'date_reservation'
  },
  date_paiement: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'date_paiement'
  }
}, {
  tableName: 'reservation_service',
  timestamps: false
});

module.exports = ReservationService;

