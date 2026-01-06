const pool = require('../db');

/**
 * GET /api/prestataires - Récupérer tous les prestataires
 */
exports.getAllPrestataires = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM prestataire ORDER BY id_prestataire'
        );
        res.json(result.rows);
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
        const result = await pool.query(
            'SELECT * FROM prestataire WHERE id_prestataire = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prestataire not found' });
        }

        res.json(result.rows[0]);
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

        const result = await pool.query(
            `INSERT INTO prestataire (nom, type_prestataire, description, contact_email, contact_tel, site_web, photo_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [nom, type_prestataire, description, contact_email, contact_tel, site_web, photo_url]
        );

        res.status(201).json(result.rows[0]);
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

        const result = await pool.query(
            `UPDATE prestataire 
             SET nom = COALESCE($1, nom),
                 type_prestataire = COALESCE($2, type_prestataire),
                 description = COALESCE($3, description),
                 contact_email = COALESCE($4, contact_email),
                 contact_tel = COALESCE($5, contact_tel),
                 site_web = COALESCE($6, site_web),
                 photo_url = COALESCE($7, photo_url)
             WHERE id_prestataire = $8
             RETURNING *`,
            [nom, type_prestataire, description, contact_email, contact_tel, site_web, photo_url, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prestataire not found' });
        }

        res.json(result.rows[0]);
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

        const result = await pool.query(
            'DELETE FROM prestataire WHERE id_prestataire = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prestataire not found' });
        }

        res.json({ message: 'Prestataire deleted successfully', prestataire: result.rows[0] });
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

        // Vérifier que le prestataire existe
        const prestataireResult = await pool.query(
            'SELECT * FROM prestataire WHERE id_prestataire = $1',
            [id]
        );

        if (prestataireResult.rows.length === 0) {
            return res.status(404).json({ error: 'Prestataire not found' });
        }

        // Récupérer tous les services du prestataire
        const servicesResult = await pool.query(
            `SELECT s.*, p.nom as nom_prestataire, p.type_prestataire
             FROM services s
             JOIN prestataire p ON s.id_prestataire = p.id_prestataire
             WHERE s.id_prestataire = $1
             ORDER BY s.id_service`,
            [id]
        );

        res.json({
            prestataire: prestataireResult.rows[0],
            services: servicesResult.rows
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

        // Vérifier que le prestataire existe
        const prestataireResult = await pool.query(
            'SELECT * FROM prestataire WHERE id_prestataire = $1',
            [id]
        );

        if (prestataireResult.rows.length === 0) {
            return res.status(404).json({ error: 'Prestataire not found' });
        }

        // Récupérer tous les emplacements du prestataire
        const emplacementsResult = await pool.query(
            `SELECT e.*
             FROM emplacements e
             JOIN prestataire_emplacement pe ON e.id_emplacement = pe.id_emplacement
             WHERE pe.id_prestataire = $1
             ORDER BY e.id_emplacement`,
            [id]
        );

        res.json({
            prestataire: prestataireResult.rows[0],
            emplacements: emplacementsResult.rows
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
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { id_emplacement } = req.body;

        if (!id_emplacement) {
            return res.status(400).json({ error: 'id_emplacement is required' });
        }

        await client.query('BEGIN');

        // Vérifier que le prestataire existe
        const prestataireResult = await client.query(
            'SELECT * FROM prestataire WHERE id_prestataire = $1',
            [id]
        );

        if (prestataireResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Prestataire not found' });
        }

        // Vérifier que l'emplacement existe
        const emplacementResult = await client.query(
            'SELECT * FROM emplacements WHERE id_emplacement = $1',
            [id_emplacement]
        );

        if (emplacementResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Emplacement not found' });
        }

        // Vérifier si l'association existe déjà
        const existingAssoc = await client.query(
            'SELECT * FROM prestataire_emplacement WHERE id_prestataire = $1 AND id_emplacement = $2',
            [id, id_emplacement]
        );

        if (existingAssoc.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'This emplacement is already assigned to this prestataire' });
        }

        // Créer l'association
        await client.query(
            `INSERT INTO prestataire_emplacement (id_prestataire, id_emplacement)
             VALUES ($1, $2)`,
            [id, id_emplacement]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Emplacement assigned successfully',
            prestataire: prestataireResult.rows[0],
            emplacement: emplacementResult.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error assigning emplacement:', error);
        res.status(500).json({ error: 'Failed to assign emplacement' });
    } finally {
        client.release();
    }
};

/**
 * DELETE /api/prestataires/:id/emplacements/:idEmplacement - Retirer un emplacement d'un prestataire
 * NON-TRIVIAL: Interagit avec prestataire + emplacements + prestataire_emplacement
 */
exports.removeEmplacementFromPrestataire = async (req, res) => {
    try {
        const { id, idEmplacement } = req.params;

        const result = await pool.query(
            'DELETE FROM prestataire_emplacement WHERE id_prestataire = $1 AND id_emplacement = $2 RETURNING *',
            [id, idEmplacement]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Association not found' });
        }

        res.json({ message: 'Emplacement removed successfully' });
    } catch (error) {
        console.error('Error removing emplacement:', error);
        res.status(500).json({ error: 'Failed to remove emplacement' });
    }
};

