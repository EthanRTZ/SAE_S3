const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReservationBillet = sequelize.define('ReservationBillet', {
  id_reservation: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_reservation'
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
  id_billet: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_billet',
    references: {
      model: 'billets',
      key: 'id_billet'
    }
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  date_reservation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'date_reservation'
  },
  date_utilisation: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_utilisation'
  },
  statut: {
    type: DataTypes.STRING(20),
    defaultValue: 'réservé'
  },
  prix_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'prix_total'
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'transaction_id'
  },
  date_paiement: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'date_paiement'
  }
}, {
  tableName: 'reservation_billet',
  timestamps: false
});

module.exports = ReservationBillet;
