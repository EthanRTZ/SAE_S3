const pool = require('../db');

/**
 * GET /api/artistes - Récupérer tous les artistes
 */
exports.getAllArtistes = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM artiste ORDER BY id_artiste'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching artistes:', error);
        res.status(500).json({ error: 'Failed to fetch artistes' });
    }
};

/**
 * GET /api/artistes/:id - Récupérer un artiste par ID
 */
exports.getArtisteById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM artiste WHERE id_artiste = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Artiste not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching artiste:', error);
        res.status(500).json({ error: 'Failed to fetch artiste' });
    }
};

/**
 * POST /api/artistes - Créer un nouvel artiste
 */
exports.createArtiste = async (req, res) => {
    try {
        const { nom, style_musique, description, pays_origine, photo_url, cachet, lien_deezer } = req.body;

        if (!nom || !style_musique) {
            return res.status(400).json({ error: 'Nom and style_musique are required' });
        }

        const result = await pool.query(
            `INSERT INTO artiste (nom, style_musique, description, pays_origine, photo_url, cachet, lien_deezer)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [nom, style_musique, description, pays_origine, photo_url, cachet, lien_deezer]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating artiste:', error);
        res.status(500).json({ error: 'Failed to create artiste' });
    }
};

/**
 * PUT /api/artistes/:id - Mettre à jour un artiste
 */
exports.updateArtiste = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, style_musique, description, pays_origine, photo_url, cachet, lien_deezer } = req.body;

        const result = await pool.query(
            `UPDATE artiste 
             SET nom = COALESCE($1, nom),
                 style_musique = COALESCE($2, style_musique),
                 description = COALESCE($3, description),
                 pays_origine = COALESCE($4, pays_origine),
                 photo_url = COALESCE($5, photo_url),
                 cachet = COALESCE($6, cachet),
                 lien_deezer = COALESCE($7, lien_deezer)
             WHERE id_artiste = $8
             RETURNING *`,
            [nom, style_musique, description, pays_origine, photo_url, cachet, lien_deezer, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Artiste not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating artiste:', error);
        res.status(500).json({ error: 'Failed to update artiste' });
    }
};

/**
 * DELETE /api/artistes/:id - Supprimer un artiste
 */
exports.deleteArtiste = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM artiste WHERE id_artiste = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Artiste not found' });
        }

        res.json({ message: 'Artiste deleted successfully', artiste: result.rows[0] });
    } catch (error) {
        console.error('Error deleting artiste:', error);
        res.status(500).json({ error: 'Failed to delete artiste' });
    }
};

