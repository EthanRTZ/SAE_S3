DROP TABLE IF EXISTS artiste;
DROP TABLE IF EXISTS prestataire;

-- Table des artistes
CREATE TABLE artiste (id_artiste INT AUTO_INCREMENT PRIMARY KEY,
                      nom VARCHAR(100) NOT NULL,
                      style_musique VARCHAR(100) NOT NULL,
                      description TEXT,
                      pays_origine VARCHAR(100),
                      site_web VARCHAR(255),
                      photo_url VARCHAR(255),
                      cachet DECIMAL(10,2),
                      date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des prestataires
CREATE TABLE prestataire (id_prestataire INT AUTO_INCREMENT PRIMARY KEY,
                          nom VARCHAR(100) NOT NULL,
                          type_prestataire VARCHAR(100) NOT NULL,
                          description TEXT,
                          services_proposes TEXT,
                          contact_email VARCHAR(150),
                          contact_tel VARCHAR(20),
                          site_web VARCHAR(255),
                          photo_url VARCHAR(255),
                          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


USE golden_coast;

-- Table Artistes
INSERT INTO artiste (nom, style_musique, description, pays_origine, site_web, photo_url, cachet)
VALUES
    ('Booba', 'Rap français', 'Légende du rap hexagonal, tête d’affiche du Golden Coast 2024.', 'France', 'https://boobaofficial.com', 'booba.jpg', 60000.00),
    ('SCH', 'Rap français', 'Artiste majeur programmé au Golden Coast 2024.', 'France', 'https://schrap.com', 'sch.jpg', 50000.00),
    ('SDM', 'Rap français', 'Nouvelle génération, présent au Golden Coast 2024.', 'France', 'https://sdmrap.com', 'sdm.jpg', 30000.00),
    ('Josman', 'Rap français', 'Confirmé pour la programmation du Golden Coast.', 'France', 'https://josmanmusic.com', 'josman.jpg', 25000.00),
    ('Ninho', 'Rap français', 'Figure du rap français, annoncé au Golden Coast 2024.', 'France', 'https://ninhoofficial.com', 'ninho.jpg', 55000.00),
    ('Gims', 'Pop / Rap français', 'Artiste programmé à l’édition 2025 du Golden Coast.', 'France', 'https://gims.com', 'gims.jpg', 65000.00);

-- Table Prestataires
INSERT INTO prestataire (nom, type_prestataire, description, services_proposes, contact_email, contact_tel, site_web, photo_url)
VALUES
    ('OTacos', 'Restauration rapide / Street-food', 'Enseigne française présente parmi les stands food & beverage du festival.', 'Tacos, burgers, frites pour les festivaliers.', 'contact@otacos.com', '+33 1 23 45 67 89', 'https://o-tacos.com', 'otacos.jpg'),
('Free', 'Télécommunications', 'Opérateur télécom partenaire du festival pour la couverture réseau.', 'Installation 4G/5G, bornes Wi-Fi, fibre.', 'partenariat@free.fr', '+33 1 98 76 54 32', 'https://free.fr', 'free.jpg'),
('Allianz', 'Assurance / Prévention', 'Partenaire prévention et sécurité du festival.', 'Stand prévention, éthylotests, sensibilisation sécurité.', 'contact@allianz.fr', '+33 1 45 67 89 10', 'https://allianz.fr', 'allianz.jpg'),
('Poliakov', 'Boissons / Spiritueux', 'Sponsor officiel du bar principal du Golden Coast.', 'Distribution de boissons, cocktails, espace lounge.', 'contact@poliakov.fr', '+33 1 56 98 45 32', 'https://poliakov.fr', 'poliakov.jpg'),
('Jack Daniel’s', 'Boissons / Spiritueux', 'Partenaire officiel du Golden Coast avec un bar éphémère.', 'Dégustation de whiskys, stand promotionnel.', 'contact@jackdaniels.com', '+33 1 87 65 43 21', 'https://jackdaniels.com', 'jackdaniels.jpg'),
('Red Bull', 'Boissons énergisantes', 'Partenaire énergie et animation du festival.', 'Bar Red Bull, distribution gratuite, espace chill.', 'info@redbull.com', '+43 1 87 65 90 12', 'https://redbull.com', 'redbull.jpg');
