const express = require('express');
const { Billet, ReservationBillet, Utilisateur } = require('../models');
const sequelize = require('../config/database');
const simpleAuth = require('../middleware/simpleAuth');
const { sendReservationConfirmation } = require('../services/emailService');
const router = express.Router();

// ─── Réservations ────────────────────────────────────────────────────────────

// GET /api/billets/reservations/me - Réservations de l'utilisateur connecté
router.get('/reservations/me', simpleAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Non authentifié' });

    const reservations = await ReservationBillet.findAll({
      where: { id_utilisateur: userId },
      include: [{ model: Billet, as: 'billet' }],
      order: [['date_reservation', 'DESC']]
    });
    res.json(reservations);
  } catch (err) { next(err); }
});

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
router.post('/reservations', simpleAuth, async (req, res, next) => {
  try {
    const {
      id_utilisateur,
      id_billet,
      type,
      quantite,
      date_utilisation,
      prix_total,
      transaction_id
    } = req.body;

    const userId = id_utilisateur || req.user?.id;
    if (!userId) return res.status(400).json({ error: 'Utilisateur requis' });

    // Résoudre le billet soit par id_billet, soit par type_billet envoyé par le front
    let billet = null;
    if (id_billet) {
      billet = await Billet.findByPk(id_billet);
    } else if (type) {
      // Accepter les variantes legacy ('1jour' → 'oneDay', etc.)
      const normalizeType = (raw) => {
        if (!raw) return null;
        const val = String(raw).toLowerCase();
        if (val === '1jour') return 'oneDay';
        if (val === '2jours') return 'twoDays';
        if (val === '3jours') return 'threeDays';
        return raw;
      };
      billet = await Billet.findOne({ where: { type_billet: normalizeType(type) } });
    }

    if (!billet) {
      return res.status(400).json({ error: 'Billet introuvable pour cette réservation' });
    }

    const qty = Number(quantite) || 1;
    const total = prix_total ? Number(prix_total) : Number(billet.prix) * qty;

    const reservation = await ReservationBillet.create({
      id_utilisateur: userId,
      id_billet: billet.id_billet,
      quantite: qty,
      date_utilisation,
      prix_total: total,
      transaction_id,
      statut: 'réservé',
      date_paiement: new Date()
    });

    const reservationComplete = await ReservationBillet.findByPk(reservation.id_reservation, {
      include: [
        { model: Billet, as: 'billet' },
        { model: Utilisateur, as: 'utilisateur' }
      ]
    });

    if (reservationComplete?.utilisateur?.email) {
      try {
        await sendReservationConfirmation({
          to: reservationComplete.utilisateur.email,
          userName: reservationComplete.utilisateur.nom_utilisateur,
          reservation: reservationComplete.toJSON(),
          billet: reservationComplete.billet.toJSON()
        });
        console.log(`Email de confirmation envoyé à ${reservationComplete.utilisateur.email}`);
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      }
    }

    res.status(201).json(reservationComplete || reservation);
  } catch (err) { next(err); }
});

// ─── Billets/Forfaits ─────────────────────────────────────────────────────────

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

// POST /api/billets/reservations - Créer une réservation et décrémenter le stock
router.post('/reservations', async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id_utilisateur, id_billet, quantite, date_utilisation, prix_total, transaction_id } = req.body;
    if (!id_utilisateur || !id_billet || !quantite || !prix_total) {
      await t.rollback();
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    // Vérifier que le billet existe et a assez de stock
    const billet = await Billet.findByPk(id_billet, { transaction: t, lock: t.LOCK.UPDATE });
    if (!billet) {
      await t.rollback();
      return res.status(404).json({ error: 'Billet non trouvé' });
    }
    if (billet.stock_disponible < quantite) {
      await t.rollback();
      return res.status(400).json({ error: 'Stock insuffisant', stock_disponible: billet.stock_disponible });
    }

    // Créer la réservation
    const reservation = await ReservationBillet.create({
      id_utilisateur, id_billet, quantite,
      date_utilisation, prix_total, transaction_id,
      statut: 'réservé',
      date_paiement: new Date()
    }, { transaction: t });

    // Décrémenter le stock disponible
    await billet.update({
      stock_disponible: billet.stock_disponible - quantite
    }, { transaction: t });

    await t.commit();
    res.status(201).json(reservation);
  } catch (err) {
    await t.rollback();
    next(err);
  }
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

// PATCH /api/billets/reservations/:id/date - Modifier le jour d'une réservation
router.patch('/reservations/:id/date', async (req, res, next) => {
  try {
    const resa = await ReservationBillet.findByPk(req.params.id, {
      include: [{ model: Billet, as: 'billet' }]
    });
    if (!resa) return res.status(404).json({ error: 'Réservation non trouvée' });

    if (resa.statut === 'annulé' || resa.statut === 'utilisé') {
      return res.status(400).json({ error: 'Impossible de modifier une réservation annulée ou déjà utilisée.' });
    }

    const { date_utilisation } = req.body;
    if (!date_utilisation) {
      return res.status(400).json({ error: 'Le champ date_utilisation est requis.' });
    }

    await resa.update({ date_utilisation });

    // Recharger avec l'association
    const updated = await ReservationBillet.findByPk(req.params.id, {
      include: [{ model: Billet, as: 'billet' }]
    });
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;

