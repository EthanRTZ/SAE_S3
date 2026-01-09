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
const Zone = require('./Zone');
const Scene = require('./Scene');
const Programmation = require('./Programmation');
const Equipement = require('./Equipement');
const Avis = require('./Avis');
const Festival = require('./Festival');
const Billet = require('./Billet');
const ReservationBillet = require('./ReservationBillet');
const UtilisateurPrestataire = require('./UtilisateurPrestataire');
const PrestataireZone = require('./PrestataireZone');

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

// Emplacement <-> Zone
Emplacement.belongsTo(Zone, {
  foreignKey: 'id_zone',
  as: 'zone'
});
Zone.hasMany(Emplacement, {
  foreignKey: 'id_zone',
  as: 'emplacements'
});

// Equipement <-> Zone
Equipement.belongsTo(Zone, {
  foreignKey: 'id_zone',
  as: 'zone'
});
Zone.hasMany(Equipement, {
  foreignKey: 'id_zone',
  as: 'equipements'
});

// Scene <-> Prestataire (sponsor)
Scene.belongsTo(Prestataire, {
  foreignKey: 'id_prestataire_sponsor',
  as: 'sponsor'
});
Prestataire.hasMany(Scene, {
  foreignKey: 'id_prestataire_sponsor',
  as: 'scenes_sponsorisees'
});

// Programmation <-> Scene
Programmation.belongsTo(Scene, {
  foreignKey: 'id_scene',
  as: 'scene'
});
Scene.hasMany(Programmation, {
  foreignKey: 'id_scene',
  as: 'programmations'
});

// Programmation <-> Artiste
Programmation.belongsTo(Artiste, {
  foreignKey: 'id_artiste',
  as: 'artiste'
});
Artiste.hasMany(Programmation, {
  foreignKey: 'id_artiste',
  as: 'programmations'
});

// Avis <-> Utilisateur
Avis.belongsTo(Utilisateur, {
  foreignKey: 'id_utilisateur',
  as: 'utilisateur'
});
Utilisateur.hasMany(Avis, {
  foreignKey: 'id_utilisateur',
  as: 'avis'
});

// Avis <-> Prestataire
Avis.belongsTo(Prestataire, {
  foreignKey: 'id_prestataire',
  as: 'prestataire'
});
Prestataire.hasMany(Avis, {
  foreignKey: 'id_prestataire',
  as: 'avis'
});

// ReservationBillet <-> Utilisateur
ReservationBillet.belongsTo(Utilisateur, {
  foreignKey: 'id_utilisateur',
  as: 'utilisateur'
});
Utilisateur.hasMany(ReservationBillet, {
  foreignKey: 'id_utilisateur',
  as: 'reservations'
});

// ReservationBillet <-> Billet
ReservationBillet.belongsTo(Billet, {
  foreignKey: 'id_billet',
  as: 'billet'
});
Billet.hasMany(ReservationBillet, {
  foreignKey: 'id_billet',
  as: 'reservations'
});

// Utilisateur <-> Prestataire (Many-to-Many via UtilisateurPrestataire)
Utilisateur.belongsToMany(Prestataire, {
  through: UtilisateurPrestataire,
  foreignKey: 'id_utilisateur',
  otherKey: 'id_prestataire',
  as: 'prestataires'
});
Prestataire.belongsToMany(Utilisateur, {
  through: UtilisateurPrestataire,
  foreignKey: 'id_prestataire',
  otherKey: 'id_utilisateur',
  as: 'utilisateurs'
});

// Prestataire <-> Zone (Many-to-Many via PrestataireZone)
Prestataire.belongsToMany(Zone, {
  through: PrestataireZone,
  foreignKey: 'id_prestataire',
  otherKey: 'id_zone',
  as: 'zones'
});
Zone.belongsToMany(Prestataire, {
  through: PrestataireZone,
  foreignKey: 'id_zone',
  otherKey: 'id_prestataire',
  as: 'prestataires'
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
  SessionAuthentification,
  Zone,
  Scene,
  Programmation,
  Equipement,
  Avis,
  Festival,
  Billet,
  ReservationBillet,
  UtilisateurPrestataire,
  PrestataireZone
};

