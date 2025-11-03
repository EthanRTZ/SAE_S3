-- Suppression des tables existantes si elles existent déjà
DROP TABLE IF EXISTS session_authentification;
DROP TABLE IF EXISTS prestataire_emplacement;
DROP TABLE IF EXISTS emplacements;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS utilisateurs;
DROP TABLE IF EXISTS rôles;
DROP TABLE IF EXISTS artiste;
DROP TABLE IF EXISTS prestataire;

-- Table des rôles
CREATE TABLE rôles (
                       id_rôle INT AUTO_INCREMENT PRIMARY KEY,
                       nom_rôle VARCHAR(50) NOT NULL UNIQUE COMMENT 'Exemples : public, prestataire, organisateur'
);

-- Table des utilisateurs
CREATE TABLE utilisateurs (
                              id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
                              nom_utilisateur VARCHAR(100) NOT NULL,
                              email VARCHAR(150) UNIQUE NOT NULL,
                              mot_de_passe VARCHAR(255) NOT NULL,
                              id_rôle INT NOT NULL,
                              date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              FOREIGN KEY (id_rôle) REFERENCES rôles(id_rôle)
);

-- Table des artistes
CREATE TABLE artiste (
                         id_artiste INT AUTO_INCREMENT PRIMARY KEY,
                         nom VARCHAR(100) NOT NULL,
                         style_musique VARCHAR(100) NOT NULL,
                         description TEXT,
                         pays_origine VARCHAR(100),
                         photo_url VARCHAR(255),
                         cachet DECIMAL(10,2),
                         date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         lien_deezer VARCHAR(255)
);

-- Table des prestataires
CREATE TABLE prestataire (
                             id_prestataire INT AUTO_INCREMENT PRIMARY KEY,
                             nom VARCHAR(100) NOT NULL,
                             type_prestataire VARCHAR(100) NOT NULL,
                             description TEXT,
                             contact_email VARCHAR(150),
                             contact_tel VARCHAR(20),
                             site_web VARCHAR(255),
                             photo_url VARCHAR(255),
                             date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des services (liée à un prestataire)
CREATE TABLE services (
                          id_service INT AUTO_INCREMENT PRIMARY KEY,
                          id_prestataire INT NOT NULL,
                          nom_service VARCHAR(100) NOT NULL,
                          description TEXT,
                          prix_estime DECIMAL(10,2),
                          FOREIGN KEY (id_prestataire) REFERENCES prestataire(id_prestataire)
);

-- Table des emplacements (pour le plan interactif)
CREATE TABLE emplacements (
                              id_emplacement INT AUTO_INCREMENT PRIMARY KEY,
                              nom_emplacement VARCHAR(100) NOT NULL,
                              coord_x DECIMAL(10,2),
                              coord_y DECIMAL(10,2),
                              zone VARCHAR(100),
                              description TEXT
);

-- Table de liaison entre prestataires et emplacements
CREATE TABLE prestataire_emplacement (
                                         id_prestataire INT NOT NULL,
                                         id_emplacement INT NOT NULL,
                                         PRIMARY KEY (id_prestataire, id_emplacement),
                                         FOREIGN KEY (id_prestataire) REFERENCES prestataire(id_prestataire),
                                         FOREIGN KEY (id_emplacement) REFERENCES emplacements(id_emplacement)
);

-- Table de gestion des sessions / authentification API
CREATE TABLE session_authentification (
                                          id_session INT AUTO_INCREMENT PRIMARY KEY,
                                          id_utilisateur INT NOT NULL,
                                          token VARCHAR(255) UNIQUE NOT NULL,
                                          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          date_expiration TIMESTAMP,
                                          actif BOOLEAN DEFAULT TRUE,
                                          FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);

USE golden_coast;

-- Données de test pour les rôles
INSERT INTO rôles (nom_rôle)
VALUES ('public'), ('prestataire'), ('organisateur');

-- Table Artistes (avec lien Deezer ajouté)
INSERT INTO artiste (nom, style_musique, description, pays_origine, site_web, photo_url, cachet, lien_deezer)
VALUES
    ('Booba', 'Rap français', 'Légende du rap hexagonal, tête d’affiche du Golden Coast 2024.', 'France', 'booba.jpg', 60000.00, 'https://www.deezer.com/fr/artist/390'),
    ('SCH', 'Rap français', 'Artiste majeur programmé au Golden Coast 2024.', 'France','sch.jpg', 50000.00, 'https://www.deezer.com/fr/artist/162665'),
    ('SDM', 'Rap français', 'Nouvelle génération, présent au Golden Coast 2024.', 'France','sdm.jpg', 30000.00, 'https://www.deezer.com/fr/artist/604107'),
    ('Josman', 'Rap français', 'Confirmé pour la programmation du Golden Coast.', 'France','josman.jpg', 25000.00, 'https://www.deezer.com/fr/artist/7365500'),
    ('Ninho', 'Rap français', 'Figure du rap français, annoncé au Golden Coast 2024.', 'France','ninho.jpg', 55000.00, 'https://www.deezer.com/fr/artist/5542343'),
    ('Gims', 'Pop / Rap français', 'Artiste programmé à l’édition 2025 du Golden Coast.', 'France','gims.jpg', 65000.00, 'https://www.deezer.com/fr/artist/4429712');

-- Données de test pour les prestataires
INSERT INTO prestataire (nom, type_prestataire, description, contact_email, contact_tel, site_web, photo_url)
VALUES
    ('OTacos', 'Restauration rapide / Street-food', 'Enseigne française présente parmi les stands food & beverage du festival.', 'contact@otacos.com', '+33 1 23 45 67 89', 'https://o-tacos.com', 'otacos.jpg'),
    ('Free', 'Télécommunications', 'Opérateur télécom partenaire du festival pour la couverture réseau.', 'partenariat@free.fr', '+33 1 98 76 54 32', 'https://free.fr', 'free.jpg'),
    ('Allianz', 'Assurance / Prévention', 'Partenaire prévention et sécurité du festival.', 'contact@allianz.fr', '+33 1 45 67 89 10', 'https://allianz.fr', 'allianz.jpg'),
    ('Poliakov', 'Boissons / Spiritueux', 'Sponsor officiel du bar principal du Golden Coast.', 'contact@poliakov.fr', '+33 1 56 98 45 32', 'https://poliakov.fr', 'poliakov.jpg'),
    ('Jack Daniel’s', 'Boissons / Spiritueux', 'Partenaire officiel du Golden Coast avec un bar éphémère.', 'contact@jackdaniels.com', '+33 1 87 65 43 21', 'https://jackdaniels.com', 'jackdaniels.jpg'),
    ('Red Bull', 'Boissons énergisantes', 'Partenaire énergie et animation du festival.', 'info@redbull.com', '+43 1 87 65 90 12', 'https://redbull.com', 'redbull.jpg');

-- Données de test pour les services
INSERT INTO services (id_prestataire, nom_service, description, prix_estime)
VALUES
    (1, 'Tacos & Burgers', 'Restauration rapide pour festivaliers', 10.00),
    (2, 'Réseau 5G', 'Connexion mobile et Wi-Fi sur site', 0.00),
    (3, 'Sécurité & prévention', 'Sensibilisation sécurité routière et alcool', 0.00),
    (4, 'Bar principal', 'Espace boisson et cocktails', 12.00),
    (5, 'Dégustation whisky', 'Espace promotion Jack Daniel’s', 15.00),
    (6, 'Bar Red Bull', 'Boissons énergisantes et espace détente', 8.00);

-- Données de test pour les utilisateurs
INSERT INTO utilisateurs (nom_utilisateur, email, mot_de_passe, id_rôle)
VALUES
    ('admin', 'admin@goldencoast.com', '$2y$10$ABCDEFG1234567890HASHADMIN', 3),
    ('prestataire_demo', 'prestataire@goldencoast.com', '$2y$10$ZYXWVUT9876543210HASHPREST', 2),
    ('visiteur', 'visiteur@goldencoast.com', '$2y$10$QWERTY0987654321HASHVISITEUR', 1);

-- Données de test pour les sessions (tokens fictifs)
INSERT INTO session_authentification (id_utilisateur, token, date_expiration, actif)
VALUES
    (1, 'token_admin_123456789', DATE_ADD(NOW(), INTERVAL 7 DAY), TRUE),
    (2, 'token_prestataire_987654321', DATE_ADD(NOW(), INTERVAL 7 DAY), TRUE),
    (3, 'token_visiteur_456789123', DATE_ADD(NOW(), INTERVAL 7 DAY), TRUE);
