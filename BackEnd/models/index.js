const sequelize = require('../config/database');

// Import des modèles
const Role = require('./Role');
const Utilisateur = require('./Utilisateur');
const Artiste = require('./Artiste');
const Prestataire = require('./Prestataire');
const Service = require('./Service');
const Emplacement = require('./Emplacement');
const PrestataireEmplacement = require('./PrestataireEmplacement');
const SessionAuthentification = require('./SessionAuthentification');

// ========================================
// DÉFINITION DES ASSOCIATIONS
// ========================================

// Utilisateur <-> Role
Utilisateur.belongsTo(Role, {
  foreignKey: 'id_rôle',
  as: 'role'
});
Role.hasMany(Utilisateur, {
  foreignKey: 'id_rôle',
  as: 'utilisateurs'
});

// Service <-> Prestataire
Service.belongsTo(Prestataire, {
  foreignKey: 'id_prestataire',
  as: 'prestataire'
});
Prestataire.hasMany(Service, {
  foreignKey: 'id_prestataire',
  as: 'services'
});

// Prestataire <-> Emplacement (Many-to-Many)
Prestataire.belongsToMany(Emplacement, {
  through: PrestataireEmplacement,
  foreignKey: 'id_prestataire',
  otherKey: 'id_emplacement',
  as: 'emplacements'
});

Emplacement.belongsToMany(Prestataire, {
  through: PrestataireEmplacement,
  foreignKey: 'id_emplacement',
  otherKey: 'id_prestataire',
  as: 'prestataires'
});

// SessionAuthentification <-> Utilisateur
SessionAuthentification.belongsTo(Utilisateur, {
  foreignKey: 'id_utilisateur',
  as: 'utilisateur'
});
Utilisateur.hasMany(SessionAuthentification, {
  foreignKey: 'id_utilisateur',
  as: 'sessions'
});

// Export des modèles
module.exports = {
  sequelize,
  Role,
  Utilisateur,
  Artiste,
  Prestataire,
  Service,
  Emplacement,
  PrestataireEmplacement,
  SessionAuthentification
};

