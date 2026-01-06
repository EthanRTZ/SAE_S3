const pool = require('../db');
const bcrypt = require('bcrypt');

/**
 * GET /api/utilisateurs - Récupérer tous les utilisateurs (TRIVIAL)
 */
exports.getAllUtilisateurs = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.id_utilisateur, u.nom_utilisateur, u.email, u.date_creation, r.nom_rôle
             FROM utilisateurs u
             JOIN rôles r ON u.id_rôle = r.id_rôle
             ORDER BY u.id_utilisateur`
        );
        res.json(result.rows);
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
        const result = await pool.query(
            `SELECT u.id_utilisateur, u.nom_utilisateur, u.email, u.date_creation, r.nom_rôle
             FROM utilisateurs u
             JOIN rôles r ON u.id_rôle = r.id_rôle
             WHERE u.id_utilisateur = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur not found' });
        }

        res.json(result.rows[0]);
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

        let hashedPassword = null;
        if (mot_de_passe) {
            hashedPassword = await bcrypt.hash(mot_de_passe, 10);
        }

        const result = await pool.query(
            `UPDATE utilisateurs 
             SET nom_utilisateur = COALESCE($1, nom_utilisateur),
                 email = COALESCE($2, email),
                 mot_de_passe = COALESCE($3, mot_de_passe)
             WHERE id_utilisateur = $4
             RETURNING id_utilisateur, nom_utilisateur, email, date_creation`,
            [nom_utilisateur, email, hashedPassword, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur not found' });
        }

        res.json(result.rows[0]);
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

        const result = await pool.query(
            'DELETE FROM utilisateurs WHERE id_utilisateur = $1 RETURNING id_utilisateur, nom_utilisateur, email',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur not found' });
        }

        res.json({ message: 'Utilisateur deleted successfully', utilisateur: result.rows[0] });
    } catch (error) {
        console.error('Error deleting utilisateur:', error);
        res.status(500).json({ error: 'Failed to delete utilisateur' });
    }
};

