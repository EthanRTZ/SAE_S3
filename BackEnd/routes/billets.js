const express = require('express');
const { Billet, ReservationBillet, Utilisateur } = require('../models');
const router = express.Router();

// GET /api/billets - Tous les billets/forfaits
router.get('/', async (req, res, next) => {
  try {
    const billets = await Billet.findAll({
      where: { actif: true },
      order: [['id_billet', 'ASC']]
    });
    res.json(billets);
  } catch (err) { next(err); }
});

// GET /api/billets/:id
router.get('/:id', async (req, res, next) => {
  try {
    const billet = await Billet.findByPk(req.params.id);
    if (!billet) return res.status(404).json({ error: 'Billet non trouvé' });
    res.json(billet);
  } catch (err) { next(err); }
});

// POST /api/billets
router.post('/', async (req, res, next) => {
  try {
    const billet = await Billet.create(req.body);
    res.status(201).json(billet);
  } catch (err) { next(err); }
});

// PUT /api/billets/:id
router.put('/:id', async (req, res, next) => {
  try {
    const billet = await Billet.findByPk(req.params.id);
    if (!billet) return res.status(404).json({ error: 'Billet non trouvé' });
    await billet.update(req.body);
    res.json(billet);
  } catch (err) { next(err); }
});

// DELETE /api/billets/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const billet = await Billet.findByPk(req.params.id);
    if (!billet) return res.status(404).json({ error: 'Billet non trouvé' });
    await billet.destroy();
    res.json({ message: 'Billet supprimé' });
  } catch (err) { next(err); }
});

// ─── Réservations ────────────────────────────────────────────────────────────

// GET /api/billets/reservations/user/:userId - Réservations d'un utilisateur
router.get('/reservations/user/:userId', async (req, res, next) => {
  try {
    const reservations = await ReservationBillet.findAll({
      where: { id_utilisateur: req.params.userId },
      include: [{ model: Billet, as: 'billet' }],
      order: [['date_reservation', 'DESC']]
    });
    res.json(reservations);
  } catch (err) { next(err); }
});

// POST /api/billets/reservations - Créer une réservation
router.post('/reservations', async (req, res, next) => {
  try {
    const { id_utilisateur, id_billet, quantite, date_utilisation, prix_total, transaction_id } = req.body;
    if (!id_utilisateur || !id_billet || !quantite || !prix_total) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }
    const reservation = await ReservationBillet.create({
      id_utilisateur, id_billet, quantite,
      date_utilisation, prix_total, transaction_id,
      statut: 'réservé'
    });
    res.status(201).json(reservation);
  } catch (err) { next(err); }
});

// PUT /api/billets/reservations/:id
router.put('/reservations/:id', async (req, res, next) => {
  try {
    const resa = await ReservationBillet.findByPk(req.params.id);
    if (!resa) return res.status(404).json({ error: 'Réservation non trouvée' });
    await resa.update(req.body);
    res.json(resa);
  } catch (err) { next(err); }
});

module.exports = router;

