const { Role } = require('../models');

/**
 * GET /api/roles - Récupérer tous les rôles (TRIVIAL)
 */
exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.findAll({
            order: [['id_rôle', 'ASC']]
        });
        res.json(roles);
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
        const role = await Role.findByPk(id);

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        res.json(role);
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

        const role = await Role.create({ nom_rôle });

        res.status(201).json(role);
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ error: 'Failed to create role' });
    }
};

