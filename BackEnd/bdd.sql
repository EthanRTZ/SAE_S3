-- ============================================
-- SCRIPT DE CRÉATION COMPLÈTE DE LA BASE DE DONNÉES
-- Golden Coast Festival - SAE S3
-- Basé sur les exigences de la SAE et les données JSON
-- ============================================

-- Suppression des tables existantes (dans l'ordre pour éviter les conflits de clés étrangères)
DROP TABLE IF EXISTS avis_festival CASCADE;
DROP TABLE IF EXISTS reservation_service CASCADE;
DROP TABLE IF EXISTS reservation_billet CASCADE;
DROP TABLE IF EXISTS billets CASCADE;
DROP TABLE IF EXISTS avis CASCADE;
DROP TABLE IF EXISTS equipements CASCADE;
DROP TABLE IF EXISTS programmation CASCADE;
DROP TABLE IF EXISTS scenes CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS prestataire_emplacement CASCADE;
DROP TABLE IF EXISTS emplacements CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS type_service CASCADE;
DROP TABLE IF EXISTS prestataire_zone CASCADE;
DROP TABLE IF EXISTS session_authentification CASCADE;
DROP TABLE IF EXISTS utilisateur_prestataire CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;
DROP TABLE IF EXISTS rôles CASCADE;
DROP TABLE IF EXISTS artiste CASCADE;
DROP TABLE IF EXISTS prestataire CASCADE;
DROP TABLE IF EXISTS festival CASCADE;
DROP TABLE IF EXISTS traductions CASCADE;

-- ============================================
-- TABLE : rôles
-- ============================================
CREATE TABLE rôles (
                       id_rôle SERIAL PRIMARY KEY,
                       nom_rôle VARCHAR(50) NOT NULL UNIQUE,
                       description TEXT
);

-- ============================================
-- TABLE : utilisateurs
-- ============================================
CREATE TABLE utilisateurs (
                              id_utilisateur SERIAL PRIMARY KEY,
                              nom_utilisateur VARCHAR(100) UNIQUE NOT NULL,
                              email VARCHAR(150) UNIQUE NOT NULL,
                              mot_de_passe VARCHAR(255) NOT NULL,
                              id_rôle INT NOT NULL REFERENCES rôles(id_rôle),
                              date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              actif BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABLE : prestataire
-- ============================================
CREATE TABLE prestataire (
                             id_prestataire SERIAL PRIMARY KEY,
                             nom VARCHAR(100) NOT NULL UNIQUE,
                             type_prestataire VARCHAR(100) NOT NULL,
                             description_fr TEXT,
                             description_en TEXT,
                             contact_email VARCHAR(150),
                             contact_tel VARCHAR(20),
                             site_web VARCHAR(255),
                             photo_url VARCHAR(255),
                             date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                             actif BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABLE : utilisateur_prestataire
-- Relation entre utilisateurs (rôle prestataire) et leur prestataire
-- ============================================
CREATE TABLE utilisateur_prestataire (
                                         id_utilisateur INT NOT NULL REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
                                         id_prestataire INT NOT NULL REFERENCES prestataire(id_prestataire) ON DELETE CASCADE,
                                         PRIMARY KEY (id_utilisateur, id_prestataire)
);

-- ============================================
-- TABLE : type_service
-- Types de services prédéfinis (réservation, commande, location)
-- ============================================
CREATE TABLE type_service (
                              id_type_service SERIAL PRIMARY KEY,
                              nom VARCHAR(50) NOT NULL UNIQUE,
                              label_fr VARCHAR(100) NOT NULL,
                              label_en VARCHAR(100),
                              description_fr TEXT,
                              description_en TEXT,
                              icone VARCHAR(10),
                              champs_requis JSONB NOT NULL DEFAULT '[]'
);

-- ============================================
-- TABLE : services
-- ============================================
CREATE TABLE services (
                          id_service SERIAL PRIMARY KEY,
                          id_prestataire INT NOT NULL REFERENCES prestataire(id_prestataire) ON DELETE CASCADE,
                          id_type_service INT REFERENCES type_service(id_type_service) ON DELETE SET NULL,
                          nom_service_fr VARCHAR(100) NOT NULL,
                          nom_service_en VARCHAR(100),
                          description_fr TEXT,
                          description_en TEXT,
                          prix_estime NUMERIC(10,2),
                          champs_specifiques JSONB DEFAULT '{}'
);

-- ============================================
-- TABLE : zones
-- Zones géographiques du festival (parking, camping, VIP, scènes, etc.)
-- ============================================
CREATE TABLE zones (
                       id_zone SERIAL PRIMARY KEY,
                       nom VARCHAR(100) NOT NULL UNIQUE,
                       type_zone VARCHAR(50) NOT NULL, -- 'parking', 'camping', 'VIP', 'festival', 'scène'
                       coordonnees JSONB, -- Tableau de coordonnées pour polygone
                       description TEXT,
                       actif BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABLE : scenes
-- Scènes/stages du festival
-- ============================================
CREATE TABLE scenes (
                        id_scene SERIAL PRIMARY KEY,
                        nom VARCHAR(100) NOT NULL UNIQUE,
                        id_prestataire_sponsor INT REFERENCES prestataire(id_prestataire),
                        coordonnees JSONB, -- Tableau de coordonnées pour polygone
                        description TEXT,
                        actif BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABLE : artiste
-- ============================================
CREATE TABLE artiste (
                         id_artiste SERIAL PRIMARY KEY,
                         nom VARCHAR(100) NOT NULL,
                         style_musique VARCHAR(100) NOT NULL,
                         description TEXT,
                         pays_origine VARCHAR(100),
                         photo_url VARCHAR(255),
                         cachet NUMERIC(10,2),
                         lien_deezer VARCHAR(255),
                         date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE : programmation
-- Horaires et programmation des artistes sur les scènes
-- ============================================
CREATE TABLE programmation (
                               id_programmation SERIAL PRIMARY KEY,
                               id_scene INT NOT NULL REFERENCES scenes(id_scene) ON DELETE CASCADE,
                               id_artiste INT NOT NULL REFERENCES artiste(id_artiste) ON DELETE CASCADE,
                               date_concert DATE NOT NULL,
                               heure_debut TIME NOT NULL,
                               heure_fin TIME NOT NULL,
                               style_musique VARCHAR(100),
                               ordre_passage INT, -- Ordre d'apparition dans la journée
                               description TEXT
);

-- ============================================
-- TABLE : emplacements
-- Emplacements disponibles pour les prestataires
-- ============================================
CREATE TABLE emplacements (
                              id_emplacement SERIAL PRIMARY KEY,
                              nom_emplacement VARCHAR(100),
                              coord_x NUMERIC(10, 6), -- Longitude (plus précis)
                              coord_y NUMERIC(10, 6), -- Latitude (plus précis)
                              coordonnees_completes VARCHAR(50), -- Format "lat,lng"
                              id_zone INT REFERENCES zones(id_zone),
                              statut VARCHAR(20) DEFAULT 'libre', -- 'libre', 'pris', 'en_attente', 'indisponible'
                              description TEXT,
                              moyens_logistiques TEXT, -- Nouveaux champs ajoutés
                              surface_volume VARCHAR(50), -- Ex: "45 m²" ou "100 m³"
                              nombre_prises INT, -- Nombre de prises électriques
                              acces_eau BOOLEAN DEFAULT FALSE, -- Accès à l'eau
                              date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE : prestataire_emplacement
-- Relation prestataire - emplacement (avec dates)
-- ============================================
CREATE TABLE prestataire_emplacement (
                                         id_prestataire INT NOT NULL REFERENCES prestataire(id_prestataire) ON DELETE CASCADE,
                                         id_emplacement INT NOT NULL REFERENCES emplacements(id_emplacement) ON DELETE CASCADE,
                                         date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                         date_attribution TIMESTAMP,
                                         date_debut TIMESTAMP,
                                         date_fin TIMESTAMP,
                                         statut VARCHAR(20) DEFAULT 'demandé', -- 'demandé', 'approuvé', 'refusé', 'terminé'
                                         PRIMARY KEY (id_prestataire, id_emplacement)
);

-- ============================================
-- TABLE : prestataire_zone
-- Relation prestataire - zone (pour tracking)
-- ============================================
CREATE TABLE prestataire_zone (
                                  id_prestataire INT NOT NULL REFERENCES prestataire(id_prestataire) ON DELETE CASCADE,
                                  id_zone INT NOT NULL REFERENCES zones(id_zone) ON DELETE CASCADE,
                                  PRIMARY KEY (id_prestataire, id_zone)
);

-- ============================================
-- TABLE : equipements
-- Équipements du site (toilettes, points d'eau, etc.)
-- ============================================
CREATE TABLE equipements (
                             id_equipement SERIAL PRIMARY KEY,
                             type_equipement VARCHAR(50) NOT NULL, -- 'Toilettes', 'Point d'eau', etc.
                             coord_x NUMERIC(10, 6),
                             coord_y NUMERIC(10, 6),
                             coordonnees_completes VARCHAR(50), -- Format "lat,lng"
                             id_zone INT REFERENCES zones(id_zone),
                             description TEXT,
                             actif BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABLE : avis
-- Avis des utilisateurs sur les prestataires
-- ============================================
CREATE TABLE avis (
                      id_avis SERIAL PRIMARY KEY,
                      id_utilisateur INT REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL,
                      id_prestataire INT NOT NULL REFERENCES prestataire(id_prestataire) ON DELETE CASCADE,
                      note INT NOT NULL CHECK (note >= 1 AND note <= 5),
                      commentaire TEXT,
                      date_avis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      valide BOOLEAN DEFAULT TRUE -- Pour modération
);

-- ============================================
-- TABLE : festival
-- Informations générales du festival
-- ============================================
CREATE TABLE festival (
                          id_festival SERIAL PRIMARY KEY,
                          nom VARCHAR(100) NOT NULL,
                          annee INT NOT NULL,
                          date_debut DATE NOT NULL,
                          date_fin DATE NOT NULL,
                          lieu_nom VARCHAR(200),
                          lieu_coordonnees VARCHAR(50), -- Format "lat,lng"
                          description_fr TEXT,
                          description_en TEXT,
                          presentation_fr JSONB, -- Tous les textes de la page d'accueil en français
                          presentation_en JSONB, -- Tous les textes de la page d'accueil en anglais
                          nombre_festivaliers INT,
                          version VARCHAR(20), -- V3, etc.
                          actif BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABLE : avis_festival
-- Notes et avis des utilisateurs sur le festival
-- ============================================
CREATE TABLE avis_festival (
                               id_avis_festival SERIAL PRIMARY KEY,
                               id_utilisateur INT REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL,
                               id_festival INT NOT NULL REFERENCES festival(id_festival) ON DELETE CASCADE,
                               note INT NOT NULL CHECK (note >= 1 AND note <= 5),
                               commentaire TEXT,
                               date_avis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               valide BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABLE : billets (forfaits)
-- Types de billets disponibles
-- ============================================
CREATE TABLE billets (
                         id_billet SERIAL PRIMARY KEY,
                         type_billet VARCHAR(50) NOT NULL, -- '1jour', '2jours', '3jours', 'parking', 'camping'
                         label_fr VARCHAR(100) NOT NULL,
                         label_en VARCHAR(100),
                         prix NUMERIC(10,2) NOT NULL,
                         stock_disponible INT DEFAULT 0,
                         stock_total INT DEFAULT 0,
                         jours_associes JSONB, -- Pour les forfaits multi-jours
                         description TEXT,
                         actif BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABLE : reservation_billet
-- Réservations de billets par les utilisateurs
-- ============================================
CREATE TABLE reservation_billet (
                                    id_reservation SERIAL PRIMARY KEY,
                                    id_utilisateur INT NOT NULL REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
                                    id_billet INT NOT NULL REFERENCES billets(id_billet) ON DELETE CASCADE,
                                    quantite INT NOT NULL DEFAULT 1 CHECK (quantite > 0),
                                    date_reservation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    date_utilisation DATE, -- Date d'utilisation prévue
                                    statut VARCHAR(20) DEFAULT 'réservé', -- 'réservé', 'payé', 'utilisé', 'annulé'
                                    prix_total NUMERIC(10,2) NOT NULL,
                                    transaction_id VARCHAR(100), -- ID de transaction paiement
                                    date_paiement TIMESTAMP
);

-- ============================================
-- TABLE : reservation_service
-- Réservations de services par les utilisateurs
-- ============================================
CREATE TABLE reservation_service (
                                    id_reservation_service SERIAL PRIMARY KEY,
                                    id_utilisateur INT NOT NULL REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
                                    id_service INT NOT NULL REFERENCES services(id_service) ON DELETE CASCADE,
                                    id_prestataire INT NOT NULL REFERENCES prestataire(id_prestataire) ON DELETE CASCADE,
                                    quantite INT NOT NULL DEFAULT 1 CHECK (quantite > 0),
                                    details JSONB DEFAULT '{}',
                                    prix_total NUMERIC(10,2),
                                    statut VARCHAR(20) DEFAULT 'réservé',
                                    transaction_id VARCHAR(100),
                                    date_reservation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    date_paiement TIMESTAMP
);

-- ============================================
-- TABLE : session_authentification
-- ============================================
CREATE TABLE session_authentification (
                                          id_session SERIAL PRIMARY KEY,
                                          id_utilisateur INT NOT NULL REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
                                          token VARCHAR(255) UNIQUE NOT NULL,
                                          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          date_expiration TIMESTAMP,
                                          actif BOOLEAN DEFAULT TRUE,
                                          ip_adresse VARCHAR(45),
                                          user_agent TEXT
);

-- ============================================
-- INDEX pour améliorer les performances
-- ============================================
CREATE INDEX idx_utilisateur_email ON utilisateurs(email);
CREATE INDEX idx_utilisateur_role ON utilisateurs(id_rôle);
CREATE INDEX idx_prestataire_nom ON prestataire(nom);
CREATE INDEX idx_prestataire_type ON prestataire(type_prestataire);
CREATE INDEX idx_services_prestataire ON services(id_prestataire);
CREATE INDEX idx_services_type ON services(id_type_service);
CREATE INDEX idx_programmation_scene ON programmation(id_scene);
CREATE INDEX idx_programmation_artiste ON programmation(id_artiste);
CREATE INDEX idx_programmation_date ON programmation(date_concert);
CREATE INDEX idx_avis_prestataire ON avis(id_prestataire);
CREATE INDEX idx_avis_note ON avis(note);
CREATE INDEX idx_emplacements_statut ON emplacements(statut);
CREATE INDEX idx_emplacements_zone ON emplacements(id_zone);
CREATE INDEX idx_reservation_utilisateur ON reservation_billet(id_utilisateur);
CREATE INDEX idx_reservation_statut ON reservation_billet(statut);
CREATE INDEX idx_session_token ON session_authentification(token);
CREATE INDEX idx_session_utilisateur ON session_authentification(id_utilisateur);

-- ============================================
-- INSERTION DES DONNÉES DE BASE
-- ============================================

-- Rôles
INSERT INTO rôles (nom_rôle, description) VALUES
                                              ('public', 'Utilisateur public du festival'),
                                              ('prestataire', 'Prestataire partenaire du festival'),
                                              ('organisateur', 'Organisateur/administrateur du festival');

-- Festival
INSERT INTO festival (nom, annee, date_debut, date_fin, lieu_nom, lieu_coordonnees, description_fr, description_en, presentation_fr, presentation_en, nombre_festivaliers, version, actif) VALUES
    ('Golden Coast Festival', 2026, '2026-08-28', '2026-08-30', 'Combe à la Serpent, Corcelles-lès-Monts', '47.305,4.964',
     'Le plus grand festival de rap français sur la Côte dorée. Trois jours d''exception où musique, culture urbaine et convivialité se rencontrent dans un cadre naturel unique.',
     'The biggest French rap festival on the Golden Coast. Three exceptional days where music, urban culture and conviviality meet in a unique natural setting.',
     '{
       "titre": "GOLDEN COAST<br>FESTIVAL",
       "date": "28 - 30 Août 2026",
       "lieu": "Combe à la Serpent, Corcelles-lès-Monts",
       "aboutCard1Titre": "🎤 Artistes",
       "aboutCard1Texte": "Plus de 40 artistes sur 3 scènes pendant 3 jours de festival.",
       "aboutCard2Titre": "🎶 Musique",
       "aboutCard2Texte": "Rap, Hip-Hop, R&B, Afrobeats et bien plus encore.",
       "aboutCard3Titre": "🌍 Communauté",
       "aboutCard3Texte": "52 000 festivaliers réunis pour célébrer la culture urbaine.",
       "desc1Titre": "L''expérience Golden Coast",
       "desc1Texte": "Le Golden Coast Festival est bien plus qu''un simple événement musical. C''est une immersion totale dans la culture urbaine française, au cœur d''un cadre naturel exceptionnel. Pendant trois jours, la Combe à la Serpent se transforme en un village éphémère où la musique, la gastronomie et l''art se rencontrent.",
       "desc1Chip1": "🎵 3 scènes",
       "desc1Chip2": "🍔 Village Food & Merch",
       "desc2Titre": "Un cadre naturel unique",
       "desc2Texte": "Niché au cœur de la forêt bourguignonne, le site de la Combe à la Serpent offre un écrin de verdure idéal pour profiter de la musique en plein air. Entre les arbres centenaires et les clairières naturelles, vivez une expérience festival inédite, loin du béton et du bitume.",
       "ctaTitre": "Prêt à vivre l''expérience ?",
       "ctaTexte": "Réserve ta place dès maintenant pour le Golden Coast Festival 2026.",
       "ctaBouton": "Réserver mes billets 🎫",
       "mapTitre": "📍 Où nous trouver",
       "mapIntro": "Le festival se déroule à la Combe à la Serpent, Corcelles-lès-Monts (21), à quelques minutes de Dijon.",
       "footerDescription": "Le plus grand festival de rap français sur la Côte dorée."
     }'::jsonb,
     '{
       "titre": "GOLDEN COAST<br>FESTIVAL",
       "date": "August 28 - 30, 2026",
       "lieu": "Combe à la Serpent, Corcelles-lès-Monts",
       "aboutCard1Titre": "🎤 Artists",
       "aboutCard1Texte": "More than 40 artists on 3 stages during 3 festival days.",
       "aboutCard2Titre": "🎶 Music",
       "aboutCard2Texte": "Rap, Hip-Hop, R&B, Afrobeats and much more.",
       "aboutCard3Titre": "🌍 Community",
       "aboutCard3Texte": "52,000 festival-goers united to celebrate urban culture.",
       "desc1Titre": "The Golden Coast Experience",
       "desc1Texte": "The Golden Coast Festival is much more than just a music event. It is a total immersion in French urban culture, in the heart of an exceptional natural setting. For three days, the Combe à la Serpent becomes an ephemeral village where music, gastronomy and art come together.",
       "desc1Chip1": "🎵 3 stages",
       "desc1Chip2": "🍔 Food & Merch Village",
       "desc2Titre": "A unique natural setting",
       "desc2Texte": "Nestled in the heart of the Burgundy forest, the Combe à la Serpent site offers an ideal green haven to enjoy outdoor music. Among centuries-old trees and natural clearings, experience a unique festival, far from concrete and asphalt.",
       "ctaTitre": "Ready for the experience?",
       "ctaTexte": "Book your spot now for the Golden Coast Festival 2026.",
       "ctaBouton": "Book my tickets 🎫",
       "mapTitre": "📍 Find us",
       "mapIntro": "The festival takes place at Combe à la Serpent, Corcelles-lès-Monts (21), just minutes from Dijon.",
       "footerDescription": "The biggest French rap festival on the Golden Coast."
     }'::jsonb,
     52000, 'V3', TRUE);

-- Zones (basées sur zones.json)
INSERT INTO zones (nom, type_zone, coordonnees, description) VALUES
                                                                 ('parking 1', 'parking', '["47.30253,4.96490", "47.30284,4.96638", "47.30176,4.96722", "47.30125,4.96614"]'::jsonb, 'Premier parking du festival'),
                                                                 ('parking 2', 'parking', '["47.30046,4.95943", "47.30010,4.96180", "47.30039,4.96235", "47.30073,4.96198", "47.30119,4.96315", "47.30183,4.96262"]'::jsonb, 'Deuxième parking du festival'),
                                                                 ('Zone VIP', 'VIP', '["47.30360,4.96338", "47.30388,4.96323", "47.30359,4.96234", "47.30328,4.96255"]'::jsonb, 'Zone VIP réservée'),
                                                                 ('camping', 'camping', '["47.30052,4.95927", "47.30113,4.95822", "47.30126,4.95739", "47.30139,4.95730", "47.30190,4.95873", "47.30219,4.95935", "47.30306,4.96050", "47.30182,4.96093", "47.30090,4.96013"]'::jsonb, 'Zone de camping'),
                                                                 ('Zone principale du festival', 'festival', '["47.30388,4.96323", "47.30359,4.96234", "47.30328,4.96255", "47.30360,4.96338", "47.30331,4.96351", "47.30280,4.96211", "47.30190,4.96259", "47.30234,4.96379", "47.30280,4.96549", "47.30316,4.96801", "47.30485,4.96726", "47.30548,4.96666", "47.30608,4.96523", "47.30533,4.96460", "47.30534,4.96445", "47.30442,4.96329"]'::jsonb, 'Zone principale du festival');

-- Scènes (basées sur zones.json et programmation.json)
INSERT INTO scenes (nom, coordonnees, description) VALUES
                                                       ('MOTHERSHIP', '["47.30258,4.96223", "47.30208,4.96250", "47.30217,4.96285", "47.30267,4.96258"]'::jsonb, 'Scène principale MOTHERSHIP'),
                                                       ('ZERO GRAVITY', '["47.30591,4.96562", "47.30573,4.96547", "47.30556,4.96589", "47.30572,4.96607"]'::jsonb, 'Scène ZERO GRAVITY'),
                                                       ('CARGO', '["47.30388,4.96324", "47.30371,4.96334", "47.30376,4.96350", "47.30393,4.96340"]'::jsonb, 'Scène CARGO'),
                                                       ('ANTDT CLUB', '["47.30444,4.96533", "47.30427,4.96552", "47.30415,4.96528", "47.30434,4.96506"]'::jsonb, 'Scène ANTDT CLUB');

-- Mise à jour des sponsors des scènes (après insertion des prestataires)
-- Cela sera fait après l'insertion des prestataires

-- Billets/Forfaits (basés sur forfaits.json)
INSERT INTO billets (type_billet, label_fr, label_en, prix, stock_disponible, stock_total, jours_associes, description) VALUES
                                                                                                                            ('oneDay', 'Forfait 1 jour', '1 Day Pass', 45.00, 60000, 120, '[{"label": "Vendredi", "stock": 40}, {"label": "Samedi", "stock": 40}, {"label": "Dimanche", "stock": 40}]'::jsonb, 'Forfait valable pour une journée'),
                                                                                                                            ('twoDays', 'Forfait 2 jours', '2 Days Pass', 80.00, 60000, 120, '[{"label": "Vendredi + Samedi", "stock": 40, "linkedDays": ["Vendredi", "Samedi"]}, {"label": "Samedi + Dimanche", "stock": 40, "linkedDays": ["Samedi", "Dimanche"]}, {"label": "Vendredi + Dimanche", "stock": 40, "linkedDays": ["Vendredi", "Dimanche"]}]'::jsonb, 'Forfait valable pour deux journées consécutives'),
                                                                                                                            ('threeDays', 'Pass 3 jours', '3 Days Pass', 110.00, 40000, 50, NULL, 'Pass complet pour les 3 jours du festival'),
                                                                                                                            ('parking', 'Place de parking', 'Parking Spot', 10.00, 10000, 200, NULL, 'Place de parking pour un véhicule'),
                                                                                                                            ('camping', 'Emplacement de camping', 'Camping Spot', 25.00, 1500, 150, NULL, 'Emplacement de camping pour tente');

-- ============================================
-- PRESTATAIRES (basés sur prestataires.json)
-- ============================================
INSERT INTO prestataire (nom, type_prestataire, description_fr, description_en, contact_email, contact_tel, site_web, photo_url) VALUES
                                                                                                                                     ('OTacos', 'Restauration', 'Enseigne française présente parmi les stands food & beverage du festival.', 'French brand present among the festival''s food & beverage stands.', 'contact@otacos.com', '+33 1 23 45 67 89', 'https://o-tacos.com', '/media/prestataires/otacos.png'),
                                                                                                                                     ('Free', 'Services', 'Opérateur télécom partenaire du festival pour la couverture réseau.', 'Telecom operator partner of the festival for network coverage.', 'partenariat@free.fr', '+33 1 98 76 54 32', 'https://free.fr', '/media/prestataires/free.png'),
                                                                                                                                     ('Allianz', 'Services', 'Partenaire prévention et sécurité du festival.', 'Prevention and safety partner of the festival.', 'contact@allianz.fr', '+33 1 45 67 89 10', 'https://allianz.fr', '/media/prestataires/alianz.png'),
                                                                                                                                     ('Poliakov', 'Boissons', 'Sponsor officiel du bar principal du Golden Coast.', 'Official sponsor of the Golden Coast main bar.', 'contact@poliakov.fr', '+33 1 56 98 45 32', 'https://poliakov.fr', '/media/prestataires/poliakov.png'),
                                                                                                                                     ('Jack Daniel''s', 'Boissons', 'Partenaire officiel du Golden Coast avec un bar éphémère.', 'Official partner of Golden Coast with a pop-up bar.', 'contact@jackdaniels.com', '+33 1 87 65 43 21', 'https://jackdaniels.com', '/media/prestataires/jackdaniels.png'),
                                                                                                                                     ('Red Bull', 'Boissons', 'Partenaire énergie et animation du festival.', 'Energy and entertainment partner of the festival.', 'info@redbull.com', '+43 1 87 65 90 12', 'https://redbull.com', '/media/prestataires/redbull.png'),
                                                                                                                                     ('Heetch', 'Mobilité', 'Service de VTC officiel offrant des trajets sécurisés pour les festivaliers.', 'Official ride-sharing service offering secure rides for festival-goers.', 'pro@heetch.com', '+33 1 70 95 25 25', 'https://heetch.com', '/media/prestataires/heetch.png'),
                                                                                                                                     ('Decathlon', 'Commerces & Équipements', 'Fournisseur officiel d''équipements et d''accessoires camping.', 'Official supplier of camping equipment and accessories.', 'event@decathlon.com', '+33 3 20 33 50 00', 'https://decathlon.fr', '/media/prestataires/decathlon.png'),
                                                                                                                                     ('Veolia', 'Services', 'Gestion de l''eau potable et du recyclage sur le site.', 'Management of drinking water and recycling on site.', 'contact.evenement@veolia.com', '+33 1 71 75 00 00', 'https://www.veolia.com', '/media/prestataires/veolia.png'),
                                                                                                                                     ('Securitas', 'Services', 'Agence sécurité, contrôle des accès et soutien aux équipes internes.', 'Security agency, access control and support for internal teams.', 'evenements@securitas.fr', '+33 1 49 92 12 34', 'https://www.securitas.fr', '/media/prestataires/securitas.png'),
                                                                                                                                     ('Deezer', 'Média & Animation', 'Partenaire média avec playlists exclusives Golden Coast.', 'Media partner with exclusive Golden Coast playlists.', 'events@deezer.com', '+46 8 578 479 00', 'https://Deezer.com', '/media/prestataires/deezer.png'),
                                                                                                                                     ('Happn', 'Média & Animation', 'Activation matchmaking & espace chill pour les festivaliers.', 'Matchmaking activation & chill space for festival-goers.', 'partners@happn.com', '+33 1 84 16 17 30', 'https://www.happn.com', '/media/prestataires/happn.png'),
                                                                                                                                     ('Jägermeister', 'Boissons', 'Bar partenaire Jägermeister', 'Jägermeister partner bar', 'contact@jagermeister.fr', '+49 531 56 00', 'https://jagermeister.com', '/media/prestataires/jager.png'),
                                                                                                                                     ('Ricard', 'Boissons', 'Bar partenaire Ricard', 'Ricard partner bar', 'contact@ricard.fr', '+33 4 91 29 20 00', 'https://ricard.com', '/media/prestataires/ricard.png'),
                                                                                                                                     ('JBL', 'Commerces & Équipements', 'Partenaire audio et équipement sonore', 'Audio and sound equipment partner', 'contact@jbl.com', '+1 818 894 8850', 'https://jbl.com', '/media/prestataires/jbl.png'),
                                                                                                                                     ('Pepsi', 'Boissons', 'Partenaire boissons rafraîchissantes', 'Refreshing drinks partner', 'contact@pepsi.fr', '+33 1 49 00 10 00', 'https://pepsi.com', '/media/prestataires/pepsi.png'),
                                                                                                                                     ('Lipton', 'Boissons', 'Partenaire boissons fraîches', 'Fresh drinks partner', 'contact@lipton.fr', '+33 1 40 13 21 00', 'https://lipton.com', '/media/prestataires/lipton.png'),
                                                                                                                                     ('Bagels & Co', 'Restauration', 'Stand de bagels et sandwichs', 'Bagels and sandwiches stand', 'contact@bagels.com', '+33 1 89 01 23 46', 'https://bagels-co.fr', '/media/prestataires/bagels.png'),
                                                                                                                                     ('Pizza Festival', 'Restauration', 'Stand de pizzas artisanales', 'Artisan pizza stand', 'contact@pizzafestival.fr', '+33 1 90 12 34 57', 'https://pizzafestival.fr', '/media/prestataires/pizza.png'),
                                                                                                                                     ('Ail et fines herbes', 'Restauration', 'Stand de cuisine aux herbes', 'Herbs cuisine stand', 'contact@ailetfinesherbes.fr', '+33 1 01 23 45 68', 'https://ailetfinesherbes.fr', '/media/prestataires/afh.png'),
                                                                                                                                     ('Nouilles Express', 'Restauration', 'Stand de nouilles asiatiques', 'Asian noodles stand', 'contact@nouilles.fr', '+33 1 12 34 56 79', 'https://nouilles-express.fr', '/media/prestataires/nouilles.png'),
                                                                                                                                     ('Coiffure Festival', 'Services / Bien-être', 'Stand de coiffure et coupe', 'Haircut and styling stand', 'contact@coiffure.fr', '+33 1 23 45 67 80', 'https://coiffure-festival.fr', '/media/prestataires/coiffure.png'),
                                                                                                                                     ('Merch Golden Coast', 'Merchandising', 'Boutique officielle du festival', 'Official festival store', 'merch@goldencoast.com', '+33 1 34 56 78 91', 'https://goldencoast.com/merch', '/media/prestataires/merch.png'),
                                                                                                                                     ('Arcade Zone', 'Divertissement', 'Borne d''arcade et jeux rétro', 'Arcade machines and retro games', 'contact@arcadezone.fr', '+33 1 45 67 89 02', 'https://arcadezone.fr', '/media/prestataires/arcade.png'),
                                                                                                                                     ('Basket 3x3', 'Sport / Animation', 'Terrain de basket 3x3', '3x3 basketball court', 'contact@basket3x3.fr', '+33 1 56 78 90 13', 'https://basket3x3.fr', '/media/prestataires/basket.png');

-- Mise à jour des sponsors des scènes (après insertion des prestataires)
UPDATE scenes SET id_prestataire_sponsor = (SELECT id_prestataire FROM prestataire WHERE nom = 'Deezer') WHERE nom = 'ZERO GRAVITY';
UPDATE scenes SET id_prestataire_sponsor = (SELECT id_prestataire FROM prestataire WHERE nom = 'JBL') WHERE nom = 'CARGO';
-- MOTHERSHIP par SNIPES (non présent dans prestataires, à ajouter si nécessaire)
-- ANTDT CLUB par ANTDT (non présent dans prestataires, à ajouter si nécessaire)

-- ============================================
-- TYPES DE SERVICE (prédéfinis)
-- ============================================
INSERT INTO type_service (nom, label_fr, label_en, description_fr, description_en, icone, champs_requis) VALUES
    ('reservation', 'Réservation', 'Reservation',
     'Service de réservation de créneaux ou places',
     'Slot or seat reservation service',
     '📅',
     '[{"key": "date", "label_fr": "Date", "label_en": "Date", "type": "date", "required": true}, {"key": "heure_debut", "label_fr": "Heure de début", "label_en": "Start time", "type": "time", "required": true}, {"key": "heure_fin", "label_fr": "Heure de fin", "label_en": "End time", "type": "time", "required": true}, {"key": "nombre_places", "label_fr": "Nombre de places", "label_en": "Number of seats", "type": "number", "required": true}, {"key": "lieu", "label_fr": "Lieu", "label_en": "Location", "type": "text", "required": false}]'::jsonb),
    ('commande', 'Commande', 'Order',
     'Service de commande de produits ou nourriture',
     'Product or food ordering service',
     '🛒',
     '[{"key": "quantite_min", "label_fr": "Quantité minimale", "label_en": "Minimum quantity", "type": "number", "required": false}, {"key": "quantite_max", "label_fr": "Quantité maximale", "label_en": "Maximum quantity", "type": "number", "required": false}, {"key": "delai_preparation", "label_fr": "Délai de préparation (min)", "label_en": "Preparation time (min)", "type": "number", "required": false}, {"key": "disponible", "label_fr": "Disponible", "label_en": "Available", "type": "boolean", "required": false}]'::jsonb),
    ('location', 'Location', 'Rental',
     'Service de location de matériel ou équipement',
     'Equipment or material rental service',
     '🔧',
     '[{"key": "duree_min", "label_fr": "Durée minimale (heures)", "label_en": "Minimum duration (hours)", "type": "number", "required": false}, {"key": "duree_max", "label_fr": "Durée maximale (heures)", "label_en": "Maximum duration (hours)", "type": "number", "required": false}, {"key": "caution", "label_fr": "Caution (€)", "label_en": "Deposit (€)", "type": "number", "required": false}, {"key": "disponible", "label_fr": "Disponible", "label_en": "Available", "type": "boolean", "required": false}]'::jsonb);

-- ============================================
-- SERVICES (basés sur prestataires.json)
-- ============================================
INSERT INTO services (id_prestataire, id_type_service, nom_service_fr, nom_service_en, description_fr, description_en, prix_estime, champs_specifiques) VALUES
                                                                                                                       (1, (SELECT id_type_service FROM type_service WHERE nom = 'commande'), 'Tacos & Burgers', 'Tacos & Burgers', 'Restauration rapide pour festivaliers', 'Fast food for festival-goers', 10.00, '{"delai_preparation": 10, "disponible": true}'::jsonb),
                                                                                                                       (2, NULL, 'Réseau 5G', '5G Network', 'Connexion mobile et Wi-Fi sur site', 'Mobile connection and on-site Wi-Fi', 0.00, '{"enabled": false}'::jsonb),
                                                                                                                       (3, NULL, 'Sécurité & prévention', 'Safety & prevention', 'Sensibilisation sécurité routière et alcool', 'Road safety and alcohol awareness', 0.00, '{"enabled": false}'::jsonb),
                                                                                                                       (4, (SELECT id_type_service FROM type_service WHERE nom = 'commande'), 'Bar principal', 'Main bar', 'Espace boisson et cocktails', 'Drinks and cocktails area', 12.00, '{"delai_preparation": 5, "disponible": true}'::jsonb),
                                                                                                                       (5, (SELECT id_type_service FROM type_service WHERE nom = 'commande'), 'Dégustation whisky', 'Whiskey tasting', 'Espace promotion Jack Daniel''s', 'Jack Daniel''s promotional space', 15.00, '{"disponible": true}'::jsonb),
                                                                                                                       (6, (SELECT id_type_service FROM type_service WHERE nom = 'commande'), 'Bar Red Bull', 'Red Bull Bar', 'Boissons énergisantes et espace détente', 'Energy drinks and relaxation area', 8.00, '{"delai_preparation": 3, "disponible": true}'::jsonb),
                                                                                                                       (7, NULL, 'Transport VTC', 'VTC transport', 'Navettes et trajets vers le festival', 'Shuttles and trips to the festival', 0.00, '{"enabled": false}'::jsonb),
                                                                                                                       (8, (SELECT id_type_service FROM type_service WHERE nom = 'location'), 'Location matériel sportif', 'Sports equipment rental', 'Location d''équipement sportif', 'Sports equipment rental', 5.00, '{"duree_min": 1, "duree_max": 8, "caution": 20, "disponible": true}'::jsonb),
                                                                                                                       (9, NULL, 'Gestion déchets', 'Waste management', 'Tri et recyclage des déchets', 'Waste sorting and recycling', 0.00, '{"enabled": false}'::jsonb),
                                                                                                                       (10, NULL, 'Service de sécurité', 'Security service', 'Surveillance et contrôle d''accès', 'Surveillance and access control', 0.00, '{"enabled": false}'::jsonb),
                                                                                                                       (11, NULL, 'Playlists officielles', 'Official playlists', 'Streaming musical du festival', 'Festival music streaming', 0.00, '{"enabled": false}'::jsonb),
                                                                                                                       (12, NULL, 'Animation réseau', 'Network animation', 'Rencontres entre festivaliers', 'Meetups between festival-goers', 0.00, '{"enabled": false}'::jsonb),
                                                                                                                       (13, (SELECT id_type_service FROM type_service WHERE nom = 'commande'), 'Bar Jägermeister', 'Jägermeister bar', 'Dégustation et cocktails', 'Tasting and cocktails', 10.00, '{"delai_preparation": 5, "disponible": true}'::jsonb),
                                                                                                                       (14, (SELECT id_type_service FROM type_service WHERE nom = 'commande'), 'Bar Ricard', 'Ricard bar', 'Pastis et cocktails anisés', 'Pastis and anise cocktails', 8.00, '{"delai_preparation": 5, "disponible": true}'::jsonb),
                                                                                                                       (15, NULL, 'Sonorisation', 'Sound system', 'Équipement audio premium', 'Premium audio equipment', 0.00, '{"enabled": false}'::jsonb),
                                                                                                                       (16, (SELECT id_type_service FROM type_service WHERE nom = 'commande'), 'Bar Pepsi', 'Pepsi bar', 'Boissons rafraîchissantes', 'Refreshing drinks', 5.00, '{"delai_preparation": 2, "disponible": true}'::jsonb),
                                                                                                                       (17, (SELECT id_type_service FROM type_service WHERE nom = 'commande'), 'Bar Lipton', 'Lipton bar', 'Thés glacés et boissons', 'Iced teas and drinks', 4.00, '{"delai_preparation": 2, "disponible": true}'::jsonb),
                                                                                                                       (18, (SELECT id_type_service FROM type_service WHERE nom = 'commande'), 'Bagels variés', 'Varied bagels', 'Sandwichs bagels garnis', 'Stuffed bagel sandwiches', 9.00, '{"delai_preparation": 8, "disponible": true}'::jsonb),
                                                                                                                       (19, (SELECT id_type_service FROM type_service WHERE nom = 'commande'), 'Pizzas artisanales', 'Artisan pizzas', 'Pizzas cuites au feu de bois', 'Wood-fired pizzas', 12.00, '{"delai_preparation": 15, "disponible": true}'::jsonb),
                                                                                                                       (20, (SELECT id_type_service FROM type_service WHERE nom = 'commande'), 'Plats aux herbes', 'Herb dishes', 'Cuisine gastronomique', 'Gourmet cuisine', 14.00, '{"delai_preparation": 12, "disponible": true}'::jsonb),
                                                                                                                       (21, (SELECT id_type_service FROM type_service WHERE nom = 'commande'), 'Nouilles asiatiques', 'Asian noodles', 'Woks et nouilles sautées', 'Woks and fried noodles', 11.00, '{"delai_preparation": 10, "disponible": true}'::jsonb),
                                                                                                                       (22, (SELECT id_type_service FROM type_service WHERE nom = 'reservation'), 'Coupe et coiffure', 'Haircut and styling', 'Service de coiffure express', 'Express hairdressing service', 20.00, '{"nombre_places": 2, "lieu": "Stand coiffure", "creneaux": [{"jour": "vendredi", "heure_debut": "15:00", "heure_fin": "16:00", "nombre_places": 2}, {"jour": "vendredi", "heure_debut": "16:00", "heure_fin": "17:00", "nombre_places": 2}, {"jour": "vendredi", "heure_debut": "17:00", "heure_fin": "18:00", "nombre_places": 2}, {"jour": "vendredi", "heure_debut": "18:00", "heure_fin": "19:00", "nombre_places": 2}, {"jour": "vendredi", "heure_debut": "19:00", "heure_fin": "20:00", "nombre_places": 2}, {"jour": "samedi", "heure_debut": "13:00", "heure_fin": "14:00", "nombre_places": 2}, {"jour": "samedi", "heure_debut": "14:00", "heure_fin": "15:00", "nombre_places": 2}, {"jour": "samedi", "heure_debut": "15:00", "heure_fin": "16:00", "nombre_places": 2}, {"jour": "samedi", "heure_debut": "16:00", "heure_fin": "17:00", "nombre_places": 2}, {"jour": "samedi", "heure_debut": "17:00", "heure_fin": "18:00", "nombre_places": 2}, {"jour": "samedi", "heure_debut": "18:00", "heure_fin": "19:00", "nombre_places": 2}, {"jour": "samedi", "heure_debut": "19:00", "heure_fin": "20:00", "nombre_places": 2}, {"jour": "dimanche", "heure_debut": "13:00", "heure_fin": "14:00", "nombre_places": 2}, {"jour": "dimanche", "heure_debut": "14:00", "heure_fin": "15:00", "nombre_places": 2}, {"jour": "dimanche", "heure_debut": "15:00", "heure_fin": "16:00", "nombre_places": 2}, {"jour": "dimanche", "heure_debut": "16:00", "heure_fin": "17:00", "nombre_places": 2}, {"jour": "dimanche", "heure_debut": "17:00", "heure_fin": "18:00", "nombre_places": 2}, {"jour": "dimanche", "heure_debut": "18:00", "heure_fin": "19:00", "nombre_places": 2}, {"jour": "dimanche", "heure_debut": "19:00", "heure_fin": "20:00", "nombre_places": 2}]}'::jsonb),
                                                                                                                       (23, (SELECT id_type_service FROM type_service WHERE nom = 'commande'), 'Merchandising officiel', 'Official merchandising', 'T-shirts, casquettes et goodies', 'T-shirts, caps and goodies', 25.00, '{"disponible": true}'::jsonb),
                                                                                                                       (24, (SELECT id_type_service FROM type_service WHERE nom = 'location'), 'Jeux d''arcade', 'Arcade games', 'Accès aux bornes d''arcade', 'Access to arcade machines', 2.00, '{"duree_min": 0.5, "duree_max": 2, "caution": 0, "disponible": true}'::jsonb),
                                                                                                                       (25, (SELECT id_type_service FROM type_service WHERE nom = 'reservation'), 'Match de basket', 'Basketball match', 'Tournoi et jeux libres', 'Tournament and free games', 0.00, '{"nombre_places": 10, "lieu": "Terrain basket 3x3", "creneaux": [{"jour": "vendredi", "heure_debut": "15:00", "heure_fin": "16:00", "nombre_places": 10}, {"jour": "vendredi", "heure_debut": "16:00", "heure_fin": "17:00", "nombre_places": 10}, {"jour": "vendredi", "heure_debut": "17:00", "heure_fin": "18:00", "nombre_places": 10}, {"jour": "vendredi", "heure_debut": "18:00", "heure_fin": "19:00", "nombre_places": 10}, {"jour": "samedi", "heure_debut": "13:00", "heure_fin": "14:00", "nombre_places": 10}, {"jour": "samedi", "heure_debut": "14:00", "heure_fin": "15:00", "nombre_places": 10}, {"jour": "samedi", "heure_debut": "15:00", "heure_fin": "16:00", "nombre_places": 10}, {"jour": "samedi", "heure_debut": "16:00", "heure_fin": "17:00", "nombre_places": 10}, {"jour": "samedi", "heure_debut": "17:00", "heure_fin": "18:00", "nombre_places": 10}, {"jour": "samedi", "heure_debut": "18:00", "heure_fin": "19:00", "nombre_places": 10}, {"jour": "dimanche", "heure_debut": "13:00", "heure_fin": "14:00", "nombre_places": 10}, {"jour": "dimanche", "heure_debut": "14:00", "heure_fin": "15:00", "nombre_places": 10}, {"jour": "dimanche", "heure_debut": "15:00", "heure_fin": "16:00", "nombre_places": 10}, {"jour": "dimanche", "heure_debut": "16:00", "heure_fin": "17:00", "nombre_places": 10}, {"jour": "dimanche", "heure_debut": "17:00", "heure_fin": "18:00", "nombre_places": 10}, {"jour": "dimanche", "heure_debut": "18:00", "heure_fin": "19:00", "nombre_places": 10}]}'::jsonb);

-- ============================================
-- ARTISTES (basés sur programmation.json et artistes existants)
-- ============================================
INSERT INTO artiste (nom, style_musique, description, pays_origine, photo_url, cachet, lien_deezer) VALUES
                                                                                                        ('JOLAGREEN23', 'Rap Français / Trap', 'Artiste émergent du rap français', 'France', 'jolagreen23.jpg', 15000.00, NULL),
                                                                                                        ('JOK''AIR', 'Rap Français / R&B', 'Artiste confirmé du rap français', 'France', 'jokair.jpg', 25000.00, NULL),
                                                                                                        ('SCH', 'Rap Français / Trap', 'Artiste majeur programmé au Golden Coast 2024.', 'France', 'sch.jpg', 50000.00, 'https://www.deezer.com/fr/artist/162665'),
                                                                                                        ('IAM', 'Hip-hop Old School / Rap Français', 'Légende du hip-hop français', 'France', 'iam.jpg', 60000.00, NULL),
                                                                                                        ('HAMZA', 'Rap / Trap / Pop-rap', 'Artiste belge du rap', 'Belgique', 'hamza.jpg', 45000.00, NULL),
                                                                                                        ('Sonny Rave', 'R&B / Soul', 'Artiste R&B émergent', 'France', 'sonnyrave.jpg', 12000.00, NULL),
                                                                                                        ('KEBLACK', 'R&B / Rap Français / Afrobeat', 'Artiste franco-ivoirien', 'France', 'keblack.jpg', 30000.00, NULL),
                                                                                                        ('ALONZO', 'Rap Français', 'Artiste marseillais du rap français', 'France', 'alonzo.jpg', 35000.00, NULL),
                                                                                                        ('FRANGLISH', 'R&B / Rap Français', 'Duo R&B français', 'France', 'franglish.jpg', 28000.00, NULL),
                                                                                                        ('ZAMDANE', 'Rap / Trap', 'Artiste trap français', 'France', 'zamdane.jpg', 22000.00, NULL),
                                                                                                        ('GREEN MONTANA', 'Rap Français / Cloud Rap', 'Artiste cloud rap', 'France', 'greenmontana.jpg', 18000.00, NULL),
                                                                                                        ('OBOY', 'Rap / Trap', 'Artiste trap français', 'France', 'oboy.jpg', 40000.00, NULL),
                                                                                                        ('NAOHS', 'Rap / R&B', 'Artiste R&B émergent', 'France', 'naohs.jpg', 15000.00, NULL),
                                                                                                        ('SWAAYVE', 'Hip-hop / Cloud Rap', 'Artiste cloud rap', 'France', 'swaayve.jpg', 16000.00, NULL),
                                                                                                        ('DENDEN', 'Rap / Trap', 'Artiste trap français', 'France', 'denden.jpg', 14000.00, NULL),
                                                                                                        ('ARMA JACKSON', 'Rap Français', 'Artiste rap français', 'France', 'armajackson.jpg', 17000.00, NULL),
                                                                                                        ('WALLACE CLEAVER', 'Rap / Underground', 'Artiste underground', 'France', 'wallacecleaver.jpg', 13000.00, NULL),
                                                                                                        ('1PLIKÉ140', 'Drill / Rap Français', 'Artiste drill français', 'France', '1plike140.jpg', 20000.00, NULL),
                                                                                                        ('JRK 19', 'Rap Français', 'Artiste rap français', 'France', 'jrk19.jpg', 15000.00, NULL),
                                                                                                        ('KEEQAID', 'Rap / Trap', 'Artiste trap français', 'France', 'keeqaid.jpg', 16000.00, NULL),
                                                                                                        ('YORSSY', 'Rap / R&B', 'Artiste R&B émergent', 'France', 'yorssy.jpg', 14000.00, NULL),
                                                                                                        ('SHEIK LE FABULEUX', 'Rap / Humour', 'Artiste humoristique', 'France', 'sheik.jpg', 10000.00, NULL),
                                                                                                        ('SWAVE', 'Hip-hop / Cloud Rap', 'Artiste cloud rap', 'France', 'swave.jpg', 18000.00, NULL),
                                                                                                        ('ANDY4000', 'DJ / Electro Rap', 'DJ et producteur', 'France', 'andy4000.jpg', 12000.00, NULL),
                                                                                                        ('SIXTION', 'Rap alternatif / Trap', 'Artiste rap alternatif', 'France', 'sixtion.jpg', 19000.00, NULL),
                                                                                                        ('URUMI', 'Rap / R&B', 'Artiste R&B émergent', 'France', 'urumi.jpg', 15000.00, NULL),
                                                                                                        ('Booba', 'Rap français', 'Légende du rap hexagonal, tête d''affiche du Golden Coast 2024.', 'France', 'booba.jpg', 60000.00, 'https://www.deezer.com/fr/artist/390'),
                                                                                                        ('SDM', 'Rap français', 'Nouvelle génération, présent au Golden Coast 2024.', 'France', 'sdm.jpg', 30000.00, 'https://www.deezer.com/fr/artist/604107'),
                                                                                                        ('Josman', 'Rap français', 'Confirmé pour la programmation du Golden Coast.', 'France', 'josman.jpg', 25000.00, 'https://www.deezer.com/fr/artist/7365500'),
                                                                                                        ('Ninho', 'Rap français', 'Figure du rap français, annoncé au Golden Coast 2024.', 'France', 'ninho.jpg', 55000.00, 'https://www.deezer.com/fr/artist/5542343'),
                                                                                                        ('Gims', 'Pop / Rap français', 'Artiste programmé à l''édition 2025 du Golden Coast.', 'France', 'gims.jpg', 65000.00, 'https://www.deezer.com/fr/artist/4429712');

-- ============================================
-- PROGRAMMATION (basée sur programmation.json)
-- Dates: VEN 05/09 = 2026-09-05, SAM 06/09 = 2026-09-06, DIM 07/09 = 2026-09-07
-- Note: Les dates dans festival.json indiquent 28-30 août 2026, donc on ajuste
-- ============================================
-- Vendredi 28 août 2026 - MOTHERSHIP
INSERT INTO programmation (id_scene, id_artiste, date_concert, heure_debut, heure_fin, style_musique, ordre_passage) VALUES
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'JOLAGREEN23'), '2026-08-28', '17:40', '18:25', 'Rap Français / Trap', 1),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'JOK''AIR'), '2026-08-28', '19:10', '20:00', 'Rap Français / R&B', 2),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'SCH'), '2026-08-28', '20:40', '21:40', 'Rap Français / Trap', 3),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'IAM'), '2026-08-28', '22:30', '23:30', 'Hip-hop Old School / Rap Français', 4),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'HAMZA'), '2026-08-28', '00:30', '01:30', 'Rap / Trap / Pop-rap', 5);

-- Vendredi 28 août 2026 - ZERO GRAVITY
INSERT INTO programmation (id_scene, id_artiste, date_concert, heure_debut, heure_fin, style_musique, ordre_passage) VALUES
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'Sonny Rave'), '2026-08-28', '17:00', '17:40', 'R&B / Soul', 1),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'KEBLACK'), '2026-08-28', '18:20', '19:10', 'R&B / Rap Français / Afrobeat', 2),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'ALONZO'), '2026-08-28', '19:40', '20:40', 'Rap Français', 3),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'FRANGLISH'), '2026-08-28', '21:10', '22:00', 'R&B / Rap Français', 4),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'ZAMDANE'), '2026-08-28', '22:30', '23:15', 'Rap / Trap', 5),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'GREEN MONTANA'), '2026-08-28', '23:40', '00:30', 'Rap Français / Cloud Rap', 6),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'OBOY'), '2026-08-28', '01:30', '02:20', 'Rap / Trap', 7);

-- Vendredi 28 août 2026 - CARGO
INSERT INTO programmation (id_scene, id_artiste, date_concert, heure_debut, heure_fin, style_musique, ordre_passage) VALUES
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'NAOHS'), '2026-08-28', '15:50', '16:20', 'Rap / R&B', 1),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'SWAAYVE'), '2026-08-28', '16:40', '17:10', 'Hip-hop / Cloud Rap', 2),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'DENDEN'), '2026-08-28', '17:30', '18:00', 'Rap / Trap', 3),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'ARMA JACKSON'), '2026-08-28', '18:30', '19:10', 'Rap Français', 4),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'WALLACE CLEAVER'), '2026-08-28', '19:50', '20:35', 'Rap / Underground', 5),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = '1PLIKÉ140'), '2026-08-28', '21:30', '22:15', 'Drill / Rap Français', 6),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'JRK 19'), '2026-08-28', '22:40', '23:20', 'Rap Français', 7),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'KEEQAID'), '2026-08-28', '23:50', '00:30', 'Rap / Trap', 8),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'YORSSY'), '2026-08-28', '01:35', '02:20', 'Rap / R&B', 9);

-- Vendredi 28 août 2026 - ANTDT CLUB
INSERT INTO programmation (id_scene, id_artiste, date_concert, heure_debut, heure_fin, style_musique, ordre_passage) VALUES
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'SHEIK LE FABULEUX'), '2026-08-28', '18:30', '19:20', 'Rap / Humour', 1),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'SWAVE'), '2026-08-28', '19:30', '21:00', 'Hip-hop / Cloud Rap', 2),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'ANDY4000'), '2026-08-28', '21:00', '22:30', 'DJ / Electro Rap', 3),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'SIXTION'), '2026-08-28', '22:30', '01:00', 'Rap alternatif / Trap', 4),
                                                                                                                         ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'URUMI'), '2026-08-28', '01:00', '02:30', 'Rap / R&B', 5);


-- ============================================
-- ARTISTES SUPPLÉMENTAIRES pour Samedi et Dimanche
-- ============================================
INSERT INTO artiste (nom, style_musique, description, pays_origine, photo_url, cachet, lien_deezer) VALUES
  ('LAYLOW', 'Rap / Trap atmosphérique', 'Artiste visionnaire du rap français, connu pour son univers unique.', 'France', 'laylow.jpg', 40000.00, NULL),
  ('DAMSO', 'Rap / R&B', 'Rappeur belge aux textes introspectifs.', 'Belgique', 'damso.jpg', 55000.00, NULL),
  ('PLK', 'Rap Français', 'Rappeur français en pleine ascension.', 'France', 'plk.jpg', 35000.00, NULL),
  ('GAZO', 'Drill / Rap Français', 'Pionnier de la drill française.', 'France', 'gazo.jpg', 40000.00, NULL),
  ('TIAKOLA', 'Afrobeat / R&B', 'Artiste afro-pop en vogue.', 'France', 'tiakola.jpg', 30000.00, NULL),
  ('WERENOI', 'Rap Français / Trap', 'Rappeur montant de la scène française.', 'France', 'werenoi.jpg', 28000.00, NULL),
  ('ZIAK', 'Drill / Rap', 'Artiste drill à l''identité sonore marquée.', 'France', 'ziak.jpg', 32000.00, NULL),
  ('NISKA', 'Rap / Afrotrap', 'Créateur de l''Afrotrap, artiste majeur.', 'France', 'niska.jpg', 45000.00, NULL),
  ('DINOS', 'Rap Français / Lyrical', 'Rappeur à textes reconnu.', 'France', 'dinos.jpg', 30000.00, NULL),
  ('LUIDJI', 'R&B / Soul', 'Artiste R&B et soul français.', 'France', 'luidji.jpg', 22000.00, NULL),
  ('RIMK', 'Rap Français', 'Vétéran du rap français, membre du 113.', 'France', 'rimk.jpg', 35000.00, NULL),
  ('LETO', 'Rap Français / Trap', 'Rappeur du PSO Thug.', 'France', 'leto.jpg', 25000.00, NULL),
  ('DA UZI', 'Rap / Trap', 'Rappeur trap français.', 'France', 'dauzi.jpg', 22000.00, NULL),
  ('BENJAMIN EPPS', 'Rap / Underground', 'Rappeur underground prometteur.', 'France', 'benjaminepps.jpg', 18000.00, NULL),
  ('SOPICO', 'Rap / Expérimental', 'Artiste expérimental et créatif.', 'France', 'sopico.jpg', 16000.00, NULL),
  ('TSEW THE KID', 'R&B / Rap', 'Artiste R&B français.', 'France', 'tsewthekid.jpg', 15000.00, NULL),
  ('NEGRITO', 'Rap / Afrobeat', 'Artiste mêlant rap et afrobeat.', 'France', 'negrito.jpg', 14000.00, NULL),
  ('SAF', 'DJ / Electro', 'DJ et producteur reconnu.', 'France', 'saf.jpg', 12000.00, NULL),
  ('ROUNHAA', 'Rap / Melodic Trap', 'Artiste trap mélodique émergent.', 'France', 'rounhaa.jpg', 13000.00, NULL),
  ('FAVÉ', 'Rap / R&B', 'Artiste rap R&B en plein essor.', 'France', 'fave.jpg', 20000.00, NULL),
  -- Nouveaux artistes pour les jours 2 et 3
  ('GENEZIO', 'Rap / Trap', 'Artiste rap / trap programmé au Golden Coast.', 'France', 'genezio.jpg', 20000.00, NULL),
  ('OXMO PUCCINO', 'Rap Poétique / Français', 'Légende du rap poétique français.', 'France', 'oxmo_puccino.jpg', 45000.00, NULL),
  ('RILÈS', 'Rap Français / Pop', 'Artiste mêlant rap et pop.', 'France', 'riles.jpg', 30000.00, NULL),
  ('TAYC', 'R&B / Afrobeat', 'Chanteur R&B / Afrobeat.', 'France', 'tayc.jpg', 32000.00, NULL),
  ('ELGRANDE TOTO', 'Rap / Trap', 'Artiste rap / trap.', 'Maroc', 'elgrandetoto.jpg', 30000.00, NULL),
  ('MC SOLAAR', 'Hip-hop / Rap Français', 'Pionnier du rap français.', 'France', 'mcsolaar.jpg', 50000.00, NULL),
  ('KAARIS', 'Rap / Trap', 'Rappeur français emblématique.', 'France', 'kaaris.jpg', 40000.00, NULL),
  ('BIGFLO & OLI', 'Rap Français / Pop', 'Duo de rap français populaire.', 'France', 'bigflo_oli.jpg', 45000.00, NULL),
  ('NINHO & NISKA', 'Rap Français', 'Show commun de Ninho et Niska.', 'France', 'ninho_niska.jpg', 70000.00, NULL),
  ('AMK', 'Rap / R&B', 'Artiste rap / R&B.', 'France', 'amk.jpg', 15000.00, NULL),
  ('ADÈLE CASTILLON', 'Pop / R&B', 'Chanteuse pop / R&B.', 'France', 'adele_castillon.jpg', 18000.00, NULL),
  ('L2B', 'Rap Français', 'Artiste rap français.', 'France', 'l2b.jpg', 15000.00, NULL),
  ('HIGH & FINES HERBES', 'Rap Alternatif', 'Collectif rap alternatif.', 'France', 'high_fines_herbes.jpg', 22000.00, NULL),
  ('LA MANO 1.9', 'Rap Français / Trap', 'Groupe rap français.', 'France', 'lamano19.jpg', 20000.00, NULL),
  ('TIF', 'Rap / Trap', 'Artiste rap / trap.', 'France', 'tif.jpg', 18000.00, NULL),
  ('THEODORA', 'R&B / Pop', 'Chanteuse R&B / pop.', 'France', 'theodora.jpg', 16000.00, NULL),
  ('KORE', 'Rap / Trap', 'Producteur / DJ rap / trap.', 'France', 'kore.jpg', 25000.00, NULL),
  ('ILIANA', 'R&B / Pop', 'Chanteuse R&B / pop.', 'France', 'iliana.jpg', 14000.00, NULL),
  ('ZERATHEKIDD', 'Rap / Trap', 'Artiste rap / trap.', 'France', 'zerathekidd.jpg', 15000.00, NULL),
  ('THÉA', 'Pop / R&B', 'Chanteuse pop / R&B.', 'France', 'thea.jpg', 14000.00, NULL),
  ('LE JUIICE', 'Rap Français', 'Rappeuse française.', 'France', 'lejuiice.jpg', 16000.00, NULL),
  ('KHTEK', 'Rap Français', 'Rappeur français.', 'France', 'khtek.jpg', 15000.00, NULL),
  ('TAGNE', 'Rap / Trap', 'Artiste rap / trap.', 'France', 'tagne.jpg', 15000.00, NULL),
  ('ASININE', 'Rap Français', 'Artiste rap français.', 'France', 'asinine.jpg', 14000.00, NULL),
  ('VEN1', 'Rap / Trap', 'Artiste rap / trap.', 'France', 'ven1.jpg', 15000.00, NULL),
  ('DINA AYADA', 'R&B / Pop', 'Chanteuse R&B / pop.', 'France', 'dina_ayada.jpg', 16000.00, NULL),
  ('NONO LA GRINTA', 'Rap / Trap', 'Artiste rap / trap.', 'France', 'nono_lagrinta.jpg', 15000.00, NULL),
  ('TH', 'Rap / Trap', 'Artiste rap / trap.', 'France', 'th.jpg', 15000.00, NULL),
  ('DARLEAN', 'Rap / Hip-hop', 'Artiste rap / hip-hop.', 'France', 'darlean.jpg', 14000.00, NULL),
  ('DJ ELFIGO', 'DJ / Electro Rap', 'DJ electro rap.', 'France', 'dj_elfigo.jpg', 13000.00, NULL),
  ('TIGARAH', 'R&B / Pop', 'Artiste R&B / pop.', 'France', 'tigarah.jpg', 14000.00, NULL),
  ('NAOMI', 'R&B / Pop', 'Chanteuse R&B / pop.', 'France', 'naomi.jpg', 14000.00, NULL),
  ('LIL ROSY & ZEPEQUENAI', 'Rap / Trap', 'Duo rap / trap.', 'France', 'lilrosy_zepequenai.jpg', 15000.00, NULL),
  ('MARABOUTAGE', 'Rap / Trap', 'Collectif rap / trap.', 'France', 'maraboutage.jpg', 16000.00, NULL),
  ('DANYL', 'Rap Français / R&B', 'Artiste rap / R&B.', 'France', 'danyl.jpg', 15000.00, NULL),
  ('LACRIM', 'Rap Français', 'Rappeur français.', 'France', 'lacrim.jpg', 35000.00, NULL),
  ('LA FOUINE', 'Rap Français', 'Rappeur français emblématique.', 'France', 'lafouine.jpg', 35000.00, NULL),
  ('VALD PANDEMONIUM RELOADED', 'Rap Français / Trap', 'Show spécial de Vald.', 'France', 'vald_pandemonium.jpg', 45000.00, NULL),
  ('SHAO', 'Rap / R&B', 'Artiste rap / R&B.', 'France', 'shao.jpg', 14000.00, NULL),
  ('GARÇON PRINTEMPS', 'Pop / Rap', 'Artiste pop / rap.', 'France', 'garcon_printemps.jpg', 14000.00, NULL),
  ('TRIPTIK', 'Rap / Trap', 'Artiste rap / trap.', 'France', 'triptik.jpg', 15000.00, NULL),
  ('JUSTE SHANI', 'R&B / Pop', 'Chanteuse R&B / pop.', 'France', 'juste_shani.jpg', 15000.00, NULL),
  ('MAIRO', 'Rap / Trap', 'Artiste rap / trap.', 'France', 'mairo.jpg', 15000.00, NULL),
  ('H JEUNECRACK', 'Rap / Trap', 'Rappeur français.', 'France', 'h_jeunecrack.jpg', 15000.00, NULL),
  ('DALÍ', 'Rap Français / Trap', 'Artiste rap / trap.', 'France', 'dali.jpg', 15000.00, NULL),
  ('THEODORT', 'Rap Français / Trap', 'Rappeur / youtubeur français.', 'France', 'theodort.jpg', 20000.00, NULL),
  ('YANISS', 'Reggae / Rap', 'Artiste reggae / rap.', 'France', 'yaniss.jpg', 15000.00, NULL),
  ('BLANKKA CLUB', 'DJ / Rap', 'Collectif DJ / rap.', 'France', 'blankka_club.jpg', 14000.00, NULL),
  ('TODIEFOR', 'DJ / Rap', 'DJ rap / electro.', 'France', 'todiefor.jpg', 15000.00, NULL),
  ('MATOU', 'DJ / Rap', 'DJ rap.', 'France', 'matou.jpg', 14000.00, NULL),
  ('LORKESTRA', 'DJ / Rap', 'Collectif DJ / rap.', 'France', 'lorkestra.jpg', 15000.00, NULL),
  ('MARA', 'Rap / Trap', 'Artiste rap / trap.', 'France', 'mara.jpg', 15000.00, NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- Samedi 29 août 2026 - programmation mise à jour
-- ============================================
-- MOTHERSHIP
INSERT INTO programmation (id_scene, id_artiste, date_concert, heure_debut, heure_fin, style_musique, ordre_passage) VALUES
  ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'GENEZIO'), '2026-08-29', '15:10', '15:50', 'Rap / Trap', 1),
  ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'OXMO PUCCINO'), '2026-08-29', '16:15', '17:05', 'Rap Poétique / Français', 2),
  ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'RIMK'), '2026-08-29', '17:45', '18:35', 'Rap Français / Trap', 3),
  ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'RILÈS'), '2026-08-29', '19:10', '20:00', 'Rap Français / Pop', 4),
  ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'TAYC'), '2026-08-29', '20:50', '21:40', 'R&B / Afrobeat', 5),
  ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'Gims'), '2026-08-29', '22:20', '23:30', 'Rap / Pop', 6),
  ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'GAZO'), '2026-08-29', '00:10', '01:20', 'Rap / Drill', 7);

-- ZERO GRAVITY
INSERT INTO programmation (id_scene, id_artiste, date_concert, heure_debut, heure_fin, style_musique, ordre_passage) VALUES
  ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'AMK'), '2026-08-29', '14:30', '15:10', 'Rap / R&B', 1),
  ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'ADÈLE CASTILLON'), '2026-08-29', '15:40', '16:25', 'Pop / R&B', 2),
  ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'L2B'), '2026-08-29', '17:00', '17:50', 'Rap Français', 3),
  ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'HIGH & FINES HERBES'), '2026-08-29', '18:30', '19:30', 'Rap Alternatif', 4),
  ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'LA MANO 1.9'), '2026-08-29', '20:10', '21:00', 'Rap Français / Trap', 5),
  ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'TIF'), '2026-08-29', '21:40', '22:30', 'Rap / Trap', 6),
  ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'THEODORA'), '2026-08-29', '23:30', '00:20', 'R&B / Pop', 7),
  ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'KORE'), '2026-08-29', '01:20', '02:20', 'Rap / Trap', 8);

-- CARGO
INSERT INTO programmation (id_scene, id_artiste, date_concert, heure_debut, heure_fin, style_musique, ordre_passage) VALUES
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'ILIANA'), '2026-08-29', '13:40', '14:10', 'R&B / Pop', 1),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'ZERATHEKIDD'), '2026-08-29', '14:30', '15:10', 'Rap / Trap', 2),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'THÉA'), '2026-08-29', '15:30', '16:10', 'Pop / R&B', 3),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'LE JUIICE'), '2026-08-29', '16:35', '17:15', 'Rap Français', 4),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'KHTEK'), '2026-08-29', '17:40', '18:15', 'Rap Français', 5),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'TAGNE'), '2026-08-29', '18:15', '18:50', 'Rap / Trap', 6),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'ASININE'), '2026-08-29', '19:20', '20:00', 'Rap Français', 7),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'VEN1'), '2026-08-29', '20:30', '21:10', 'Rap / Trap', 8),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'DINA AYADA'), '2026-08-29', '21:40', '22:20', 'R&B / Pop', 9),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'NONO LA GRINTA'), '2026-08-29', '23:30', '00:10', 'Rap / Trap', 10),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'TH'), '2026-08-29', '01:20', '02:10', 'Rap / Trap', 11);

-- ANTDT CLUB
INSERT INTO programmation (id_scene, id_artiste, date_concert, heure_debut, heure_fin, style_musique, ordre_passage) VALUES
  ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'DARLEAN'), '2026-08-29', '15:30', '16:50', 'Rap / Hip-hop', 1),
  ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'DJ ELFIGO'), '2026-08-29', '17:00', '18:30', 'DJ / Electro Rap', 2),
  ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'TIGARAH'), '2026-08-29', '18:30', '20:00', 'R&B / Pop', 3),
  ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'NAOMI'), '2026-08-29', '20:00', '22:00', 'R&B / Pop', 4),
  ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'LIL ROSY & ZEPEQUENAI'), '2026-08-29', '22:00', '00:00', 'Rap / Trap', 5),
  ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'MARABOUTAGE'), '2026-08-29', '00:00', '02:30', 'Rap / Trap', 6);

-- ============================================
-- Dimanche 30 août 2026 - programmation mise à jour
-- ============================================
-- MOTHERSHIP
INSERT INTO programmation (id_scene, id_artiste, date_concert, heure_debut, heure_fin, style_musique, ordre_passage) VALUES
  ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'ELGRANDE TOTO'), '2026-08-30', '14:40', '15:25', 'Rap / Trap', 1),
  ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'MC SOLAAR'), '2026-08-30', '16:10', '17:10', 'Hip-hop / Rap Français', 2),
  ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'KAARIS'), '2026-08-30', '17:50', '18:50', 'Rap / Trap', 3),
  ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'BIGFLO & OLI'), '2026-08-30', '19:40', '20:40', 'Rap Français / Pop', 4),
  ((SELECT id_scene FROM scenes WHERE nom = 'MOTHERSHIP'), (SELECT id_artiste FROM artiste WHERE nom = 'NINHO & NISKA'), '2026-08-30', '21:30', '22:40', 'Rap Français', 5);

-- ZERO GRAVITY
INSERT INTO programmation (id_scene, id_artiste, date_concert, heure_debut, heure_fin, style_musique, ordre_passage) VALUES
  ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'DANYL'), '2026-08-30', '14:00', '14:40', 'Rap Français / R&B', 1),
  ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'ZIAK'), '2026-08-30', '15:25', '16:15', 'Rap / Trap', 2),
  ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'LACRIM'), '2026-08-30', '17:00', '17:50', 'Rap Français', 3),
  ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'LA FOUINE'), '2026-08-30', '18:50', '19:40', 'Rap Français', 4),
  ((SELECT id_scene FROM scenes WHERE nom = 'ZERO GRAVITY'), (SELECT id_artiste FROM artiste WHERE nom = 'VALD PANDEMONIUM RELOADED'), '2026-08-30', '20:10', '21:40', 'Rap Français / Trap', 5);

-- CARGO
INSERT INTO programmation (id_scene, id_artiste, date_concert, heure_debut, heure_fin, style_musique, ordre_passage) VALUES
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'SHAO'), '2026-08-30', '13:30', '14:00', 'Rap / R&B', 1),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'GARÇON PRINTEMPS'), '2026-08-30', '14:10', '14:40', 'Pop / Rap', 2),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'TRIPTIK'), '2026-08-30', '14:45', '15:30', 'Rap / Trap', 3),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'JUSTE SHANI'), '2026-08-30', '16:00', '16:40', 'R&B / Pop', 4),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'MAIRO'), '2026-08-30', '17:00', '17:40', 'Rap / Trap', 5),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'H JEUNECRACK'), '2026-08-30', '18:10', '18:50', 'Rap / Trap', 6),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'DALÍ'), '2026-08-30', '19:25', '20:10', 'Rap Français / Trap', 7),
  ((SELECT id_scene FROM scenes WHERE nom = 'CARGO'), (SELECT id_artiste FROM artiste WHERE nom = 'THEODORT'), '2026-08-30', '20:40', '21:30', 'Rap Français / Trap', 8);

-- ANTDT CLUB
INSERT INTO programmation (id_scene, id_artiste, date_concert, heure_debut, heure_fin, style_musique, ordre_passage) VALUES
  ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'YANISS'), '2026-08-30', '15:30', '16:30', 'Reggae / Rap', 1),
  ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'BLANKKA CLUB'), '2026-08-30', '16:30', '18:00', 'DJ / Rap', 2),
  ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'TODIEFOR'), '2026-08-30', '18:00', '19:15', 'DJ / Rap', 3),
  ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'MATOU'), '2026-08-30', '19:15', '20:30', 'DJ / Rap', 4),
  ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'LORKESTRA'), '2026-08-30', '20:30', '22:00', 'DJ / Rap', 5),
  ((SELECT id_scene FROM scenes WHERE nom = 'ANTDT CLUB'), (SELECT id_artiste FROM artiste WHERE nom = 'MARA'), '2026-08-30', '22:00', '23:15', 'Rap / Trap', 6);

-- ============================================
-- EMPLACEMENTS (basés sur emplacements.json avec nouveaux champs)
-- ============================================
INSERT INTO emplacements (nom_emplacement, coord_x, coord_y, coordonnees_completes, id_zone, statut, moyens_logistiques, surface_volume, nombre_prises, acces_eau, description) VALUES
  ('Stand OTacos - Zone Restauration', 4.96457, 47.30532, '47.30532,4.96457', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'pris', 'Électricité 220V, Wi-Fi, Éclairage LED', '45 m²', 4, TRUE, 'Emplacement idéal pour restauration rapide avec accès eau et électricité'),
  ('Bar Red Bull - Zone Animation', 4.96433, 47.30519, '47.30519,4.96433', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'pris', 'Électricité 220V, Sonorisation, Éclairage', '60 m²', 6, TRUE, 'Espace bar avec zone détente et animations'),
  ('Bar Poliakov - Zone Principale', 4.96423, 47.30508, '47.30508,4.96423', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'pris', 'Électricité 220V, Réfrigération, Éclairage', '50 m²', 5, TRUE, 'Bar principal avec espace service complet'),
  ('Stand Decathlon - Zone Équipements', 4.96413, 47.30501, '47.30501,4.96413', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'pris', 'Électricité 220V, Wi-Fi, Éclairage', '80 m²', 3, FALSE, 'Espace de vente et location d''équipements sportifs'),
  (NULL, 4.96406, 47.30495, '47.30495,4.96406', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'en_attente', NULL, NULL, NULL, FALSE, NULL),
  ('Espace Deezer - Zone Média', 4.96492, 47.30269, '47.30269,4.96492', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'pris', 'Électricité 220V, Wi-Fi haut débit, Sonorisation', '40 m²', 8, FALSE, 'Espace streaming et playlists avec zone d''écoute'),
  ('Boutique Officielle - Zone Merch', 4.96441, 47.30400, '47.30400,4.96441', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'pris', 'Électricité 220V, Éclairage, Caisse enregistreuse', '70 m²', 2, FALSE, 'Boutique de merchandising officiel du festival'),
  ('Stand Pizza - Zone Restauration', 4.96394, 47.30486, '47.30486,4.96394', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'pris', 'Électricité 220V, Four à bois, Éclairage', '55 m²', 3, TRUE, 'Stand de pizzas artisanales avec four à bois'),
  ('Zone JBL - Sonorisation', 4.96521, 47.30278, '47.30278,4.96521', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'pris', 'Électricité 220V, Sonorisation professionnelle, Éclairage', '35 m²', 10, FALSE, 'Espace démonstration audio avec équipement JBL'),
  (NULL, 4.96460, 47.30411, '47.30411,4.96460', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'en_attente', NULL, NULL, NULL, FALSE, NULL),
  (NULL, 4.96382, 47.30477, '47.30477,4.96382', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'libre', NULL, NULL, NULL, FALSE, NULL),
  (NULL, 4.96373, 47.30469, '47.30469,4.96373', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'libre', NULL, NULL, NULL, FALSE, NULL),
  (NULL, 4.96478, 47.30424, '47.30424,4.96478', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'libre', NULL, NULL, NULL, FALSE, NULL),
  (NULL, 4.96550, 47.30284, '47.30284,4.96550', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'libre', NULL, NULL, NULL, FALSE, NULL),
  (NULL, 4.96467, 47.30263, '47.30263,4.96467', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'libre', NULL, NULL, NULL, FALSE, NULL),
  (NULL, 4.96585, 47.30291, '47.30291,4.96585', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'libre', NULL, NULL, NULL, FALSE, NULL),
  (NULL, 4.96500, 47.30434, '47.30434,4.96500', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'libre', NULL, NULL, NULL, FALSE, NULL),
  (NULL, 4.96416, 47.30431, '47.30431,4.96416', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'libre', NULL, NULL, NULL, FALSE, NULL),
  (NULL, 4.96451, 47.30444, '47.30444,4.96451', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'libre', NULL, NULL, NULL, FALSE, NULL),
  (NULL, 4.96437, 47.30256, '47.30256,4.96437', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'libre', NULL, NULL, NULL, FALSE, NULL),
  (NULL, 4.96352, 47.30338, '47.30338,4.96352', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'libre', NULL, NULL, NULL, FALSE, NULL),
  (NULL, 4.96669, 47.30427, '47.30427,4.96669', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'libre', NULL, NULL, NULL, FALSE, NULL),
  (NULL, 4.96672, 47.30424, '47.30424,4.96672', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'libre', NULL, NULL, NULL, FALSE, NULL),
  (NULL, 4.96660, 47.30441, '47.30441,4.96660', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'libre', NULL, NULL, NULL, FALSE, NULL),
  (NULL, 4.96343, 47.30356, '47.30356,4.96343', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'libre', NULL, NULL, NULL, FALSE, NULL);

-- ============================================
-- ÉQUIPEMENTS (basés sur equipements.json)
-- ============================================
INSERT INTO equipements (type_equipement, coord_x, coord_y, coordonnees_completes, id_zone, description) VALUES
                                                                                                             ('Toilettes', 4.96433, 47.30254, '47.30254,4.96433', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'Toilettes publiques'),
                                                                                                             ('Toilettes', 4.96357, 47.30456, '47.30456,4.96357', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'Toilettes publiques'),
                                                                                                             ('Toilettes', 4.96527, 47.30603, '47.30603,4.96527', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'Toilettes publiques'),
                                                                                                             ('Point d''eau', 4.96365, 47.30428, '47.30428,4.96365', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'Point d''eau potable'),
                                                                                                             ('Point d''eau', 4.96472, 47.30464, '47.30464,4.96472', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'Point d''eau potable'),
                                                                                                             ('Point d''eau', 4.96514, 47.30593, '47.30593,4.96514', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'Point d''eau potable'),
                                                                                                             ('Point d''eau', 4.96690, 47.30393, '47.30393,4.96690', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'Point d''eau potable'),
                                                                                                             ('Point d''eau', 4.96451, 47.30258, '47.30258,4.96451', (SELECT id_zone FROM zones WHERE nom = 'Zone principale du festival'), 'Point d''eau potable');

-- ============================================
-- UTILISATEURS (basés sur users.json)
-- ============================================
-- Hash placeholder: exécuter "node seed-passwords.js" après pour mettre les vrais hash bcrypt
INSERT INTO utilisateurs (nom_utilisateur, email, mot_de_passe, id_rôle) VALUES
  ('user', 'user@abc.fr', '$2b$10$placeholder.user', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'public')),
  ('admin', 'admin@abc.fr', '$2b$10$placeholder.admin', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'organisateur')),
  ('otacos', 'otacos@prestataire.fr', '$2b$10$placeholder.otacos', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('free', 'free@prestataire.fr', '$2b$10$placeholder.free', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('decathlon', 'decathlon@prestataire.fr', '$2b$10$placeholder.decathlon', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('redbull', 'redbull@prestataire.fr', '$2b$10$placeholder.redbull', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('deezer', 'deezer@prestataire.fr', '$2b$10$placeholder.deezer', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('poliakov', 'poliakov@prestataire.fr', '$2b$10$placeholder.poliakov', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('jackdaniels', 'jackdaniels@prestataire.fr', '$2b$10$placeholder.jackdaniels', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('heetch', 'heetch@prestataire.fr', '$2b$10$placeholder.heetch', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('veolia', 'veolia@prestataire.fr', '$2b$10$placeholder.veolia', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('securitas', 'securitas@prestataire.fr', '$2b$10$placeholder.securitas', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('happn', 'happn@prestataire.fr', '$2b$10$placeholder.happn', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('allianz', 'allianz@prestataire.fr', '$2b$10$placeholder.allianz', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('jeager', 'jeager@prestataire.fr', '$2b$10$placeholder.jeager', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('ricard', 'ricard@prestataire.fr', '$2b$10$placeholder.ricard', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('jbl', 'jbl@prestataire.fr', '$2b$10$placeholder.jbl', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('pepsi', 'pepsi@prestataire.fr', '$2b$10$placeholder.pepsi', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('lipton', 'lipton@prestataire.fr', '$2b$10$placeholder.lipton', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('bagels', 'bagels@prestataire.fr', '$2b$10$placeholder.bagels', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('pizza', 'pizza@prestataire.fr', '$2b$10$placeholder.pizza', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('ailetfinesherbes', 'ailetfinesherbes@prestataire.fr', '$2b$10$placeholder.ailetfinesherbes', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('nouilles', 'nouilles@prestataire.fr', '$2b$10$placeholder.nouilles', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('coiffure', 'coiffure@prestataire.fr', '$2b$10$placeholder.coiffure', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('merch', 'merch@prestataire.fr', '$2b$10$placeholder.merch', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('bornedarcade', 'bornedarcade@prestataire.fr', '$2b$10$placeholder.bornedarcade', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
  ('basket', 'basket@prestataire.fr', '$2b$10$placeholder.basket', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire'));

-- Relations utilisateur_prestataire
INSERT INTO utilisateur_prestataire (id_utilisateur, id_prestataire) VALUES
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'otacos@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'OTacos')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'free@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Free')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'decathlon@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Decathlon')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'redbull@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Red Bull')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'deezer@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Deezer')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'poliakov@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Poliakov')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'jackdaniels@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Jack Daniel''s')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'heetch@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Heetch')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'veolia@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Veolia')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'securitas@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Securitas')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'happn@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Happn')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'allianz@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Allianz')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'jeager@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Jägermeister')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'ricard@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Ricard')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'jbl@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'JBL')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'pepsi@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Pepsi')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'lipton@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Lipton')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'bagels@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Bagels & Co')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'pizza@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Pizza Festival')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'ailetfinesherbes@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Ail et fines herbes')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'nouilles@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Nouilles Express')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'coiffure@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Coiffure Festival')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'merch@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Merch Golden Coast')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'bornedarcade@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Arcade Zone')),
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'basket@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Basket 3x3'));

-- ============================================
-- RELATIONS PRESTATAIRE-EMPLACEMENT (basées sur emplacements.json)
-- ============================================
-- Emplacements pris ou en attente avec prestataires associés
-- Note: Les noms de prestataires doivent correspondre exactement à ceux dans la table prestataire
INSERT INTO prestataire_emplacement (id_prestataire, id_emplacement, date_demande, date_attribution, statut) VALUES
  ((SELECT id_prestataire FROM prestataire WHERE nom = 'OTacos'), 1, NULL, '2026-08-15 10:00:00', 'approuvé'),
  ((SELECT id_prestataire FROM prestataire WHERE nom = 'Red Bull'), 2, NULL, '2026-08-15 10:30:00', 'approuvé'),
  ((SELECT id_prestataire FROM prestataire WHERE nom = 'Poliakov'), 3, NULL, '2026-08-15 11:00:00', 'approuvé'),
  ((SELECT id_prestataire FROM prestataire WHERE nom = 'Decathlon'), 4, NULL, '2026-08-15 11:30:00', 'approuvé'),
  ((SELECT id_prestataire FROM prestataire WHERE nom = 'Jack Daniel''s'), 5, '2026-08-20 14:00:00', NULL, 'demandé'),
  ((SELECT id_prestataire FROM prestataire WHERE nom = 'Deezer'), 6, NULL, '2026-08-15 12:00:00', 'approuvé'),
  ((SELECT id_prestataire FROM prestataire WHERE nom = 'Merch Golden Coast'), 7, NULL, '2026-08-15 12:30:00', 'approuvé'),
  ((SELECT id_prestataire FROM prestataire WHERE nom = 'Pizza Festival'), 8, NULL, '2026-08-15 13:00:00', 'approuvé'),
  ((SELECT id_prestataire FROM prestataire WHERE nom = 'JBL'), 9, NULL, '2026-08-15 13:30:00', 'approuvé'),
  ((SELECT id_prestataire FROM prestataire WHERE nom = 'Bagels & Co'), 10, '2026-08-21 09:00:00', NULL, 'demandé')
ON CONFLICT (id_prestataire, id_emplacement) DO NOTHING;

-- ============================================
-- AVIS (basés sur avis.json - exemples pour quelques prestataires)
-- ============================================
INSERT INTO avis (id_utilisateur, id_prestataire, note, commentaire, date_avis) VALUES
                                                                                    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'OTacos'), 5, 'Super tacos, rapide et parfait entre deux concerts !', '2025-01-15 18:30:00'),
                                                                                    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'OTacos'), 4, 'Très bon, juste un peu d''attente mais ça valait le coup.', '2025-01-15 20:10:00'),
                                                                                    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'OTacos'), 5, 'Les tacos sont délicieux et les portions généreuses !', '2025-01-16 12:45:00'),
                                                                                    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'OTacos'), 3, 'Correct, mais j''aurais aimé plus d''options végétariennes.', '2025-01-16 19:20:00'),
                                                                                    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Free'), 4, 'Bonne couverture réseau, j''ai pu streamer tous les concerts.', '2025-01-15 17:05:00'),
                                                                                    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Free'), 5, 'Wi-Fi gratuit au top, ça change la vie sur le site du festival.', '2025-01-16 15:22:00');

-- ============================================
-- AVIS FESTIVAL (notes sur le festival lui-même)
-- ============================================
INSERT INTO avis_festival (id_utilisateur, id_festival, note, commentaire, date_avis) VALUES
    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'), 1, 5, 'Festival incroyable ! L''ambiance était magique, les artistes au top et l''organisation impeccable. Vivement l''année prochaine !', '2025-09-01 10:30:00'),
    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'), 1, 4, 'Super festival dans un cadre naturel magnifique. Seul bémol : les files d''attente aux bars étaient un peu longues.', '2025-09-02 14:15:00'),
    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'admin@abc.fr'), 1, 5, 'La meilleure édition jusqu''ici ! Le line-up était exceptionnel et le site est vraiment unique en France.', '2025-09-01 18:00:00'),
    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'otacos@prestataire.fr'), 1, 4, 'Très bien organisé, bon public et bonne ambiance générale. Les équipes du festival sont professionnelles.', '2025-09-03 09:45:00'),
    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'free@prestataire.fr'), 1, 5, 'Un événement qui monte en puissance chaque année. Le cadre en forêt rend l''expérience vraiment spéciale.', '2025-09-02 11:20:00'),
    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'redbull@prestataire.fr'), 1, 4, 'Bonne organisation, programmation variée. Le camping était confortable et bien aménagé.', '2025-09-04 08:30:00'),
    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'decathlon@prestataire.fr'), 1, 5, 'Festival à taille humaine avec une programmation de qualité. Le rapport qualité-prix est excellent !', '2025-09-01 20:00:00'),
    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'deezer@prestataire.fr'), 1, 3, 'Bonne ambiance mais les sanitaires auraient pu être plus nombreux. La musique était au rendez-vous cependant.', '2025-09-03 16:30:00'),
    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'heetch@prestataire.fr'), 1, 5, 'Le Golden Coast est devenu un incontournable ! L''ambiance est unique et le site au milieu de la nature est parfait.', '2025-09-02 22:10:00'),
    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'poliakov@prestataire.fr'), 1, 4, 'Tres bon festival, très bonne programmation. J''ai adoré le village food avec tous les stands.', '2025-09-05 12:00:00'),
    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'pepsi@prestataire.fr'), 1, 5, 'Trois jours de folie ! Les scènes étaient bien réparties et le son était parfait partout.', '2025-09-01 23:45:00'),
    ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'lipton@prestataire.fr'), 1, 4, 'Superbe cadre, bonne programmation. J''ai particulièrement aimé la scène en forêt, une vraie pépite.', '2025-09-03 14:00:00');

-- ============================================
-- RÉSERVATIONS DE BILLETS
-- ============================================
INSERT INTO reservation_billet (id_utilisateur, id_billet, quantite, date_reservation, date_utilisation, statut, prix_total, transaction_id, date_paiement) VALUES
  -- User achète 2 forfaits 1 jour pour le vendredi
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_billet FROM billets WHERE type_billet = 'oneDay'),
   2, '2026-07-15 14:30:00', '2026-08-28', 'payé', 90.00, 'TXN-BIL-001', '2026-07-15 14:35:00'),
  -- User achète 1 place de parking
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_billet FROM billets WHERE type_billet = 'parking'),
   1, '2026-07-15 14:32:00', '2026-08-28', 'payé', 10.00, 'TXN-BIL-002', '2026-07-15 14:35:00'),
  -- User achète 1 emplacement camping
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_billet FROM billets WHERE type_billet = 'camping'),
   1, '2026-07-20 10:00:00', NULL, 'payé', 25.00, 'TXN-BIL-003', '2026-07-20 10:05:00'),
  -- Admin achète 1 pass 3 jours
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'admin@abc.fr'),
   (SELECT id_billet FROM billets WHERE type_billet = 'threeDays'),
   1, '2026-07-10 09:00:00', NULL, 'payé', 110.00, 'TXN-BIL-004', '2026-07-10 09:05:00'),
  -- Admin réserve 2 forfaits 2 jours (pas encore payé)
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'admin@abc.fr'),
   (SELECT id_billet FROM billets WHERE type_billet = 'twoDays'),
   2, '2026-08-01 16:00:00', NULL, 'réservé', 160.00, NULL, NULL),
  -- User achète 1 forfait 1 jour pour le samedi
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_billet FROM billets WHERE type_billet = 'oneDay'),
   1, '2026-08-05 11:20:00', '2026-08-29', 'payé', 45.00, 'TXN-BIL-005', '2026-08-05 11:25:00'),
  -- Un prestataire achète 1 pass 3 jours
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'otacos@prestataire.fr'),
   (SELECT id_billet FROM billets WHERE type_billet = 'threeDays'),
   1, '2026-06-20 08:00:00', NULL, 'payé', 110.00, 'TXN-BIL-006', '2026-06-20 08:05:00');

-- ============================================
-- RÉSERVATIONS DE SERVICES
-- ============================================
INSERT INTO reservation_service (id_utilisateur, id_service, id_prestataire, quantite, details, prix_total, statut, transaction_id, date_reservation, date_paiement) VALUES
  -- User commande 2 Tacos & Burgers chez OTacos
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Tacos & Burgers'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'OTacos'),
   2, '{"note": "Sans sauce piquante"}'::jsonb, 20.00, 'payé', 'TXN-SRV-001', '2026-08-28 18:30:00', '2026-08-28 18:30:00'),
  -- User commande 1 Pizza artisanale
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Pizzas artisanales'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'Pizza Festival'),
   1, '{"note": "Margherita"}'::jsonb, 12.00, 'réservé', 'TXN-SRV-002', '2026-08-28 19:00:00', NULL),
  -- User réserve une coupe et coiffure
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Coupe et coiffure'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'Coiffure Festival'),
   1, '{"date": "2026-08-29", "heure_debut": "14:00", "heure_fin": "14:30"}'::jsonb, 20.00, 'payé', 'TXN-SRV-003', '2026-08-28 20:00:00', '2026-08-28 20:05:00'),
  -- User loue du matériel sportif chez Decathlon
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Location matériel sportif'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'Decathlon'),
   1, '{"duree": 4, "equipement": "Raquettes de badminton"}'::jsonb, 5.00, 'réservé', 'TXN-SRV-004', '2026-08-29 10:00:00', NULL),
  -- User commande 3 Red Bull
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Bar Red Bull'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'Red Bull'),
   3, '{}'::jsonb, 24.00, 'payé', 'TXN-SRV-005', '2026-08-28 22:15:00', '2026-08-28 22:15:00'),
  -- User réserve un match de basket
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Match de basket'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'Basket 3x3'),
   1, '{"date": "2026-08-29", "heure_debut": "16:00", "heure_fin": "17:00", "nombre_places": 6}'::jsonb, 0.00, 'réservé', NULL, '2026-08-29 09:00:00', NULL),
  -- User commande du merchandising officiel
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Merchandising officiel'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'Merch Golden Coast'),
   1, '{"article": "T-shirt Golden Coast L"}'::jsonb, 25.00, 'payé', 'TXN-SRV-006', '2026-08-28 17:00:00', '2026-08-28 17:00:00'),
  -- User commande 2 Bagels
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Bagels variés'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'Bagels & Co'),
   2, '{"note": "1 saumon, 1 poulet"}'::jsonb, 18.00, 'réservé', 'TXN-SRV-007', '2026-08-29 12:30:00', NULL),
  -- Admin commande 1 Bar Ricard
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'admin@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Bar Ricard'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'Ricard'),
   1, '{}'::jsonb, 8.00, 'payé', 'TXN-SRV-008', '2026-08-28 21:00:00', '2026-08-28 21:00:00'),
  -- Admin commande 2 Nouilles asiatiques
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'admin@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Nouilles asiatiques'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'Nouilles Express'),
   2, '{"note": "Extra épicé"}'::jsonb, 22.00, 'payé', 'TXN-SRV-009', '2026-08-29 19:30:00', '2026-08-29 19:30:00'),
  -- User loue des jeux d'arcade
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Jeux d''arcade'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'Arcade Zone'),
   1, '{"duree": 1}'::jsonb, 2.00, 'payé', 'TXN-SRV-010', '2026-08-28 16:00:00', '2026-08-28 16:00:00'),
  -- User commande au bar Jägermeister
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Bar Jägermeister'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'Jägermeister'),
   2, '{}'::jsonb, 20.00, 'payé', 'TXN-SRV-011', '2026-08-28 23:00:00', '2026-08-28 23:00:00'),
  -- User commande au bar principal Poliakov
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Bar principal'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'Poliakov'),
   1, '{}'::jsonb, 12.00, 'payé', 'TXN-SRV-012', '2026-08-29 22:00:00', '2026-08-29 22:00:00'),
  -- Admin commande des plats aux herbes
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'admin@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Plats aux herbes'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'Ail et fines herbes'),
   1, '{}'::jsonb, 14.00, 'réservé', 'TXN-SRV-013', '2026-08-30 13:00:00', NULL),
  -- User commande un Pepsi
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Bar Pepsi'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'Pepsi'),
   2, '{}'::jsonb, 10.00, 'payé', 'TXN-SRV-014', '2026-08-29 15:00:00', '2026-08-29 15:00:00'),
  -- User commande un Lipton
  ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'user@abc.fr'),
   (SELECT id_service FROM services WHERE nom_service_fr = 'Bar Lipton'),
   (SELECT id_prestataire FROM prestataire WHERE nom = 'Lipton'),
   1, '{}'::jsonb, 4.00, 'payé', 'TXN-SRV-015', '2026-08-30 14:30:00', '2026-08-30 14:30:00');

-- ============================================
-- FIN DU SCRIPT
-- ============================================