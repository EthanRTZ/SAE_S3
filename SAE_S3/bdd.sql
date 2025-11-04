-- Suppression des tables existantes
DROP TABLE IF EXISTS session_authentification CASCADE;
DROP TABLE IF EXISTS prestataire_emplacement CASCADE;
DROP TABLE IF EXISTS emplacements CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;
DROP TABLE IF EXISTS rôles CASCADE;
DROP TABLE IF EXISTS artiste CASCADE;
DROP TABLE IF EXISTS prestataire CASCADE;

-- Table des rôles
CREATE TABLE rôles (
                       id_rôle SERIAL PRIMARY KEY,
                       nom_rôle VARCHAR(50) NOT NULL UNIQUE
);

-- Table des utilisateurs
CREATE TABLE utilisateurs (
                              id_utilisateur SERIAL PRIMARY KEY,
                              nom_utilisateur VARCHAR(100) NOT NULL,
                              email VARCHAR(150) UNIQUE NOT NULL,
                              mot_de_passe VARCHAR(255) NOT NULL,
                              id_rôle INT NOT NULL REFERENCES rôles(id_rôle),
                              date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des artistes
CREATE TABLE artiste (
                         id_artiste SERIAL PRIMARY KEY,
                         nom VARCHAR(100) NOT NULL,
                         style_musique VARCHAR(100) NOT NULL,
                         description TEXT,
                         pays_origine VARCHAR(100),
                         photo_url VARCHAR(255),
                         cachet NUMERIC(10,2),
                         date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         lien_deezer VARCHAR(255)
);

-- Table des prestataires
CREATE TABLE prestataire (
                             id_prestataire SERIAL PRIMARY KEY,
                             nom VARCHAR(100) NOT NULL,
                             type_prestataire VARCHAR(100) NOT NULL,
                             description TEXT,
                             contact_email VARCHAR(150),
                             contact_tel VARCHAR(20),
                             site_web VARCHAR(255),
                             photo_url VARCHAR(255),
                             date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des services
CREATE TABLE services (
                          id_service SERIAL PRIMARY KEY,
                          id_prestataire INT NOT NULL REFERENCES prestataire(id_prestataire),
                          nom_service VARCHAR(100) NOT NULL,
                          description TEXT,
                          prix_estime NUMERIC(10,2)
);

-- Table des emplacements
CREATE TABLE emplacements (
                              id_emplacement SERIAL PRIMARY KEY,
                              nom_emplacement VARCHAR(100) NOT NULL,
                              coord_x NUMERIC(10,2),
                              coord_y NUMERIC(10,2),
                              zone VARCHAR(100),
                              description TEXT
);

-- Table de liaison prestataire-emplacement
CREATE TABLE prestataire_emplacement (
                                         id_prestataire INT NOT NULL REFERENCES prestataire(id_prestataire),
                                         id_emplacement INT NOT NULL REFERENCES emplacements(id_emplacement),
                                         PRIMARY KEY (id_prestataire, id_emplacement)
);

-- Table des sessions d'authentification
CREATE TABLE session_authentification (
                                          id_session SERIAL PRIMARY KEY,
                                          id_utilisateur INT NOT NULL REFERENCES utilisateurs(id_utilisateur),
                                          token VARCHAR(255) UNIQUE NOT NULL,
                                          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          date_expiration TIMESTAMP,
                                          actif BOOLEAN DEFAULT TRUE
);

-- Données de test pour les rôles
INSERT INTO rôles (nom_rôle)
VALUES ('public'), ('prestataire'), ('organisateur');

-- Données pour les artistes
INSERT INTO artiste (nom, style_musique, description, pays_origine, photo_url, cachet, lien_deezer)
VALUES
    ('Booba', 'Rap français', 'Légende du rap hexagonal, tête d’affiche du Golden Coast 2024.', 'France', 'booba.jpg', 60000.00, 'https://www.deezer.com/fr/artist/390'),
    ('SCH', 'Rap français', 'Artiste majeur programmé au Golden Coast 2024.', 'France', 'sch.jpg', 50000.00, 'https://www.deezer.com/fr/artist/162665'),
    ('SDM', 'Rap français', 'Nouvelle génération, présent au Golden Coast 2024.', 'France', 'sdm.jpg', 30000.00, 'https://www.deezer.com/fr/artist/604107'),
    ('Josman', 'Rap français', 'Confirmé pour la programmation du Golden Coast.', 'France', 'josman.jpg', 25000.00, 'https://www.deezer.com/fr/artist/7365500'),
    ('Ninho', 'Rap français', 'Figure du rap français, annoncé au Golden Coast 2024.', 'France', 'ninho.jpg', 55000.00, 'https://www.deezer.com/fr/artist/5542343'),
    ('Gims', 'Pop / Rap français', 'Artiste programmé à l’édition 2025 du Golden Coast.', 'France', 'gims.jpg', 65000.00, 'https://www.deezer.com/fr/artist/4429712');

-- Données pour les prestataires
INSERT INTO prestataire (nom, type_prestataire, description, contact_email, contact_tel, site_web, photo_url)
VALUES
    ('OTacos', 'Restauration rapide / Street-food', 'Enseigne française présente parmi les stands food & beverage du festival.', 'contact@otacos.com', '+33 1 23 45 67 89', 'https://o-tacos.com', 'otacos.jpg'),
    ('Free', 'Télécommunications', 'Opérateur télécom partenaire du festival pour la couverture réseau.', 'partenariat@free.fr', '+33 1 98 76 54 32', 'https://free.fr', 'free.jpg'),
    ('Allianz', 'Assurance / Prévention', 'Partenaire prévention et sécurité du festival.', 'contact@allianz.fr', '+33 1 45 67 89 10', 'https://allianz.fr', 'allianz.jpg'),
    ('Poliakov', 'Boissons / Spiritueux', 'Sponsor officiel du bar principal du Golden Coast.', 'contact@poliakov.fr', '+33 1 56 98 45 32', 'https://poliakov.fr', 'poliakov.jpg'),
    ('Jack Daniel’s', 'Boissons / Spiritueux', 'Partenaire officiel du Golden Coast avec un bar éphémère.', 'contact@jackdaniels.com', '+33 1 87 65 43 21', 'https://jackdaniels.com', 'jackdaniels.jpg'),
    ('Red Bull', 'Boissons énergisantes', 'Partenaire énergie et animation du festival.', 'info@redbull.com', '+43 1 87 65 90 12', 'https://redbull.com', 'redbull.jpg');

-- Données pour les services
INSERT INTO services (id_prestataire, nom_service, description, prix_estime)
VALUES
    (1, 'Tacos & Burgers', 'Restauration rapide pour festivaliers', 10.00),
    (2, 'Réseau 5G', 'Connexion mobile et Wi-Fi sur site', 0.00),
    (3, 'Sécurité & prévention', 'Sensibilisation sécurité routière et alcool', 0.00),
    (4, 'Bar principal', 'Espace boisson et cocktails', 12.00),
    (5, 'Dégustation whisky', 'Espace promotion Jack Daniel’s', 15.00),
    (6, 'Bar Red Bull', 'Boissons énergisantes et espace détente', 8.00);

-- Données pour les utilisateurs
INSERT INTO utilisateurs (nom_utilisateur, email, mot_de_passe, id_rôle)
VALUES
    ('admin', 'admin@goldencoast.com', '$2y$10$ABCDEFG1234567890HASHADMIN', 3),
    ('prestataire_demo', 'prestataire@goldencoast.com', '$2y$10$ZYXWVUT9876543210HASHPREST', 2),
    ('visiteur', 'visiteur@goldencoast.com', '$2y$10$QWERTY0987654321HASHVISITEUR', 1);

-- Données pour les sessions
INSERT INTO session_authentification (id_utilisateur, token, date_expiration, actif)
VALUES
    (1, 'token_admin_123456789', NOW() + INTERVAL '7 days', TRUE),
    (2, 'token_prestataire_987654321', NOW() + INTERVAL '7 days', TRUE),
    (3, 'token_visiteur_456789123', NOW() + INTERVAL '7 days', TRUE);