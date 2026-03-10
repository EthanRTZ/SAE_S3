const express = require('express');
const { Scene, Prestataire } = require('../models');
const router = express.Router();

// GET /api/scenes - Toutes les scènes
router.get('/', async (req, res, next) => {
  try {
    const scenes = await Scene.findAll({
      include: [{
        model: Prestataire,
        as: 'sponsor',
        attributes: ['id_prestataire', 'nom']
      }],
      order: [['id_scene', 'ASC']]
    });
    res.json(scenes);
  } catch (err) { next(err); }
});

// GET /api/scenes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const scene = await Scene.findByPk(req.params.id, {
      include: [{
        model: Prestataire,
        as: 'sponsor',
        attributes: ['id_prestataire', 'nom']
      }]
    });
    if (!scene) return res.status(404).json({ error: 'Scène non trouvée' });
    res.json(scene);
  } catch (err) { next(err); }
});

module.exports = router;

