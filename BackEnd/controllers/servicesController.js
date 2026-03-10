const { Service, Prestataire, TypeService } = require('../models');

/**
 * GET /api/services - Récupérer tous les services
 */
exports.getAllServices = async (req, res) => {
    try {
        const services = await Service.findAll({
            include: [{
                model: TypeService,
                as: 'typeService',
                attributes: ['id_type_service', 'nom', 'label_fr', 'label_en', 'icone', 'champs_requis']
            }],
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
                attributes: ['id_prestataire', 'nom', 'type_prestataire', 'description_fr', 'description_en', 'contact_email', 'contact_tel', 'site_web', 'photo_url']
            }, {
                model: TypeService,
                as: 'typeService',
                attributes: ['id_type_service', 'nom', 'label_fr', 'label_en', 'icone', 'champs_requis']
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
        const service = await Service.findByPk(id, {
            include: [{
                model: TypeService,
                as: 'typeService',
                attributes: ['id_type_service', 'nom', 'label_fr', 'label_en', 'icone', 'champs_requis']
            }]
        });

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
        const { id_prestataire, id_type_service, nom_service_fr, nom_service_en, nom_service, description_fr, description_en, description, prix_estime, champs_specifiques } = req.body;

        if (!id_prestataire || (!nom_service_fr && !nom_service)) {
            return res.status(400).json({ error: 'id_prestataire and nom_service_fr (or nom_service) are required' });
        }

        // Gérer nom_service bilingue : si nom_service est un objet {fr, en}, l'extraire
        let nomFr = nom_service_fr;
        let nomEn = nom_service_en;
        if (nom_service && typeof nom_service === 'object') {
            nomFr = nom_service.fr || nom_service_fr;
            nomEn = nom_service.en || nom_service_en;
        } else if (nom_service && typeof nom_service === 'string') {
            nomFr = nom_service;
        }

        // Gérer description bilingue : si description est un objet {fr, en}, l'extraire
        let descFr = description_fr;
        let descEn = description_en;
        if (description && typeof description === 'object') {
            descFr = description.fr || description_fr;
            descEn = description.en || description_en;
        } else if (description && typeof description === 'string') {
            descFr = description;
        }

        const service = await Service.create({
            id_prestataire,
            id_type_service: id_type_service || null,
            nom_service_fr: nomFr,
            nom_service_en: nomEn,
            description_fr: descFr,
            description_en: descEn,
            prix_estime,
            champs_specifiques: champs_specifiques || {}
        });

        // Recharger avec l'association TypeService
        const serviceWithType = await Service.findByPk(service.id_service, {
            include: [{
                model: TypeService,
                as: 'typeService',
                attributes: ['id_type_service', 'nom', 'label_fr', 'label_en', 'icone', 'champs_requis']
            }]
        });

        res.status(201).json(serviceWithType);
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
        const { id_prestataire, id_type_service, nom_service_fr, nom_service_en, nom_service, description_fr, description_en, description, prix_estime, champs_specifiques } = req.body;

        const service = await Service.findByPk(id);

        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        // Gérer nom_service bilingue : si nom_service est un objet {fr, en}, l'extraire
        let nomFr = nom_service_fr !== undefined ? nom_service_fr : service.nom_service_fr;
        let nomEn = nom_service_en !== undefined ? nom_service_en : service.nom_service_en;
        if (nom_service !== undefined && typeof nom_service === 'object') {
            nomFr = nom_service.fr !== undefined ? nom_service.fr : nomFr;
            nomEn = nom_service.en !== undefined ? nom_service.en : nomEn;
        } else if (nom_service !== undefined && typeof nom_service === 'string') {
            nomFr = nom_service;
        }

        // Gérer description bilingue : si description est un objet {fr, en}, l'extraire
        let descFr = description_fr !== undefined ? description_fr : service.description_fr;
        let descEn = description_en !== undefined ? description_en : service.description_en;
        if (description !== undefined && typeof description === 'object') {
            descFr = description.fr !== undefined ? description.fr : descFr;
            descEn = description.en !== undefined ? description.en : descEn;
        } else if (description !== undefined && typeof description === 'string') {
            descFr = description;
        }

        await service.update({
            id_prestataire: id_prestataire !== undefined ? id_prestataire : service.id_prestataire,
            id_type_service: id_type_service !== undefined ? id_type_service : service.id_type_service,
            nom_service_fr: nomFr,
            nom_service_en: nomEn,
            description_fr: descFr,
            description_en: descEn,
            prix_estime: prix_estime !== undefined ? prix_estime : service.prix_estime,
            champs_specifiques: champs_specifiques !== undefined ? champs_specifiques : service.champs_specifiques
        });

        // Recharger avec l'association TypeService
        const serviceWithType = await Service.findByPk(service.id_service, {
            include: [{
                model: TypeService,
                as: 'typeService',
                attributes: ['id_type_service', 'nom', 'label_fr', 'label_en', 'icone', 'champs_requis']
            }]
        });

        res.json(serviceWithType);
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

