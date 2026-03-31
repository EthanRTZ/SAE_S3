const express = require('express');
const { Programmation, Artiste, Scene } = require('../models');
const { requireRole } = require('../middleware/simpleAuth');
const router = express.Router();

// GET /api/programmation - Toute la programmation avec artistes et scènes
router.get('/', async (req, res, next) => {
  try {
    const programmation = await Programmation.findAll({
      include: [
        { model: Artiste, as: 'artiste' },
        { model: Scene, as: 'scene' }
      ],
      order: [['date_concert', 'ASC'], ['heure_debut', 'ASC']]
    });

    // Formater en structure stages/schedules compatible avec le frontend
    const scenesList = await Scene.findAll({ order: [['id_scene', 'ASC']] });
    const stages = scenesList.map(s => ({
      name: s.nom,
      by: s.sponsor_nom || ''
    }));

    // Regrouper par jour
    const scheduleMap = {};
    programmation.forEach(p => {
      const day = p.date_concert;
      if (!scheduleMap[day]) {
        scheduleMap[day] = { day };
        stages.forEach(s => { scheduleMap[day][s.name] = []; });
      }
      const sceneName = p.scene ? p.scene.nom : '';
      if (sceneName && scheduleMap[day][sceneName] !== undefined) {
        scheduleMap[day][sceneName].push({
          start: p.heure_debut ? p.heure_debut.substring(0, 5) : '',
          end: p.heure_fin ? p.heure_fin.substring(0, 5) : '',
          artist: p.artiste ? p.artiste.nom : '',
          style: p.style_musique || (p.artiste ? p.artiste.style_musique : '')
        });
      }
    });

    // Formatter les jours
    const dayNames = { '2026-08-28': 'VEN 28/08', '2026-08-29': 'SAM 29/08', '2026-08-30': 'DIM 30/08' };
    const schedules = Object.entries(scheduleMap).map(([date, data]) => ({
      ...data,
      day: dayNames[date] || date
    }));

    res.json({ stages, schedules, raw: programmation });
  } catch (err) { next(err); }
});

// GET /api/programmation/:id
router.get('/:id', async (req, res, next) => {
  try {
    const prog = await Programmation.findByPk(req.params.id, {
      include: [
        { model: Artiste, as: 'artiste' },
        { model: Scene, as: 'scene' }
      ]
    });
    if (!prog) return res.status(404).json({ error: 'Programmation non trouvée' });
    res.json(prog);
  } catch (err) { next(err); }
});

// POST /api/programmation
router.post('/', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const prog = await Programmation.create(req.body);
    res.status(201).json(prog);
  } catch (err) { next(err); }
});

// PUT /api/programmation/:id
router.put('/:id', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const prog = await Programmation.findByPk(req.params.id);
    if (!prog) return res.status(404).json({ error: 'Programmation non trouvée' });
    await prog.update(req.body);
    res.json(prog);
  } catch (err) { next(err); }
});

// DELETE /api/programmation/:id
router.delete('/:id', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const prog = await Programmation.findByPk(req.params.id);
    if (!prog) return res.status(404).json({ error: 'Programmation non trouvée' });
    await prog.destroy();
    res.json({ message: 'Programmation supprimée' });
  } catch (err) { next(err); }
});

module.exports = router;

