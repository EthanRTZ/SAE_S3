const express = require('express');
const { Avis, Utilisateur, Prestataire } = require('../models');
const router = express.Router();

// GET /api/avis - Tous les avis (avec filtre optionnel par prestataire)
router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.id_prestataire) where.id_prestataire = req.query.id_prestataire;
    if (req.query.valide !== undefined) where.valide = req.query.valide === 'true';

    const avis = await Avis.findAll({
      where,
      include: [
        { model: Utilisateur, as: 'utilisateur', attributes: ['id_utilisateur', 'nom_utilisateur', 'email'] },
        { model: Prestataire, as: 'prestataire', attributes: ['id_prestataire', 'nom'] }
      ],
      order: [['date_avis', 'DESC']]
    });
    res.json(avis);
  } catch (err) { next(err); }
});

// GET /api/avis/prestataire/:nomOuId - Avis d'un prestataire par nom ou id
router.get('/prestataire/:nomOuId', async (req, res, next) => {
  try {
    const { nomOuId } = req.params;
    let prestataire;

    // Chercher par ID d'abord, puis par nom
    if (!isNaN(nomOuId)) {
      prestataire = await Prestataire.findByPk(nomOuId);
    } else {
      prestataire = await Prestataire.findOne({ where: { nom: nomOuId } });
    }

    if (!prestataire) return res.status(404).json({ error: 'Prestataire non trouvé' });

    const avis = await Avis.findAll({
      where: { id_prestataire: prestataire.id_prestataire, valide: true },
      include: [
        { model: Utilisateur, as: 'utilisateur', attributes: ['id_utilisateur', 'nom_utilisateur'] }
      ],
      order: [['date_avis', 'DESC']]
    });

    // Calculer les stats
    const notes = avis.map(a => a.note);
    const moyenne = notes.length > 0 ? notes.reduce((s, n) => s + n, 0) / notes.length : 0;
    const parNote = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    notes.forEach(n => { if (parNote[n] !== undefined) parNote[n]++; });

    res.json({
      avis,
      stats: {
        moyenne: Math.round(moyenne * 100) / 100,
        nbAvis: avis.length,
        parNote
      }
    });
  } catch (err) { next(err); }
});

// GET /api/avis/:id
router.get('/:id', async (req, res, next) => {
  try {
    const avis = await Avis.findByPk(req.params.id, {
      include: [
        { model: Utilisateur, as: 'utilisateur', attributes: ['id_utilisateur', 'nom_utilisateur'] },
        { model: Prestataire, as: 'prestataire', attributes: ['id_prestataire', 'nom'] }
      ]
    });
    if (!avis) return res.status(404).json({ error: 'Avis non trouvé' });
    res.json(avis);
  } catch (err) { next(err); }
});

// POST /api/avis - Créer un avis
router.post('/', async (req, res, next) => {
  try {
    const { id_utilisateur, id_prestataire, note, commentaire } = req.body;
    if (!id_prestataire || !note) {
      return res.status(400).json({ error: 'id_prestataire et note sont requis' });
    }
    if (note < 1 || note > 5) {
      return res.status(400).json({ error: 'La note doit être entre 1 et 5' });
    }
    const avis = await Avis.create({ id_utilisateur, id_prestataire, note, commentaire });
    res.status(201).json(avis);
  } catch (err) { next(err); }
});

// PUT /api/avis/:id - Modérer un avis
router.put('/:id', async (req, res, next) => {
  try {
    const avis = await Avis.findByPk(req.params.id);
    if (!avis) return res.status(404).json({ error: 'Avis non trouvé' });
    await avis.update(req.body);
    res.json(avis);
  } catch (err) { next(err); }
});

// DELETE /api/avis/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const avis = await Avis.findByPk(req.params.id);
    if (!avis) return res.status(404).json({ error: 'Avis non trouvé' });
    await avis.destroy();
    res.json({ message: 'Avis supprimé' });
  } catch (err) { next(err); }
});

module.exports = router;

