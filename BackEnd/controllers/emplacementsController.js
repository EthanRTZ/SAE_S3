const pool = require('../db');

/**
 * GET /api/emplacements - Récupérer tous les emplacements
 */
exports.getAllEmplacements = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM emplacements ORDER BY id_emplacement'
        );
        res.json(result.rows);
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
        const result = await pool.query(
            'SELECT * FROM emplacements WHERE id_emplacement = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Emplacement not found' });
        }

        res.json(result.rows[0]);
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
        const { nom_emplacement, coord_x, coord_y, zone, description } = req.body;

        if (!nom_emplacement) {
            return res.status(400).json({ error: 'nom_emplacement is required' });
        }

        const result = await pool.query(
            `INSERT INTO emplacements (nom_emplacement, coord_x, coord_y, zone, description)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [nom_emplacement, coord_x, coord_y, zone, description]
        );

        res.status(201).json(result.rows[0]);
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
        const { nom_emplacement, coord_x, coord_y, zone, description } = req.body;

        const result = await pool.query(
            `UPDATE emplacements 
             SET nom_emplacement = COALESCE($1, nom_emplacement),
                 coord_x = COALESCE($2, coord_x),
                 coord_y = COALESCE($3, coord_y),
                 zone = COALESCE($4, zone),
                 description = COALESCE($5, description)
             WHERE id_emplacement = $6
             RETURNING *`,
            [nom_emplacement, coord_x, coord_y, zone, description, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Emplacement not found' });
        }

        res.json(result.rows[0]);
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

        const result = await pool.query(
            'DELETE FROM emplacements WHERE id_emplacement = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Emplacement not found' });
        }

        res.json({ message: 'Emplacement deleted successfully', emplacement: result.rows[0] });
    } catch (error) {
        console.error('Error deleting emplacement:', error);
        res.status(500).json({ error: 'Failed to delete emplacement' });
    }
};

