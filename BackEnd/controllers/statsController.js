const { sequelize, Utilisateur, Prestataire, Artiste, Service, Emplacement, Role, SessionAuthentification, PrestataireEmplacement, Billet, ReservationBillet, AvisFestival, Avis } = require('../models');
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

/**
 * GET /api/stats/reservations - Statistiques des réservations de billets
 */
exports.getReservationsStats = async (req, res) => {
    try {
        // Total réservations
        const totalReservations = await ReservationBillet.count();

        // Réservations par type de billet
        const reservationsParType = await ReservationBillet.findAll({
            attributes: [
                [sequelize.col('billet.type_billet'), 'type_billet'],
                [sequelize.fn('SUM', sequelize.col('quantite')), 'total_quantite'],
                [sequelize.fn('SUM', sequelize.col('prix_total')), 'total_revenue'],
                [sequelize.fn('COUNT', sequelize.col('ReservationBillet.id_reservation')), 'nb_reservations']
            ],
            include: [{
                model: Billet,
                as: 'billet',
                attributes: []
            }],
            group: ['billet.type_billet'],
            raw: true
        });

        // Revenu total
        const revenueResult = await ReservationBillet.findOne({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('prix_total')), 'total']
            ],
            raw: true
        });

        // Total tickets vendus
        const ticketsResult = await ReservationBillet.findOne({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('quantite')), 'total']
            ],
            raw: true
        });

        // Billets avec stock
        const billets = await Billet.findAll({
            where: { actif: true },
            attributes: ['type_billet', 'stock_disponible', 'stock_total', 'prix'],
            raw: true
        });

        // Construire ticketsParType
        const ticketsParType = {};
        reservationsParType.forEach(r => {
            ticketsParType[r.type_billet] = parseInt(r.total_quantite) || 0;
        });

        res.json({
            totalReservations,
            totalTickets: parseInt(ticketsResult?.total) || 0,
            totalRevenue: parseFloat(revenueResult?.total) || 0,
            ticketsParType,
            reservationsParType,
            billets
        });
    } catch (error) {
        console.error('Error fetching reservations stats:', error);
        res.status(500).json({ error: 'Failed to fetch reservations stats' });
    }
};

/**
 * GET /api/stats/avis-festival - Statistiques des avis sur le festival
 */
exports.getAvisFestivalStats = async (req, res) => {
    try {
        const avis = await AvisFestival.findAll({
            where: { valide: true },
            include: [{
                model: Utilisateur,
                as: 'utilisateur',
                attributes: ['nom_utilisateur']
            }],
            order: [['date_avis', 'DESC']]
        });

        const total = avis.length;
        let somme = 0;
        const repartition = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        avis.forEach(a => {
            somme += a.note;
            if (repartition[a.note] !== undefined) {
                repartition[a.note]++;
            }
        });

        const moyenne = total > 0 ? somme / total : 0;

        // Derniers avis avec nom d'utilisateur
        const dernierAvis = avis.slice(0, 20).map(a => ({
            id: a.id_avis_festival,
            note: a.note,
            commentaire: a.commentaire,
            date: a.date_avis,
            nom: a.utilisateur?.nom_utilisateur || 'Anonyme'
        }));

        res.json({
            totalAvisFestival: total,
            avisFestivalMoyenne: parseFloat(moyenne.toFixed(2)),
            repartitionNotesFestival: repartition,
            dernierAvisFestival: dernierAvis
        });
    } catch (error) {
        console.error('Error fetching avis festival stats:', error);
        res.status(500).json({ error: 'Failed to fetch avis festival stats' });
    }
};

/**
 * GET /api/stats/avis-prestataires - Statistiques globales des avis prestataires
 * Retourne le total, la moyenne et la répartition des notes des avis prestataires depuis la BDD
 */
exports.getAvisPrestatairesStats = async (req, res) => {
    try {
        const avis = await Avis.findAll({
            where: { valide: true },
            attributes: ['note'],
            raw: true
        });

        const total = avis.length;
        let somme = 0;
        const repartition = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        avis.forEach(a => {
            somme += a.note;
            if (repartition[a.note] !== undefined) {
                repartition[a.note]++;
            }
        });

        const moyenne = total > 0 ? somme / total : 0;

        res.json({
            totalAvis: total,
            notesMoyenne: parseFloat(moyenne.toFixed(2)),
            repartitionNotes: repartition
        });
    } catch (error) {
        console.error('Error fetching avis prestataires stats:', error);
        res.status(500).json({ error: 'Failed to fetch avis prestataires stats' });
    }
};

