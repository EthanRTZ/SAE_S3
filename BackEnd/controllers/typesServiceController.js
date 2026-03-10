const { TypeService, Service, Prestataire } = require('../models');

/**
 * GET /api/types-service - Récupérer tous les types de service
 */
exports.getAllTypesService = async (req, res) => {
    try {
        const types = await TypeService.findAll({
            order: [['id_type_service', 'ASC']]
        });
        res.json(types);
    } catch (error) {
        console.error('Error fetching types de service:', error);
        res.status(500).json({ error: 'Failed to fetch types de service' });
    }
};

/**
 * GET /api/types-service/:id - Récupérer un type de service par ID
 */
exports.getTypeServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const type = await TypeService.findByPk(id);

        if (!type) {
            return res.status(404).json({ error: 'Type de service not found' });
        }

        res.json(type);
    } catch (error) {
        console.error('Error fetching type de service:', error);
        res.status(500).json({ error: 'Failed to fetch type de service' });
    }
};

/**
 * GET /api/types-service/:id/services - Récupérer tous les services d'un type donné
 */
exports.getServicesByType = async (req, res) => {
    try {
        const { id } = req.params;
        const type = await TypeService.findByPk(id);

        if (!type) {
            return res.status(404).json({ error: 'Type de service not found' });
        }

        const services = await Service.findAll({
            where: { id_type_service: id },
            include: [{
                model: Prestataire,
                as: 'prestataire',
                attributes: ['id_prestataire', 'nom', 'type_prestataire', 'description_fr', 'description_en', 'photo_url']
            }],
            order: [['id_service', 'ASC']]
        });

        res.json({
            type,
            services
        });
    } catch (error) {
        console.error('Error fetching services by type:', error);
        res.status(500).json({ error: 'Failed to fetch services by type' });
    }
};

/**
 * GET /api/types-service/nom/:nom/services - Récupérer les services par nom de type
 */
exports.getServicesByTypeName = async (req, res) => {
    try {
        const { nom } = req.params;
        const type = await TypeService.findOne({ where: { nom } });

        if (!type) {
            return res.status(404).json({ error: 'Type de service not found' });
        }

        const services = await Service.findAll({
            where: { id_type_service: type.id_type_service },
            include: [{
                model: Prestataire,
                as: 'prestataire',
                attributes: ['id_prestataire', 'nom', 'type_prestataire', 'description_fr', 'description_en', 'photo_url']
            }],
            order: [['id_service', 'ASC']]
        });

        res.json({
            type,
            services
        });
    } catch (error) {
        console.error('Error fetching services by type name:', error);
        res.status(500).json({ error: 'Failed to fetch services by type name' });
    }
};

