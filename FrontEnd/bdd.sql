-- ============================================
-- SCRIPT DE CRÉATION COMPLÈTE DE LA BASE DE DONNÉES
-- Golden Coast Festival - SAE S3
-- Basé sur les exigences de la SAE et les données JSON
-- ============================================

-- Suppression des tables existantes (dans l'ordre pour éviter les conflits de clés étrangères)
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
                              nom_utilisateur VARCHAR(100) NOT NULL,
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
-- TABLE : services
-- ============================================
CREATE TABLE services (
                          id_service SERIAL PRIMARY KEY,
                          id_prestataire INT NOT NULL REFERENCES prestataire(id_prestataire) ON DELETE CASCADE,
                          nom_service_fr VARCHAR(100) NOT NULL,
                          nom_service_en VARCHAR(100),
                          description_fr TEXT,
                          description_en TEXT,
                          prix_estime NUMERIC(10,2)
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
                          nombre_festivaliers INT,
                          version VARCHAR(20), -- V3, etc.
                          actif BOOLEAN DEFAULT TRUE
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
INSERT INTO festival (nom, annee, date_debut, date_fin, lieu_nom, lieu_coordonnees, description_fr, description_en, nombre_festivaliers, version, actif) VALUES
    ('Golden Coast Festival', 2026, '2026-08-28', '2026-08-30', 'Combe à la Serpent, Corcelles-lès-Monts', '47.305,4.964',
     'Le plus grand festival de rap français sur la Côte dorée. Trois jours d''exception où musique, culture urbaine et convivialité se rencontrent dans un cadre naturel unique.',
     'The biggest French rap festival on the Golden Coast. Three exceptional days where music, urban culture and conviviality meet in a unique natural setting.',
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
                                                                                                                            ('1jour', 'Forfait 1 jour', '1 Day Pass', 45.00, 120, 120, '["Vendredi", "Samedi", "Dimanche"]'::jsonb, 'Forfait valable pour une journée'),
                                                                                                                            ('2jours', 'Forfait 2 jours', '2 Days Pass', 80.00, 120, 120, '["Vendredi + Samedi", "Samedi + Dimanche", "Vendredi + Dimanche"]'::jsonb, 'Forfait valable pour deux journées consécutives'),
                                                                                                                            ('3jours', 'Pass 3 jours', '3 Days Pass', 110.00, 50, 50, NULL, 'Pass complet pour les 3 jours du festival'),
                                                                                                                            ('parking', 'Place de parking', 'Parking Spot', 10.00, 200, 200, NULL, 'Place de parking pour un véhicule'),
                                                                                                                            ('camping', 'Emplacement de camping', 'Camping Spot', 25.00, 150, 150, NULL, 'Emplacement de camping pour tente');

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
                                                                                                                                     ('Basket 3x3', 'Sport / Animation', 'Terrain de basket 3x3', '3x3 basketball court', 'contact@basket3x3.fr', '+33 1 56 78 90 13', 'https://basket3x3.fr', '/media/prestataires/basket.png'),
                                                                                                                                     ('Merch', 'Commerces & Équipements', 'Vêtements et accessoires à l''effigie d''une marque ou d''un artiste.', 'Clothing and accessories featuring a brand or artist.', NULL, NULL, NULL, '/media/prestataires/merch.png'),
                                                                                                                                     ('Pizza', 'Restauration', 'Plat italien à base de pâte, sauce tomate et garnitures.', 'Italian dish made with dough, tomato sauce and toppings.', NULL, NULL, NULL, '/media/prestataires/pizza.png'),
                                                                                                                                     ('Bagels', 'Restauration', 'Pain en forme d''anneau, souvent garni.', 'Ring-shaped bread, often filled.', NULL, NULL, NULL, '/media/prestataires/bagels.png');

-- Mise à jour des sponsors des scènes (après insertion des prestataires)
UPDATE scenes SET id_prestataire_sponsor = (SELECT id_prestataire FROM prestataire WHERE nom = 'Deezer') WHERE nom = 'ZERO GRAVITY';
UPDATE scenes SET id_prestataire_sponsor = (SELECT id_prestataire FROM prestataire WHERE nom = 'JBL') WHERE nom = 'CARGO';
-- MOTHERSHIP par SNIPES (non présent dans prestataires, à ajouter si nécessaire)
-- ANTDT CLUB par ANTDT (non présent dans prestataires, à ajouter si nécessaire)

-- ============================================
-- SERVICES (basés sur prestataires.json)
-- ============================================
INSERT INTO services (id_prestataire, nom_service_fr, nom_service_en, description_fr, description_en, prix_estime) VALUES
                                                                                                                       (1, 'Tacos & Burgers', 'Tacos & Burgers', 'Restauration rapide pour festivaliers', 'Fast food for festival-goers', 10.00),
                                                                                                                       (2, 'Réseau 5G', '5G Network', 'Connexion mobile et Wi-Fi sur site', 'Mobile connection and on-site Wi-Fi', 0.00),
                                                                                                                       (3, 'Sécurité & prévention', 'Safety & prevention', 'Sensibilisation sécurité routière et alcool', 'Road safety and alcohol awareness', 0.00),
                                                                                                                       (4, 'Bar principal', 'Main bar', 'Espace boisson et cocktails', 'Drinks and cocktails area', 12.00),
                                                                                                                       (5, 'Dégustation whisky', 'Whiskey tasting', 'Espace promotion Jack Daniel''s', 'Jack Daniel''s promotional space', 15.00),
                                                                                                                       (6, 'Bar Red Bull', 'Red Bull Bar', 'Boissons énergisantes et espace détente', 'Energy drinks and relaxation area', 8.00),
                                                                                                                       (7, 'Transport VTC', 'VTC transport', 'Navettes et trajets vers le festival', 'Shuttles and trips to the festival', 15.00),
                                                                                                                       (8, 'Location matériel sportif', 'Sports equipment rental', 'Location d''équipement sportif', 'Sports equipment rental', 5.00),
                                                                                                                       (9, 'Gestion déchets', 'Waste management', 'Tri et recyclage des déchets', 'Waste sorting and recycling', 0.00),
                                                                                                                       (10, 'Service de sécurité', 'Security service', 'Surveillance et contrôle d''accès', 'Surveillance and access control', 0.00),
                                                                                                                       (11, 'Playlists officielles', 'Official playlists', 'Streaming musical du festival', 'Festival music streaming', 0.00),
                                                                                                                       (12, 'Animation réseau', 'Network animation', 'Rencontres entre festivaliers', 'Meetups between festival-goers', 0.00),
                                                                                                                       (13, 'Bar Jägermeister', 'Jägermeister bar', 'Dégustation et cocktails', 'Tasting and cocktails', 10.00),
                                                                                                                       (14, 'Bar Ricard', 'Ricard bar', 'Pastis et cocktails anisés', 'Pastis and anise cocktails', 8.00),
                                                                                                                       (15, 'Sonorisation', 'Sound system', 'Équipement audio premium', 'Premium audio equipment', 0.00),
                                                                                                                       (16, 'Bar Pepsi', 'Pepsi bar', 'Boissons rafraîchissantes', 'Refreshing drinks', 5.00),
                                                                                                                       (17, 'Bar Lipton', 'Lipton bar', 'Thés glacés et boissons', 'Iced teas and drinks', 4.00),
                                                                                                                       (18, 'Bagels variés', 'Varied bagels', 'Sandwichs bagels garnis', 'Stuffed bagel sandwiches', 9.00),
                                                                                                                       (19, 'Pizzas artisanales', 'Artisan pizzas', 'Pizzas cuites au feu de bois', 'Wood-fired pizzas', 12.00),
                                                                                                                       (20, 'Plats aux herbes', 'Herb dishes', 'Cuisine gastronomique', 'Gourmet cuisine', 14.00),
                                                                                                                       (21, 'Nouilles asiatiques', 'Asian noodles', 'Woks et nouilles sautées', 'Woks and fried noodles', 11.00),
                                                                                                                       (22, 'Coupe et coiffure', 'Haircut and styling', 'Service de coiffure express', 'Express hairdressing service', 20.00),
                                                                                                                       (23, 'Merchandising officiel', 'Official merchandising', 'T-shirts, casquettes et goodies', 'T-shirts, caps and goodies', 25.00),
                                                                                                                       (24, 'Jeux d''arcade', 'Arcade games', 'Accès aux bornes d''arcade', 'Access to arcade machines', 2.00),
                                                                                                                       (25, 'Match de basket', 'Basketball match', 'Tournoi et jeux libres', 'Tournament and free games', 0.00);

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

-- Note: Ajouter les autres jours (Samedi 29 et Dimanche 30 août) si nécessaire dans programmation.json

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
-- Hash par défaut: $2b$10$ (bcrypt) - À remplacer par de vrais hash en production
INSERT INTO utilisateurs (nom_utilisateur, email, mot_de_passe, id_rôle) VALUES
                                                                             ('User Public', 'user@abc.fr', '$2b$10$rQ4.ExampleHash.User1234567890ABCDEFGHIJKLM', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'public')),
                                                                             ('Admin', 'admin@abc.fr', '$2b$10$rQ4.ExampleHash.Admin1234567890ABCDEFGHIJKLM', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'organisateur')),
                                                                             ('OTacos Prestataire', 'otacos@prestataire.fr', '$2b$10$rQ4.ExampleHash.OTacos1234567890ABCDEFGHIJKLM', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
                                                                             ('Free Prestataire', 'free@prestataire.fr', '$2b$10$rQ4.ExampleHash.Free1234567890ABCDEFGHIJKLM', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
                                                                             ('Decathlon Prestataire', 'decathlon@prestataire.fr', '$2b$10$rQ4.ExampleHash.Decathlon1234567890ABCDEFGHIJKLM', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
                                                                             ('Red Bull Prestataire', 'redbull@prestataire.fr', '$2b$10$rQ4.ExampleHash.RedBull1234567890ABCDEFGHIJKLM', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
                                                                             ('Deezer Prestataire', 'deezer@prestataire.fr', '$2b$10$rQ4.ExampleHash.Deezer1234567890ABCDEFGHIJKLM', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
                                                                             ('Poliakov Prestataire', 'poliakov@prestataire.fr', '$2b$10$rQ4.ExampleHash.Poliakov1234567890ABCDEFGHIJKLM', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
                                                                             ('Jack Daniel''s Prestataire', 'jackdaniels@prestataire.fr', '$2b$10$rQ4.ExampleHash.JackDaniels1234567890ABCDEFGHIJKLM', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
                                                                             ('Heetch Prestataire', 'heetch@prestataire.fr', '$2b$10$rQ4.ExampleHash.Heetch1234567890ABCDEFGHIJKLM', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
                                                                             ('Veolia Prestataire', 'veolia@prestataire.fr', '$2b$10$rQ4.ExampleHash.Veolia1234567890ABCDEFGHIJKLM', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
                                                                             ('Securitas Prestataire', 'securitas@prestataire.fr', '$2b$10$rQ4.ExampleHash.Securitas1234567890ABCDEFGHIJKLM', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
                                                                             ('Happn Prestataire', 'happn@prestataire.fr', '$2b$10$rQ4.ExampleHash.Happn1234567890ABCDEFGHIJKLM', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire')),
                                                                             ('Allianz Prestataire', 'allianz@prestataire.fr', '$2b$10$rQ4.ExampleHash.Allianz1234567890ABCDEFGHIJKLM', (SELECT id_rôle FROM rôles WHERE nom_rôle = 'prestataire'));

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
                                                                         ((SELECT id_utilisateur FROM utilisateurs WHERE email = 'allianz@prestataire.fr'), (SELECT id_prestataire FROM prestataire WHERE nom = 'Allianz'));

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
  ((SELECT id_prestataire FROM prestataire WHERE nom = 'Merch'), 7, NULL, '2026-08-15 12:30:00', 'approuvé'),
  ((SELECT id_prestataire FROM prestataire WHERE nom = 'Pizza'), 8, NULL, '2026-08-15 13:00:00', 'approuvé'),
  ((SELECT id_prestataire FROM prestataire WHERE nom = 'JBL'), 9, NULL, '2026-08-15 13:30:00', 'approuvé'),
  ((SELECT id_prestataire FROM prestataire WHERE nom = 'Bagels'), 10, '2026-08-21 09:00:00', NULL, 'demandé')
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
-- FIN DU SCRIPT
-- ============================================