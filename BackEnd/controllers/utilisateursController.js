const { Utilisateur, Role } = require('../models');
const bcrypt = require('bcrypt');

/**
 * GET /api/utilisateurs - Récupérer tous les utilisateurs (TRIVIAL)
 */
exports.getAllUtilisateurs = async (req, res) => {
    try {
        const utilisateurs = await Utilisateur.findAll({
            include: [{
                model: Role,
                as: 'role',
                attributes: ['nom_rôle']
            }],
            attributes: ['id_utilisateur', 'nom_utilisateur', 'email', 'date_creation'],
            order: [['id_utilisateur', 'ASC']]
        });
        res.json(utilisateurs);
    } catch (error) {
        console.error('Error fetching utilisateurs:', error);
        res.status(500).json({ error: 'Failed to fetch utilisateurs' });
    }
};

/**
 * GET /api/utilisateurs/:id - Récupérer un utilisateur par ID (TRIVIAL)
 */
exports.getUtilisateurById = async (req, res) => {
    try {
        const { id } = req.params;
        const utilisateur = await Utilisateur.findByPk(id, {
            include: [{
                model: Role,
                as: 'role',
                attributes: ['nom_rôle']
            }],
            attributes: ['id_utilisateur', 'nom_utilisateur', 'email', 'date_creation']
        });

        if (!utilisateur) {
            return res.status(404).json({ error: 'Utilisateur not found' });
        }

        res.json(utilisateur);
    } catch (error) {
        console.error('Error fetching utilisateur:', error);
        res.status(500).json({ error: 'Failed to fetch utilisateur' });
    }
};

/**
 * PUT /api/utilisateurs/:id - Mettre à jour un utilisateur (TRIVIAL)
 */
exports.updateUtilisateur = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom_utilisateur, email, mot_de_passe } = req.body;

        const utilisateur = await Utilisateur.findByPk(id);

        if (!utilisateur) {
            return res.status(404).json({ error: 'Utilisateur not found' });
        }

        const updateData = {
            nom_utilisateur: nom_utilisateur || utilisateur.nom_utilisateur,
            email: email || utilisateur.email
        };

        if (mot_de_passe) {
            updateData.mot_de_passe = await bcrypt.hash(mot_de_passe, 10);
        }

        await utilisateur.update(updateData);

        // Retourner sans le mot de passe
        const { mot_de_passe: _, ...utilisateurSafe } = utilisateur.toJSON();
        res.json(utilisateurSafe);
    } catch (error) {
        console.error('Error updating utilisateur:', error);
        res.status(500).json({ error: 'Failed to update utilisateur' });
    }
};

/**
 * DELETE /api/utilisateurs/:id - Supprimer un utilisateur (TRIVIAL)
 */
exports.deleteUtilisateur = async (req, res) => {
    try {
        const { id } = req.params;

        const utilisateur = await Utilisateur.findByPk(id, {
            attributes: ['id_utilisateur', 'nom_utilisateur', 'email']
        });

        if (!utilisateur) {
            return res.status(404).json({ error: 'Utilisateur not found' });
        }

        const deletedUtilisateur = utilisateur.toJSON();
        await utilisateur.destroy();

        res.json({ message: 'Utilisateur deleted successfully', utilisateur: deletedUtilisateur });
    } catch (error) {
        console.error('Error deleting utilisateur:', error);
        res.status(500).json({ error: 'Failed to delete utilisateur' });
    }
};

