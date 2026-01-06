const pool = require('../db');

/**
 * GET /api/services - Récupérer tous les services
 */
exports.getAllServices = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM services ORDER BY id_service'
        );
        res.json(result.rows);
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
        const result = await pool.query(
            `SELECT s.*, 
                    p.nom as nom_prestataire, 
                    p.type_prestataire, 
                    p.description as description_prestataire,
                    p.contact_email,
                    p.contact_tel,
                    p.site_web,
                    p.photo_url as photo_prestataire
             FROM services s
             JOIN prestataire p ON s.id_prestataire = p.id_prestataire
             ORDER BY s.id_service`
        );
        res.json(result.rows);
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
        const result = await pool.query(
            'SELECT * FROM services WHERE id_service = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.json(result.rows[0]);
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

        const result = await pool.query(
            `INSERT INTO services (id_prestataire, nom_service, description, prix_estime)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [id_prestataire, nom_service, description, prix_estime]
        );

        res.status(201).json(result.rows[0]);
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

        const result = await pool.query(
            `UPDATE services 
             SET id_prestataire = COALESCE($1, id_prestataire),
                 nom_service = COALESCE($2, nom_service),
                 description = COALESCE($3, description),
                 prix_estime = COALESCE($4, prix_estime)
             WHERE id_service = $5
             RETURNING *`,
            [id_prestataire, nom_service, description, prix_estime, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.json(result.rows[0]);
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

        const result = await pool.query(
            'DELETE FROM services WHERE id_service = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.json({ message: 'Service deleted successfully', service: result.rows[0] });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Failed to delete service' });
    }
};

