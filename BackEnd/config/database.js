const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'golden_coast',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: false, // Désactiver les timestamps automatiques par défaut
      underscored: false, // Utiliser camelCase au lieu de snake_case
    }
  }
);

// Test de connexion
sequelize.authenticate()
  .then(() => {
    console.log('✅ Connected to PostgreSQL database via Sequelize');
  })
  .catch(err => {
    console.error('❌ Unable to connect to database:', err);
  });

module.exports = sequelize;

