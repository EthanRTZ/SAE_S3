const express = require('express');
const { Equipement, Zone } = require('../models');
const { requireRole } = require('../middleware/simpleAuth');
const router = express.Router();

/**
 * @openapi
 * /equipements:
 *   get:
 *     tags:
 *       - Equipements
 *     summary: Liste tous les équipements
 *     responses:
 *       200:
 *         description: Liste des équipements
 */
// GET /api/equipements - Tous les équipements
router.get('/', async (req, res, next) => {
  try {
    const equipements = await Equipement.findAll({ order: [['id_equipement', 'ASC']] });
    res.json(equipements);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /equipements/{id}:
 *   get:
 *     tags:
 *       - Equipements
 *     summary: Détail d'un équipement
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détail de l'équipement
 *       404:
 *         description: Équipement non trouvé
 */
// GET /api/equipements/:id
router.get('/:id', async (req, res, next) => {
  try {
    const eq = await Equipement.findByPk(req.params.id);
    if (!eq) return res.status(404).json({ error: 'Équipement non trouvé' });
    res.json(eq);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /equipements:
 *   post:
 *     tags:
 *       - Equipements
 *     summary: Crée un équipement
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Équipement créé
 */
// POST /api/equipements
router.post('/', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const eq = await Equipement.create(req.body);
    res.status(201).json(eq);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /equipements/{id}:
 *   put:
 *     tags:
 *       - Equipements
 *     summary: Met à jour un équipement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Équipement mis à jour
 *       404:
 *         description: Équipement non trouvé
 */
// PUT /api/equipements/:id
router.put('/:id', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const eq = await Equipement.findByPk(req.params.id);
    if (!eq) return res.status(404).json({ error: 'Équipement non trouvé' });
    await eq.update(req.body);
    res.json(eq);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /equipements/{id}:
 *   delete:
 *     tags:
 *       - Equipements
 *     summary: Supprime un équipement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Équipement supprimé
 *       404:
 *         description: Équipement non trouvé
 */
// DELETE /api/equipements/:id
router.delete('/:id', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const eq = await Equipement.findByPk(req.params.id);
    if (!eq) return res.status(404).json({ error: 'Équipement non trouvé' });
    await eq.destroy();
    res.json({ message: 'Équipement supprimé' });
  } catch (err) { next(err); }
});

module.exports = router;

