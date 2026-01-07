-- sql
DROP TABLE IF EXISTS session_authentification CASCADE;
DROP TABLE IF EXISTS prestataire_emplacement CASCADE;
DROP TABLE IF EXISTS emplacements CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;
DROP TABLE IF EXISTS rôles CASCADE;
DROP TABLE IF EXISTS artiste CASCADE;
DROP TABLE IF EXISTS prestataire CASCADE;

CREATE TABLE rôles (
                       id_rôle SERIAL PRIMARY KEY,
                       nom_rôle VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE utilisateurs (
                              id_utilisateur SERIAL PRIMARY KEY,
                              nom_utilisateur VARCHAR(100) NOT NULL,
                              email VARCHAR(150) UNIQUE NOT NULL,
                              mot_de_passe VARCHAR(255) NOT NULL,
                              id_rôle INT NOT NULL REFERENCES rôles(id_rôle),
                              date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE services (
                          id_service SERIAL PRIMARY KEY,
                          id_prestataire INT NOT NULL REFERENCES prestataire(id_prestataire),
                          nom_service VARCHAR(100) NOT NULL,
                          description TEXT,
                          prix_estime NUMERIC(10,2)
);

CREATE TABLE emplacements (
                              id_emplacement SERIAL PRIMARY KEY,
                              nom_emplacement VARCHAR(100) NOT NULL,
                              coord_x NUMERIC(10,2),
                              coord_y NUMERIC(10,2),
                              zone VARCHAR(100),
                              description TEXT
);

CREATE TABLE prestataire_emplacement (
                                         id_prestataire INT NOT NULL REFERENCES prestataire(id_prestataire),
                                         id_emplacement INT NOT NULL REFERENCES emplacements(id_emplacement),
                                         PRIMARY KEY (id_prestataire, id_emplacement)
);

CREATE TABLE session_authentification (
                                          id_session SERIAL PRIMARY KEY,
                                          id_utilisateur INT NOT NULL REFERENCES utilisateurs(id_utilisateur),
                                          token VARCHAR(255) UNIQUE NOT NULL,
                                          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          date_expiration TIMESTAMP,
                                          actif BOOLEAN DEFAULT TRUE
);

INSERT INTO rôles (nom_rôle)
VALUES ('public'), ('prestataire'), ('organisateur');

INSERT INTO artiste (nom, style_musique, description, pays_origine, photo_url, cachet, lien_deezer)
VALUES
    ('Booba', 'Rap français', 'Légende du rap hexagonal, tête d’affiche du Golden Coast 2024.', 'France', 'booba.jpg', 60000.00, 'https://www.deezer.com/fr/artist/390'),
    ('SCH', 'Rap français', 'Artiste majeur programmé au Golden Coast 2024.', 'France', 'sch.jpg', 50000.00, 'https://www.deezer.com/fr/artist/162665'),
    ('SDM', 'Rap français', 'Nouvelle génération, présent au Golden Coast 2024.', 'France', 'sdm.jpg', 30000.00, 'https://www.deezer.com/fr/artist/604107'),
    ('Josman', 'Rap français', 'Confirmé pour la programmation du Golden Coast.', 'France', 'josman.jpg', 25000.00, 'https://www.deezer.com/fr/artist/7365500'),
    ('Ninho', 'Rap français', 'Figure du rap français, annoncé au Golden Coast 2024.', 'France', 'ninho.jpg', 55000.00, 'https://www.deezer.com/fr/artist/5542343'),
    ('Gims', 'Pop / Rap français', 'Artiste programmé à l’édition 2025 du Golden Coast.', 'France', 'gims.jpg', 65000.00, 'https://www.deezer.com/fr/artist/4429712');

INSERT INTO prestataire (nom, type_prestataire, description, contact_email, contact_tel, site_web, photo_url)
VALUES
    ('OTacos', 'Restauration rapide / Street-food', 'Enseigne française présente parmi les stands food & beverage du festival.', 'contact@otacos.com', '+33 1 23 45 67 89', 'https://o-tacos.com', 'otacos.jpg'),
    ('Free', 'Télécommunications', 'Opérateur télécom partenaire du festival pour la couverture réseau.', 'partenariat@free.fr', '+33 1 98 76 54 32', 'https://free.fr', 'free.jpg'),
    ('Allianz', 'Assurance / Prévention', 'Partenaire prévention et sécurité du festival.', 'contact@allianz.fr', '+33 1 45 67 89 10', 'https://allianz.fr', 'allianz.jpg'),
    ('Poliakov', 'Boissons / Spiritueux', 'Sponsor officiel du bar principal du Golden Coast.', 'contact@poliakov.fr', '+33 1 56 98 45 32', 'https://poliakov.fr', 'poliakov.jpg'),
    ('Jack Daniel’s', 'Boissons / Spiritueux', 'Partenaire officiel du Golden Coast avec un bar éphémère.', 'contact@jackdaniels.com', '+33 1 87 65 43 21', 'https://jackdaniels.com', 'jackdaniels.jpg'),
    ('Red Bull', 'Boissons énergisantes', 'Partenaire énergie et animation du festival.', 'info@redbull.com', '+43 1 87 65 90 12', 'https://redbull.com', 'redbull.jpg'),
    ('Heetch', 'Transport / VTC', 'Service de transport partenaire du festival', 'contact@heetch.com', '+33 1 23 45 67 90', 'https://heetch.com', 'heetch.jpg'),
    ('Decathlon', 'Équipement sportif', 'Partenaire équipement et activités sportives', 'contact@decathlon.fr', '+33 1 34 56 78 91', 'https://decathlon.fr', 'decathlon.jpg'),
    ('Veolia', 'Environnement / Propreté', 'Gestion des déchets et propreté du site', 'contact@veolia.fr', '+33 1 45 67 89 02', 'https://veolia.fr', 'veolia.jpg'),
    ('Securitas', 'Sécurité', 'Service de sécurité du festival', 'contact@securitas.fr', '+33 1 56 78 90 13', 'https://securitas.fr', 'securitas.jpg'),
    ('Deezer', 'Streaming musical', 'Partenaire streaming et playlists officielles', 'contact@deezer.com', '+33 1 67 89 01 24', 'https://deezer.com', 'deezer.jpg'),
    ('Happn', 'Application de rencontre', 'Partenaire réseau social du festival', 'contact@happn.com', '+33 1 78 90 12 35', 'https://happn.com', 'happn.jpg'),
    ('Jägermeister', 'Boissons / Spiritueux', 'Bar partenaire Jägermeister', 'contact@jagermeister.fr', '+49 531 56 00', 'https://jagermeister.com', 'jager.jpg'),
    ('Ricard', 'Boissons / Spiritueux', 'Bar partenaire Ricard', 'contact@ricard.fr', '+33 4 91 29 20 00', 'https://ricard.com', 'ricard.jpg'),
    ('JBL', 'Audio / Sonorisation', 'Partenaire audio et équipement sonore', 'contact@jbl.com', '+1 818 894 8850', 'https://jbl.com', 'jbl.jpg'),
    ('Pepsi', 'Boissons', 'Partenaire boissons rafraîchissantes', 'contact@pepsi.fr', '+33 1 49 00 10 00', 'https://pepsi.com', 'pepsi.jpg'),
    ('Lipton', 'Boissons / Thés', 'Partenaire boissons fraîches', 'contact@lipton.fr', '+33 1 40 13 21 00', 'https://lipton.com', 'lipton.jpg'),
    ('Bagels & Co', 'Restauration', 'Stand de bagels et sandwichs', 'contact@bagels.com', '+33 1 89 01 23 46', 'https://bagels-co.fr', 'bagels.jpg'),
    ('Pizza Festival', 'Restauration', 'Stand de pizzas artisanales', 'contact@pizzafestival.fr', '+33 1 90 12 34 57', 'https://pizzafestival.fr', 'pizza.jpg'),
    ('Ail et fines herbes', 'Restauration', 'Stand de cuisine aux herbes', 'contact@ailetfinesherbes.fr', '+33 1 01 23 45 68', 'https://ailetfinesherbes.fr', 'ail.jpg'),
    ('Nouilles Express', 'Restauration', 'Stand de nouilles asiatiques', 'contact@nouilles.fr', '+33 1 12 34 56 79', 'https://nouilles-express.fr', 'nouilles.jpg'),
    ('Coiffure Festival', 'Services / Bien-être', 'Stand de coiffure et coupe', 'contact@coiffure.fr', '+33 1 23 45 67 80', 'https://coiffure-festival.fr', 'coiffure.jpg'),
    ('Merch Golden Coast', 'Merchandising', 'Boutique officielle du festival', 'merch@goldencoast.com', '+33 1 34 56 78 91', 'https://goldencoast.com/merch', 'merch.jpg'),
    ('Arcade Zone', 'Divertissement', 'Borne d''arcade et jeux rétro', 'contact@arcadezone.fr', '+33 1 45 67 89 02', 'https://arcadezone.fr', 'arcade.jpg'),
    ('Basket 3x3', 'Sport / Animation', 'Terrain de basket 3x3', 'contact@basket3x3.fr', '+33 1 56 78 90 13', 'https://basket3x3.fr', 'basket.jpg');

INSERT INTO services (id_prestataire, nom_service, description, prix_estime)
VALUES
    (1, 'Tacos & Burgers', 'Restauration rapide pour festivaliers', 10.00),
    (2, 'Réseau 5G', 'Connexion mobile et Wi-Fi sur site', 0.00),
    (3, 'Sécurité & prévention', 'Sensibilisation sécurité routière et alcool', 0.00),
    (4, 'Bar principal', 'Espace boisson et cocktails', 12.00),
    (5, 'Dégustation whisky', 'Espace promotion Jack Daniel’s', 15.00),
    (6, 'Bar Red Bull', 'Boissons énergisantes et espace détente', 8.00),
    (7, 'Transport VTC', 'Navettes et trajets vers le festival', 15.00),
    (8, 'Location matériel sportif', 'Location d''équipement sportif', 5.00),
    (9, 'Gestion déchets', 'Tri et recyclage des déchets', 0.00),
    (10, 'Service de sécurité', 'Surveillance et contrôle d''accès', 0.00),
    (11, 'Playlists officielles', 'Streaming musical du festival', 0.00),
    (12, 'Animation réseau', 'Rencontres entre festivaliers', 0.00),
    (13, 'Bar Jägermeister', 'Dégustation et cocktails', 10.00),
    (14, 'Bar Ricard', 'Pastis et cocktails anisés', 8.00),
    (15, 'Sonorisation', 'Équipement audio premium', 0.00),
    (16, 'Bar Pepsi', 'Boissons rafraîchissantes', 5.00),
    (17, 'Bar Lipton', 'Thés glacés et boissons', 4.00),
    (18, 'Bagels variés', 'Sandwichs bagels garnis', 9.00),
    (19, 'Pizzas artisanales', 'Pizzas cuites au feu de bois', 12.00),
    (20, 'Plats aux herbes', 'Cuisine gastronomique', 14.00),
    (21, 'Nouilles asiatiques', 'Woks et nouilles sautées', 11.00),
    (22, 'Coupe et coiffure', 'Service de coiffure express', 20.00),
    (23, 'Merchandising officiel', 'T-shirts, casquettes et goodies', 25.00),
    (24, 'Jeux d''arcade', 'Accès aux bornes d''arcade', 2.00),
    (25, 'Match de basket', 'Tournoi et jeux libres', 0.00);

INSERT INTO utilisateurs (nom_utilisateur, email, mot_de_passe, id_rôle)
VALUES
    ('admin', 'admin@goldencoast.com', '$2y$10$ABCDEFG1234567890HASHADMIN', 3),
    ('prestataire_demo', 'prestataire@goldencoast.com', '$2y$10$ZYXWVUT9876543210HASHPREST', 2),
    ('visiteur', 'visiteur@goldencoast.com', '$2y$10$QWERTY0987654321HASHVISITEUR', 1);

INSERT INTO session_authentification (id_utilisateur, token, date_expiration, actif)
VALUES
    (1, 'token_admin_123456789', NOW() + INTERVAL '7 days', TRUE),
    (2, 'token_prestataire_987654321', NOW() + INTERVAL '7 days', TRUE),
    (3, 'token_visiteur_456789123', NOW() + INTERVAL '7 days', TRUE);

-- ============================================
-- INSERTIONS POUR LES EMPLACEMENTS
-- ============================================

INSERT INTO emplacements (nom_emplacement, coord_x, coord_y, zone, description)
VALUES
    ('Emplacement 1', 47.30532, 4.96457, 'Zone principale du festival', 'Emplacement libre'),
    ('Emplacement 2', 47.30519, 4.96433, 'Zone principale du festival', 'Emplacement libre'),
    ('Emplacement 3', 47.30508, 4.96423, 'Zone principale du festival', 'Emplacement libre'),
    ('Emplacement 4', 47.30545, 4.96470, 'parking 1', 'Emplacement libre'),
    ('Emplacement 5', 47.30520, 4.96440, 'parking 2', 'Emplacement libre'),
    ('Emplacement 6', 47.30535, 4.96445, 'Zone VIP', 'Emplacement libre'),
    ('Emplacement 7', 47.30515, 4.96425, 'camping', 'Emplacement libre'),
    ('Emplacement 8', 47.30525, 4.96435, 'MOTHERSHIP', 'Emplacement libre'),
    ('Emplacement 9', 47.30510, 4.96420, 'ZERO GRAVITY', 'Emplacement libre'),
    ('Emplacement 10', 47.30540, 4.96450, 'CARGO', 'Emplacement libre'),
    ('Emplacement 11', 47.30530, 4.96440, 'ANTDT CLUB', 'Emplacement libre'),
    ('Emplacement 12', 47.30522, 4.96438, 'Zone principale du festival', 'Emplacement libre'),
    ('Emplacement 13', 47.30512, 4.96428, 'Zone principale du festival', 'Emplacement libre'),
    ('Emplacement 14', 47.30502, 4.96418, 'parking 1', 'Emplacement libre'),
    ('Emplacement 15', 47.30538, 4.96448, 'parking 2', 'Emplacement libre'),
    ('Emplacement 16', 47.30528, 4.96438, 'Zone VIP', 'Emplacement libre'),
    ('Emplacement 17', 47.30518, 4.96428, 'camping', 'Emplacement libre'),
    ('Emplacement 18', 47.30542, 4.96452, 'MOTHERSHIP', 'Emplacement libre'),
    ('Emplacement 19', 47.30517, 4.96427, 'ZERO GRAVITY', 'Emplacement libre'),
    ('Emplacement 20', 47.30527, 4.96437, 'CARGO', 'Emplacement libre'),
    ('Emplacement 21', 47.30537, 4.96447, 'ANTDT CLUB', 'Emplacement libre'),
    ('Emplacement 22', 47.30507, 4.96417, 'Zone principale du festival', 'Emplacement libre'),
    ('Emplacement 23', 47.30533, 4.96443, 'Zone principale du festival', 'Emplacement libre'),
    ('Emplacement 24', 47.30523, 4.96433, 'parking 1', 'Emplacement libre'),
    ('Emplacement 25', 47.30513, 4.96423, 'parking 2', 'Emplacement libre');
