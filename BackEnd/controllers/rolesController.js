const pool = require('../db');

/**
 * GET /api/roles - Récupérer tous les rôles (TRIVIAL)
 */
exports.getAllRoles = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM rôles ORDER BY id_rôle'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};

/**
 * GET /api/roles/:id - Récupérer un rôle par ID (TRIVIAL)
 */
exports.getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM rôles WHERE id_rôle = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Role not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({ error: 'Failed to fetch role' });
    }
};

/**
 * POST /api/roles - Créer un nouveau rôle (TRIVIAL)
 */
exports.createRole = async (req, res) => {
    try {
        const { nom_rôle } = req.body;

        if (!nom_rôle) {
            return res.status(400).json({ error: 'nom_rôle is required' });
        }

        const result = await pool.query(
            `INSERT INTO rôles (nom_rôle)
             VALUES ($1)
             RETURNING *`,
            [nom_rôle]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ error: 'Failed to create role' });
    }
};

