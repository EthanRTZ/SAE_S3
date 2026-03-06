const express = require('express');
const { Equipement, Zone } = require('../models');
const router = express.Router();

// GET /api/equipements - Tous les équipements
router.get('/', async (req, res, next) => {
  try {
    const equipements = await Equipement.findAll({ order: [['id_equipement', 'ASC']] });
    res.json(equipements);
  } catch (err) { next(err); }
});

// GET /api/equipements/:id
router.get('/:id', async (req, res, next) => {
  try {
    const eq = await Equipement.findByPk(req.params.id);
    if (!eq) return res.status(404).json({ error: 'Équipement non trouvé' });
    res.json(eq);
  } catch (err) { next(err); }
});

// POST /api/equipements
router.post('/', async (req, res, next) => {
  try {
    const eq = await Equipement.create(req.body);
    res.status(201).json(eq);
  } catch (err) { next(err); }
});

// PUT /api/equipements/:id
router.put('/:id', async (req, res, next) => {
  try {
    const eq = await Equipement.findByPk(req.params.id);
    if (!eq) return res.status(404).json({ error: 'Équipement non trouvé' });
    await eq.update(req.body);
    res.json(eq);
  } catch (err) { next(err); }
});

// DELETE /api/equipements/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const eq = await Equipement.findByPk(req.params.id);
    if (!eq) return res.status(404).json({ error: 'Équipement non trouvé' });
    await eq.destroy();
    res.json({ message: 'Équipement supprimé' });
  } catch (err) { next(err); }
});

module.exports = router;

