const express = require('express');
const { Billet, ReservationBillet, Utilisateur } = require('../models');
const simpleAuth = require('../middleware/simpleAuth');
const { requireRole } = require('../middleware/simpleAuth');
const { sendReservationConfirmation } = require('../services/emailService');
const router = express.Router();

// ─── Réservations ────────────────────────────────────────────────────────────

/**
 * @openapi
 * /billets/reservations/me:
 *   get:
 *     tags:
 *       - Billets
 *     summary: Réservations de l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des réservations
 */
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

/**
 * @openapi
 * /billets/reservations/user/{userId}:
 *   get:
 *     tags:
 *       - Billets
 *     summary: Réservations d'un utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des réservations utilisateur
 *       403:
 *         description: Accès interdit
 */
// GET /api/billets/reservations/user/:userId - Réservations d'un utilisateur
router.get('/reservations/user/:userId', simpleAuth, requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const reservations = await ReservationBillet.findAll({
      where: { id_utilisateur: req.params.userId },
      include: [{ model: Billet, as: 'billet' }],
      order: [['date_reservation', 'DESC']]
    });
    res.json(reservations);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /billets/reservations:
 *   post:
 *     tags:
 *       - Billets
 *     summary: Crée une réservation de billet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Réservation créée
 */
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

    // Ajouter les infos de sélection (jour/option) pour l'email si le front les a envoyées
    const reservationPayload = reservationComplete ? reservationComplete.toJSON() : reservation;
    if (req.body.optionLabel) reservationPayload.optionLabel = req.body.optionLabel;
    if (Array.isArray(req.body.selectedDays)) reservationPayload.selectedDays = req.body.selectedDays;

    if (reservationComplete?.utilisateur?.email) {
      try {
        await sendReservationConfirmation({
          to: reservationComplete.utilisateur.email,
          userName: reservationComplete.utilisateur.nom_utilisateur,
          reservation: reservationPayload,
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

/**
 * @openapi
 * /billets/reservations/{id}:
 *   delete:
 *     tags:
 *       - Billets
 *     summary: Supprime une réservation de billet
 *     description: L'utilisateur peut supprimer ses propres réservations. Les admins peuvent supprimer n'importe quelle réservation.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la réservation
 *     responses:
 *       200:
 *         description: Réservation supprimée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Réservation non trouvée
 */
// DELETE /api/billets/reservations/:id - Supprimer une réservation
router.delete('/reservations/:id', simpleAuth, async (req, res, next) => {
  try {
    const resa = await ReservationBillet.findByPk(req.params.id);
    if (!resa) return res.status(404).json({ error: 'Réservation non trouvée' });

    // Vérifier que l'utilisateur supprime sa propre réservation (ou est admin)
    const isOwner = resa.id_utilisateur === req.user?.id;
    const isAdmin = ['admin', 'organisateur'].includes(req.user?.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres réservations.' });
    }

    await resa.destroy();
    res.json({ message: 'Réservation supprimée' });
  } catch (err) { next(err); }
});

// ─── Billets/Forfaits ─────────────────────────────────────────────────────────

/**
 * @openapi
 * /billets:
 *   get:
 *     tags:
 *       - Billets
 *     summary: Liste des billets actifs
 *     responses:
 *       200:
 *         description: Liste des billets
 */
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

/**
 * @openapi
 * /billets/{id}:
 *   get:
 *     tags:
 *       - Billets
 *     summary: Détail d'un billet
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détail du billet
 *       404:
 *         description: Billet non trouvé
 */
// GET /api/billets/:id
router.get('/:id', async (req, res, next) => {
  try {
    const billet = await Billet.findByPk(req.params.id);
    if (!billet) return res.status(404).json({ error: 'Billet non trouvé' });
    res.json(billet);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /billets:
 *   post:
 *     tags:
 *       - Billets
 *     summary: Crée un billet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Billet créé
 */
// POST /api/billets
router.post('/', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const billet = await Billet.create(req.body);
    res.status(201).json(billet);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /billets/{id}:
 *   put:
 *     tags:
 *       - Billets
 *     summary: Met à jour un billet
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
 *         description: Billet mis à jour
 *       404:
 *         description: Billet non trouvé
 */
// PUT /api/billets/:id
router.put('/:id', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const billet = await Billet.findByPk(req.params.id);
    if (!billet) return res.status(404).json({ error: 'Billet non trouvé' });
    await billet.update(req.body);
    res.json(billet);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /billets/{id}:
 *   delete:
 *     tags:
 *       - Billets
 *     summary: Supprime un billet
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
 *         description: Billet supprimé
 *       404:
 *         description: Billet non trouvé
 */
// DELETE /api/billets/:id
router.delete('/:id', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const billet = await Billet.findByPk(req.params.id);
    if (!billet) return res.status(404).json({ error: 'Billet non trouvé' });
    await billet.destroy();
    res.json({ message: 'Billet supprimé' });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /billets/reservations/{id}:
 *   put:
 *     tags:
 *       - Billets
 *     summary: Met à jour une réservation
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
 *         description: Réservation mise à jour
 *       404:
 *         description: Réservation non trouvée
 */
// PUT /api/billets/reservations/:id
router.put('/reservations/:id', requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const resa = await ReservationBillet.findByPk(req.params.id);
    if (!resa) return res.status(404).json({ error: 'Réservation non trouvée' });
    await resa.update(req.body);
    res.json(resa);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /billets/reservations/{id}/date:
 *   patch:
 *     tags:
 *       - Billets
 *     summary: Modifie la date d'utilisation d'une réservation
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
 *         description: Réservation mise à jour
 *       404:
 *         description: Réservation non trouvée
 */
// PATCH /api/billets/reservations/:id/date - Modifier le jour d'une réservation
router.patch('/reservations/:id/date', simpleAuth, async (req, res, next) => {
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

