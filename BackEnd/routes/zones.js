const express = require('express');
const { Zone, Equipement, Emplacement } = require('../models');
const { requireRole } = require('../middleware/simpleAuth');
const router = express.Router();

// GET /api/zones - Toutes les zones
router.get('/', async (req, res, next) => {
  try {
    const zones = await Zone.findAll({ order: [['id_zone', 'ASC']] });
    res.json(zones);
  } catch (err) { next(err); }
});

// GET /api/zones/:id
router.get('/:id', async (req, res, next) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone non trouvée' });
    res.json(zone);
  } catch (err) { next(err); }
});

// POST /api/zones
router.post('/', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const zone = await Zone.create(req.body);
    res.status(201).json(zone);
  } catch (err) { next(err); }
});

// PUT /api/zones/:id
router.put('/:id', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone non trouvée' });
    await zone.update(req.body);
    res.json(zone);
  } catch (err) { next(err); }
});

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

