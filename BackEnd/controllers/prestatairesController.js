const { Prestataire, Service, Emplacement, PrestataireEmplacement } = require('../models');

/**
 * GET /api/prestataires - Récupérer tous les prestataires
 */
exports.getAllPrestataires = async (req, res) => {
    try {
        const prestataires = await Prestataire.findAll({
            order: [['id_prestataire', 'ASC']]
        });
        res.json(prestataires);
    } catch (error) {
        console.error('Error fetching prestataires:', error);
        res.status(500).json({ error: 'Failed to fetch prestataires' });
    }
};

/**
 * GET /api/prestataires/:id - Récupérer un prestataire par ID
 */
exports.getPrestataireById = async (req, res) => {
    try {
        const { id } = req.params;
        const prestataire = await Prestataire.findByPk(id);

        if (!prestataire) {
            return res.status(404).json({ error: 'Prestataire not found' });
        }

        res.json(prestataire);
    } catch (error) {
        console.error('Error fetching prestataire:', error);
        res.status(500).json({ error: 'Failed to fetch prestataire' });
    }
};

/**
 * POST /api/prestataires - Créer un nouveau prestataire
 */
exports.createPrestataire = async (req, res) => {
    try {
        const { nom, type_prestataire, description, contact_email, contact_tel, site_web, photo_url } = req.body;

        if (!nom || !type_prestataire) {
            return res.status(400).json({ error: 'Nom and type_prestataire are required' });
        }

        const prestataire = await Prestataire.create({
            nom,
            type_prestataire,
            description,
            contact_email,
            contact_tel,
            site_web,
            photo_url
        });

        res.status(201).json(prestataire);
    } catch (error) {
        console.error('Error creating prestataire:', error);
        res.status(500).json({ error: 'Failed to create prestataire' });
    }
};

/**
 * PUT /api/prestataires/:id - Mettre à jour un prestataire
 */
exports.updatePrestataire = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, type_prestataire, description, contact_email, contact_tel, site_web, photo_url } = req.body;

        const prestataire = await Prestataire.findByPk(id);

        if (!prestataire) {
            return res.status(404).json({ error: 'Prestataire not found' });
        }

        await prestataire.update({
            nom: nom || prestataire.nom,
            type_prestataire: type_prestataire || prestataire.type_prestataire,
            description: description !== undefined ? description : prestataire.description,
            contact_email: contact_email !== undefined ? contact_email : prestataire.contact_email,
            contact_tel: contact_tel !== undefined ? contact_tel : prestataire.contact_tel,
            site_web: site_web !== undefined ? site_web : prestataire.site_web,
            photo_url: photo_url !== undefined ? photo_url : prestataire.photo_url
        });

        res.json(prestataire);
    } catch (error) {
        console.error('Error updating prestataire:', error);
        res.status(500).json({ error: 'Failed to update prestataire' });
    }
};

/**
 * DELETE /api/prestataires/:id - Supprimer un prestataire
 */
exports.deletePrestataire = async (req, res) => {
    try {
        const { id } = req.params;

        const prestataire = await Prestataire.findByPk(id);

        if (!prestataire) {
            return res.status(404).json({ error: 'Prestataire not found' });
        }

        const deletedPrestataire = prestataire.toJSON();
        await prestataire.destroy();

        res.json({ message: 'Prestataire deleted successfully', prestataire: deletedPrestataire });
    } catch (error) {
        console.error('Error deleting prestataire:', error);
        res.status(500).json({ error: 'Failed to delete prestataire' });
    }
};

/**
 * GET /api/prestataires/:id/services - Récupérer les services d'un prestataire
 * NON-TRIVIAL: Interagit avec prestataire + services
 */
exports.getPrestataireServices = async (req, res) => {
    try {
        const { id } = req.params;

        const prestataire = await Prestataire.findByPk(id, {
            include: [{
                model: Service,
                as: 'services'
            }]
        });

        if (!prestataire) {
            return res.status(404).json({ error: 'Prestataire not found' });
        }

        res.json({
            prestataire: {
                id_prestataire: prestataire.id_prestataire,
                nom: prestataire.nom,
                type_prestataire: prestataire.type_prestataire
            },
            services: prestataire.services
        });
    } catch (error) {
        console.error('Error fetching prestataire services:', error);
        res.status(500).json({ error: 'Failed to fetch prestataire services' });
    }
};

/**
 * GET /api/prestataires/:id/emplacements - Récupérer les emplacements d'un prestataire
 * NON-TRIVIAL: Interagit avec prestataire + emplacements + prestataire_emplacement
 */
exports.getPrestataireEmplacements = async (req, res) => {
    try {
        const { id } = req.params;

        const prestataire = await Prestataire.findByPk(id, {
            include: [{
                model: Emplacement,
                as: 'emplacements',
                through: { attributes: [] } // Exclure les attributs de la table de liaison
            }]
        });

        if (!prestataire) {
            return res.status(404).json({ error: 'Prestataire not found' });
        }

        res.json({
            prestataire: {
                id_prestataire: prestataire.id_prestataire,
                nom: prestataire.nom,
                type_prestataire: prestataire.type_prestataire
            },
            emplacements: prestataire.emplacements
        });
    } catch (error) {
        console.error('Error fetching prestataire emplacements:', error);
        res.status(500).json({ error: 'Failed to fetch prestataire emplacements' });
    }
};

/**
 * POST /api/prestataires/:id/emplacements - Assigner un emplacement à un prestataire
 * NON-TRIVIAL: Interagit avec prestataire + emplacements + prestataire_emplacement
 */
exports.assignEmplacementToPrestataire = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_emplacement } = req.body;

        if (!id_emplacement) {
            return res.status(400).json({ error: 'id_emplacement is required' });
        }

        // Vérifier que le prestataire existe
        const prestataire = await Prestataire.findByPk(id);
        if (!prestataire) {
            return res.status(404).json({ error: 'Prestataire not found' });
        }

        // Vérifier que l'emplacement existe
        const emplacement = await Emplacement.findByPk(id_emplacement);
        if (!emplacement) {
            return res.status(404).json({ error: 'Emplacement not found' });
        }

        // Vérifier si l'association existe déjà
        const existingAssoc = await PrestataireEmplacement.findOne({
            where: {
                id_prestataire: id,
                id_emplacement: id_emplacement
            }
        });

        if (existingAssoc) {
            return res.status(409).json({ error: 'This emplacement is already assigned to this prestataire' });
        }

        // Créer l'association
        await PrestataireEmplacement.create({
            id_prestataire: id,
            id_emplacement: id_emplacement
        });

        res.status(201).json({
            message: 'Emplacement assigned successfully',
            prestataire: prestataire.toJSON(),
            emplacement: emplacement.toJSON()
        });
    } catch (error) {
        console.error('Error assigning emplacement:', error);
        res.status(500).json({ error: 'Failed to assign emplacement' });
    }
};

/**
 * DELETE /api/prestataires/:id/emplacements/:idEmplacement - Retirer un emplacement d'un prestataire
 * NON-TRIVIAL: Interagit avec prestataire + emplacements + prestataire_emplacement
 */
exports.removeEmplacementFromPrestataire = async (req, res) => {
    try {
        const { id, idEmplacement } = req.params;

        const association = await PrestataireEmplacement.findOne({
            where: {
                id_prestataire: id,
                id_emplacement: idEmplacement
            }
        });

        if (!association) {
            return res.status(404).json({ error: 'Association not found' });
        }

        await association.destroy();

        res.json({ message: 'Emplacement removed successfully' });
    } catch (error) {
        console.error('Error removing emplacement:', error);
        res.status(500).json({ error: 'Failed to remove emplacement' });
    }
};

