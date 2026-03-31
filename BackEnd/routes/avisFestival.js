const express = require('express');
const { AvisFestival, Utilisateur } = require('../models');
const { requireRole } = require('../middleware/simpleAuth');
const router = express.Router();

// GET /api/avis-festival - Tous les avis sur le festival
router.get('/', async (req, res, next) => {
  try {
    const avis = await AvisFestival.findAll({
      where: { valide: true },
      include: [
        { model: Utilisateur, as: 'utilisateur', attributes: ['nom_utilisateur', 'email'] }
      ],
      order: [['date_avis', 'DESC']]
    });
    res.json(avis);
  } catch (err) { next(err); }
});

// GET /api/avis-festival/stats - Statistiques (note moyenne, nombre d'avis)
router.get('/stats', async (req, res, next) => {
  try {
    const avis = await AvisFestival.findAll({ where: { valide: true } });
    const total = avis.length;
    const moyenne = total > 0
      ? (avis.reduce((sum, a) => sum + a.note, 0) / total).toFixed(1)
      : 0;
    const repartition = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    avis.forEach(a => { repartition[a.note]++; });
    res.json({ moyenne: parseFloat(moyenne), total, repartition });
  } catch (err) { next(err); }
});

// GET /api/avis-festival/festival/:id - Avis d'un festival spécifique
router.get('/festival/:id', async (req, res, next) => {
  try {
    const avis = await AvisFestival.findAll({
      where: { id_festival: req.params.id, valide: true },
      include: [
        { model: Utilisateur, as: 'utilisateur', attributes: ['nom_utilisateur', 'email'] }
      ],
      order: [['date_avis', 'DESC']]
    });
    res.json(avis);
  } catch (err) { next(err); }
});

// POST /api/avis-festival - Créer un avis (auth requise, gérée par le middleware)
router.post('/', async (req, res, next) => {
  try {
    const { id_festival, note, commentaire } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    if (!id_festival || !note) {
      return res.status(400).json({ error: 'id_festival et note sont requis' });
    }
    if (note < 1 || note > 5) {
      return res.status(400).json({ error: 'La note doit être entre 1 et 5' });
    }

    const avis = await AvisFestival.create({
      id_utilisateur: req.user.id,
      id_festival,
      note,
      commentaire: commentaire || null
    });

    res.status(201).json(avis);
  } catch (err) { next(err); }
});

// DELETE /api/avis-festival/:id - Supprimer un avis
router.delete('/:id', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const avis = await AvisFestival.findByPk(req.params.id);
    if (!avis) return res.status(404).json({ error: 'Avis non trouvé' });
    await avis.destroy();
    res.json({ message: 'Avis supprimé' });
  } catch (err) { next(err); }
});

module.exports = router;

