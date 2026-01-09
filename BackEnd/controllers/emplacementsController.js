const { Emplacement } = require('../models');

/**
 * GET /api/emplacements - Récupérer tous les emplacements
 */
exports.getAllEmplacements = async (req, res) => {
    try {
        const emplacements = await Emplacement.findAll({
            order: [['id_emplacement', 'ASC']]
        });
        res.json(emplacements);
    } catch (error) {
        console.error('Error fetching emplacements:', error);
        res.status(500).json({ error: 'Failed to fetch emplacements' });
    }
};

/**
 * GET /api/emplacements/:id - Récupérer un emplacement par ID
 */
exports.getEmplacementById = async (req, res) => {
    try {
        const { id } = req.params;
        const emplacement = await Emplacement.findByPk(id);

        if (!emplacement) {
            return res.status(404).json({ error: 'Emplacement not found' });
        }

        res.json(emplacement);
    } catch (error) {
        console.error('Error fetching emplacement:', error);
        res.status(500).json({ error: 'Failed to fetch emplacement' });
    }
};

/**
 * POST /api/emplacements - Créer un nouvel emplacement
 */
exports.createEmplacement = async (req, res) => {
    try {
        const { 
            nom_emplacement, 
            coord_x, 
            coord_y, 
            coordonnees_completes,
            id_zone,
            statut,
            description,
            moyens_logistiques,
            surface_volume,
            nombre_prises,
            acces_eau
        } = req.body;

        const emplacement = await Emplacement.create({
            nom_emplacement,
            coord_x,
            coord_y,
            coordonnees_completes,
            id_zone,
            statut: statut || 'libre',
            description,
            moyens_logistiques,
            surface_volume,
            nombre_prises,
            acces_eau: acces_eau || false
        });

        res.status(201).json(emplacement);
    } catch (error) {
        console.error('Error creating emplacement:', error);
        res.status(500).json({ error: 'Failed to create emplacement' });
    }
};

/**
 * PUT /api/emplacements/:id - Mettre à jour un emplacement
 */
exports.updateEmplacement = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nom_emplacement, 
            coord_x, 
            coord_y, 
            coordonnees_completes,
            id_zone,
            statut,
            description,
            moyens_logistiques,
            surface_volume,
            nombre_prises,
            acces_eau
        } = req.body;

        const emplacement = await Emplacement.findByPk(id);

        if (!emplacement) {
            return res.status(404).json({ error: 'Emplacement not found' });
        }

        await emplacement.update({
            nom_emplacement: nom_emplacement !== undefined ? nom_emplacement : emplacement.nom_emplacement,
            coord_x: coord_x !== undefined ? coord_x : emplacement.coord_x,
            coord_y: coord_y !== undefined ? coord_y : emplacement.coord_y,
            coordonnees_completes: coordonnees_completes !== undefined ? coordonnees_completes : emplacement.coordonnees_completes,
            id_zone: id_zone !== undefined ? id_zone : emplacement.id_zone,
            statut: statut !== undefined ? statut : emplacement.statut,
            description: description !== undefined ? description : emplacement.description,
            moyens_logistiques: moyens_logistiques !== undefined ? moyens_logistiques : emplacement.moyens_logistiques,
            surface_volume: surface_volume !== undefined ? surface_volume : emplacement.surface_volume,
            nombre_prises: nombre_prises !== undefined ? nombre_prises : emplacement.nombre_prises,
            acces_eau: acces_eau !== undefined ? acces_eau : emplacement.acces_eau
        });

        res.json(emplacement);
    } catch (error) {
        console.error('Error updating emplacement:', error);
        res.status(500).json({ error: 'Failed to update emplacement' });
    }
};

/**
 * DELETE /api/emplacements/:id - Supprimer un emplacement
 */
exports.deleteEmplacement = async (req, res) => {
    try {
        const { id } = req.params;

        const emplacement = await Emplacement.findByPk(id);

        if (!emplacement) {
            return res.status(404).json({ error: 'Emplacement not found' });
        }

        const deletedEmplacement = emplacement.toJSON();
        await emplacement.destroy();

        res.json({ message: 'Emplacement deleted successfully', emplacement: deletedEmplacement });
    } catch (error) {
        console.error('Error deleting emplacement:', error);
        res.status(500).json({ error: 'Failed to delete emplacement' });
    }
};

