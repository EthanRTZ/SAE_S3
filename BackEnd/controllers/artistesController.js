const { Artiste } = require('../models');

/**
 * GET /api/artistes - Récupérer tous les artistes
 */
exports.getAllArtistes = async (req, res) => {
    try {
        const artistes = await Artiste.findAll({
            order: [['id_artiste', 'ASC']]
        });
        res.json(artistes);
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
        const artiste = await Artiste.findByPk(id);

        if (!artiste) {
            return res.status(404).json({ error: 'Artiste not found' });
        }

        res.json(artiste);
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

        const artiste = await Artiste.create({
            nom,
            style_musique,
            description,
            pays_origine,
            photo_url,
            cachet,
            lien_deezer
        });

        res.status(201).json(artiste);
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

        const artiste = await Artiste.findByPk(id);

        if (!artiste) {
            return res.status(404).json({ error: 'Artiste not found' });
        }

        await artiste.update({
            nom: nom || artiste.nom,
            style_musique: style_musique || artiste.style_musique,
            description: description !== undefined ? description : artiste.description,
            pays_origine: pays_origine !== undefined ? pays_origine : artiste.pays_origine,
            photo_url: photo_url !== undefined ? photo_url : artiste.photo_url,
            cachet: cachet !== undefined ? cachet : artiste.cachet,
            lien_deezer: lien_deezer !== undefined ? lien_deezer : artiste.lien_deezer
        });

        res.json(artiste);
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

        const artiste = await Artiste.findByPk(id);

        if (!artiste) {
            return res.status(404).json({ error: 'Artiste not found' });
        }

        const deletedArtiste = artiste.toJSON();
        await artiste.destroy();

        res.json({ message: 'Artiste deleted successfully', artiste: deletedArtiste });
    } catch (error) {
        console.error('Error deleting artiste:', error);
        res.status(500).json({ error: 'Failed to delete artiste' });
    }
};

