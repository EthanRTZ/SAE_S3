const pool = require('../db');

/**
 * GET /api/stats/dashboard - Statistiques globales du dashboard
 * NON-TRIVIAL: Récupère des statistiques de plusieurs tables
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // Compte total des utilisateurs
        const usersCount = await pool.query('SELECT COUNT(*) as total FROM utilisateurs');

        // Compte total des prestataires
        const prestatairesCount = await pool.query('SELECT COUNT(*) as total FROM prestataire');

        // Compte total des artistes
        const artistesCount = await pool.query('SELECT COUNT(*) as total FROM artiste');

        // Compte total des services
        const servicesCount = await pool.query('SELECT COUNT(*) as total FROM services');

        // Compte total des emplacements
        const emplacementsCount = await pool.query('SELECT COUNT(*) as total FROM emplacements');

        // Distribution des utilisateurs par rôle
        const usersByRole = await pool.query(
            `SELECT r.nom_rôle, COUNT(u.id_utilisateur) as count
             FROM rôles r
             LEFT JOIN utilisateurs u ON r.id_rôle = u.id_rôle
             GROUP BY r.nom_rôle
             ORDER BY count DESC`
        );

        // Distribution des prestataires par type
        const prestatairesByType = await pool.query(
            `SELECT type_prestataire, COUNT(*) as count
             FROM prestataire
             GROUP BY type_prestataire
             ORDER BY count DESC`
        );

        // Sessions actives
        const activeSessions = await pool.query(
            `SELECT COUNT(*) as total 
             FROM session_authentification 
             WHERE actif = TRUE AND date_expiration > NOW()`
        );

        // Artistes avec cachet moyen
        const averageCachet = await pool.query(
            'SELECT AVG(cachet) as moyenne FROM artiste WHERE cachet IS NOT NULL'
        );

        res.json({
            totalUtilisateurs: parseInt(usersCount.rows[0].total),
            totalPrestataires: parseInt(prestatairesCount.rows[0].total),
            totalArtistes: parseInt(artistesCount.rows[0].total),
            totalServices: parseInt(servicesCount.rows[0].total),
            totalEmplacements: parseInt(emplacementsCount.rows[0].total),
            sessionsActives: parseInt(activeSessions.rows[0].total),
            utilisateursParRole: usersByRole.rows,
            prestatairesParType: prestatairesByType.rows,
            cachetMoyen: parseFloat(averageCachet.rows[0].moyenne || 0)
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

/**
 * GET /api/stats/prestataires - Statistiques sur les prestataires
 * NON-TRIVIAL: Récupère les prestataires avec le nombre de services et emplacements
 */
exports.getPrestatairesStats = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                p.id_prestataire,
                p.nom,
                p.type_prestataire,
                COUNT(DISTINCT s.id_service) as nb_services,
                COUNT(DISTINCT pe.id_emplacement) as nb_emplacements
             FROM prestataire p
             LEFT JOIN services s ON p.id_prestataire = s.id_prestataire
             LEFT JOIN prestataire_emplacement pe ON p.id_prestataire = pe.id_prestataire
             GROUP BY p.id_prestataire, p.nom, p.type_prestataire
             ORDER BY nb_services DESC, nb_emplacements DESC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching prestataires stats:', error);
        res.status(500).json({ error: 'Failed to fetch prestataires stats' });
    }
};

/**
 * GET /api/stats/emplacements - Statistiques sur les emplacements
 * NON-TRIVIAL: Récupère les emplacements avec le nombre de prestataires assignés
 */
exports.getEmplacementsStats = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                e.id_emplacement,
                e.nom_emplacement,
                e.zone,
                COUNT(pe.id_prestataire) as nb_prestataires
             FROM emplacements e
             LEFT JOIN prestataire_emplacement pe ON e.id_emplacement = pe.id_emplacement
             GROUP BY e.id_emplacement, e.nom_emplacement, e.zone
             ORDER BY nb_prestataires DESC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching emplacements stats:', error);
        res.status(500).json({ error: 'Failed to fetch emplacements stats' });
    }
};

/**
 * GET /api/stats/artistes - Statistiques sur les artistes
 */
exports.getArtistesStats = async (req, res) => {
    try {
        // Récupération des artistes avec statistiques
        const result = await pool.query(
            `SELECT 
                style_musique,
                COUNT(*) as nb_artistes,
                AVG(cachet) as cachet_moyen,
                MIN(cachet) as cachet_min,
                MAX(cachet) as cachet_max
             FROM artiste
             WHERE cachet IS NOT NULL
             GROUP BY style_musique
             ORDER BY nb_artistes DESC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching artistes stats:', error);
        res.status(500).json({ error: 'Failed to fetch artistes stats' });
    }
};

