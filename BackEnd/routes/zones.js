const express = require('express');
const { Zone, Equipement, Emplacement } = require('../models');
const { requireRole } = require('../middleware/simpleAuth');
const router = express.Router();

/**
 * @openapi
 * /zones:
 *   get:
 *     tags:
 *       - Zones
 *     summary: Liste toutes les zones
 *     responses:
 *       200:
 *         description: Liste des zones
 */
// GET /api/zones - Toutes les zones
router.get('/', async (req, res, next) => {
  try {
    const zones = await Zone.findAll({ order: [['id_zone', 'ASC']] });
    res.json(zones);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /zones/{id}:
 *   get:
 *     tags:
 *       - Zones
 *     summary: Détail d'une zone
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détail de la zone
 *       404:
 *         description: Zone non trouvée
 */
// GET /api/zones/:id
router.get('/:id', async (req, res, next) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone non trouvée' });
    res.json(zone);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /zones:
 *   post:
 *     tags:
 *       - Zones
 *     summary: Crée une zone
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Zone créée
 */
// POST /api/zones
router.post('/', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const zone = await Zone.create(req.body);
    res.status(201).json(zone);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /zones/{id}:
 *   put:
 *     tags:
 *       - Zones
 *     summary: Met à jour une zone
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
 *         description: Zone mise à jour
 *       404:
 *         description: Zone non trouvée
 */
// PUT /api/zones/:id
router.put('/:id', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone non trouvée' });
    await zone.update(req.body);
    res.json(zone);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /zones/{id}:
 *   delete:
 *     tags:
 *       - Zones
 *     summary: Supprime une zone
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
 *         description: Zone supprimée
 *       404:
 *         description: Zone non trouvée
 */
// DELETE /api/zones/:id
router.delete('/:id', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone non trouvée' });
    await zone.destroy();
    res.json({ message: 'Zone supprimée' });
  } catch (err) { next(err); }
});

module.exports = router;

