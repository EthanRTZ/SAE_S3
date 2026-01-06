const { sequelize, Utilisateur, Prestataire, Artiste, Service, Emplacement, Role, SessionAuthentification, PrestataireEmplacement } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/stats/dashboard - Statistiques globales du dashboard
 * NON-TRIVIAL: Récupère des statistiques de plusieurs tables
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // Compte total des utilisateurs
        const totalUtilisateurs = await Utilisateur.count();

        // Compte total des prestataires
        const totalPrestataires = await Prestataire.count();

        // Compte total des artistes
        const totalArtistes = await Artiste.count();

        // Compte total des services
        const totalServices = await Service.count();

        // Compte total des emplacements
        const totalEmplacements = await Emplacement.count();

        // Distribution des utilisateurs par rôle
        const usersByRole = await Role.findAll({
            attributes: [
                'nom_rôle',
                [sequelize.fn('COUNT', sequelize.col('utilisateurs.id_utilisateur')), 'count']
            ],
            include: [{
                model: Utilisateur,
                as: 'utilisateurs',
                attributes: []
            }],
            group: ['Role.id_rôle', 'Role.nom_rôle'],
            order: [[sequelize.fn('COUNT', sequelize.col('utilisateurs.id_utilisateur')), 'DESC']],
            raw: true
        });

        // Distribution des prestataires par type
        const prestatairesByType = await Prestataire.findAll({
            attributes: [
                'type_prestataire',
                [sequelize.fn('COUNT', sequelize.col('id_prestataire')), 'count']
            ],
            group: ['type_prestataire'],
            order: [[sequelize.fn('COUNT', sequelize.col('id_prestataire')), 'DESC']],
            raw: true
        });

        // Sessions actives
        const sessionsActives = await SessionAuthentification.count({
            where: {
                actif: true,
                date_expiration: {
                    [Op.gt]: new Date()
                }
            }
        });

        // Artistes avec cachet moyen
        const cachetStats = await Artiste.findOne({
            attributes: [
                [sequelize.fn('AVG', sequelize.col('cachet')), 'moyenne']
            ],
            where: {
                cachet: {
                    [Op.ne]: null
                }
            },
            raw: true
        });

        res.json({
            totalUtilisateurs,
            totalPrestataires,
            totalArtistes,
            totalServices,
            totalEmplacements,
            sessionsActives,
            utilisateursParRole: usersByRole,
            prestatairesParType: prestatairesByType,
            cachetMoyen: parseFloat(cachetStats?.moyenne || 0)
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
        const result = await Prestataire.findAll({
            attributes: [
                'id_prestataire',
                'nom',
                'type_prestataire',
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('services.id_service'))), 'nb_services'],
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('emplacements.id_emplacement'))), 'nb_emplacements']
            ],
            include: [
                {
                    model: Service,
                    as: 'services',
                    attributes: []
                },
                {
                    model: Emplacement,
                    as: 'emplacements',
                    attributes: [],
                    through: { attributes: [] }
                }
            ],
            group: ['Prestataire.id_prestataire', 'Prestataire.nom', 'Prestataire.type_prestataire'],
            order: [
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('services.id_service'))), 'DESC'],
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('emplacements.id_emplacement'))), 'DESC']
            ],
            raw: true
        });

        res.json(result);
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
        const result = await Emplacement.findAll({
            attributes: [
                'id_emplacement',
                'nom_emplacement',
                'zone',
                [sequelize.fn('COUNT', sequelize.col('prestataires.id_prestataire')), 'nb_prestataires']
            ],
            include: [{
                model: Prestataire,
                as: 'prestataires',
                attributes: [],
                through: { attributes: [] }
            }],
            group: ['Emplacement.id_emplacement', 'Emplacement.nom_emplacement', 'Emplacement.zone'],
            order: [[sequelize.fn('COUNT', sequelize.col('prestataires.id_prestataire')), 'DESC']],
            raw: true
        });

        res.json(result);
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
        const result = await Artiste.findAll({
            attributes: [
                'style_musique',
                [sequelize.fn('COUNT', sequelize.col('id_artiste')), 'nb_artistes'],
                [sequelize.fn('AVG', sequelize.col('cachet')), 'cachet_moyen'],
                [sequelize.fn('MIN', sequelize.col('cachet')), 'cachet_min'],
                [sequelize.fn('MAX', sequelize.col('cachet')), 'cachet_max']
            ],
            where: {
                cachet: {
                    [Op.ne]: null
                }
            },
            group: ['style_musique'],
            order: [[sequelize.fn('COUNT', sequelize.col('id_artiste')), 'DESC']],
            raw: true
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching artistes stats:', error);
        res.status(500).json({ error: 'Failed to fetch artistes stats' });
    }
};

