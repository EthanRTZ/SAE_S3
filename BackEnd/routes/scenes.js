const express = require('express');
const { Scene, Prestataire } = require('../models');
const router = express.Router();

/**
 * @openapi
 * /scenes:
 *   get:
 *     tags:
 *       - Scènes
 *     summary: Liste des scènes
 *     description: Retourne toutes les scènes avec leur prestataire sponsor éventuel.
 *     responses:
 *       200:
 *         description: Liste des scènes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Erreur serveur
 */
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

/**
 * @openapi
 * /scenes/{id}:
 *   get:
 *     tags:
 *       - Scènes
 *     summary: Détail d'une scène
 *     description: Retourne une scène par son identifiant.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de la scène
 *     responses:
 *       200:
 *         description: Scène trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Scène non trouvée
 *       500:
 *         description: Erreur serveur
 */
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

