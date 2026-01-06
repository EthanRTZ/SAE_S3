const { Service, Prestataire } = require('../models');

/**
 * GET /api/services - Récupérer tous les services
 */
exports.getAllServices = async (req, res) => {
    try {
        const services = await Service.findAll({
            order: [['id_service', 'ASC']]
        });
        res.json(services);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
};

/**
 * GET /api/services/with-prestataires - Récupérer tous les services avec détails prestataire
 * NON-TRIVIAL: Interagit avec services + prestataire
 */
exports.getAllServicesWithPrestataires = async (req, res) => {
    try {
        const services = await Service.findAll({
            include: [{
                model: Prestataire,
                as: 'prestataire',
                attributes: ['nom', 'type_prestataire', 'description', 'contact_email', 'contact_tel', 'site_web', 'photo_url']
            }],
            order: [['id_service', 'ASC']]
        });
        res.json(services);
    } catch (error) {
        console.error('Error fetching services with prestataires:', error);
        res.status(500).json({ error: 'Failed to fetch services with prestataires' });
    }
};

/**
 * GET /api/services/:id - Récupérer un service par ID
 */
exports.getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await Service.findByPk(id);

        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.json(service);
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({ error: 'Failed to fetch service' });
    }
};

/**
 * POST /api/services - Créer un nouveau service
 */
exports.createService = async (req, res) => {
    try {
        const { id_prestataire, nom_service, description, prix_estime } = req.body;

        if (!id_prestataire || !nom_service) {
            return res.status(400).json({ error: 'id_prestataire and nom_service are required' });
        }

        const service = await Service.create({
            id_prestataire,
            nom_service,
            description,
            prix_estime
        });

        res.status(201).json(service);
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ error: 'Failed to create service' });
    }
};

/**
 * PUT /api/services/:id - Mettre à jour un service
 */
exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_prestataire, nom_service, description, prix_estime } = req.body;

        const service = await Service.findByPk(id);

        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        await service.update({
            id_prestataire: id_prestataire || service.id_prestataire,
            nom_service: nom_service || service.nom_service,
            description: description !== undefined ? description : service.description,
            prix_estime: prix_estime !== undefined ? prix_estime : service.prix_estime
        });

        res.json(service);
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Failed to update service' });
    }
};

/**
 * DELETE /api/services/:id - Supprimer un service
 */
exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findByPk(id);

        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        const deletedService = service.toJSON();
        await service.destroy();

        res.json({ message: 'Service deleted successfully', service: deletedService });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Failed to delete service' });
    }
};

