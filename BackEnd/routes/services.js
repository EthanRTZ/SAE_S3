const express = require('express');
const ctrl = require('../controllers/servicesController');
const { ReservationService, Service, Prestataire, TypeService } = require('../models');
const simpleAuth = require('../middleware/simpleAuth');
const { requireRole } = require('../middleware/simpleAuth');
const router = express.Router();

// ─── Réservations de services ──────────────────────────────────────────────

/**
 * @openapi
 * /services/reservations/me:
 *   get:
 *     tags:
 *       - Services
 *     summary: Mes réservations de services
 *     description: Retourne les réservations du user authentifié.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Réservations utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
// GET /api/services/reservations/me - Réservations de l'utilisateur connecté
router.get('/reservations/me', simpleAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Non authentifié' });

    const reservations = await ReservationService.findAll({
      where: { id_utilisateur: userId },
      include: [
        {
          model: Service,
          as: 'service',
          include: [{ model: TypeService, as: 'typeService' }]
        },
        { model: Prestataire, as: 'prestataire' }
      ],
      order: [['date_reservation', 'DESC']]
    });
    res.json(reservations);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /services/reservations:
 *   post:
 *     tags:
 *       - Services
 *     summary: Créer une réservation de service
 *     description: Crée une nouvelle réservation liée à un service.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_service
 *               - id_prestataire
 *             properties:
 *               id_utilisateur:
 *                 type: integer
 *               id_service:
 *                 type: integer
 *               id_prestataire:
 *                 type: integer
 *               quantite:
 *                 type: integer
 *               details:
 *                 type: object
 *               prix_total:
 *                 type: number
 *               transaction_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Réservation créée
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
// POST /api/services/reservations - Créer une réservation de service
router.post('/reservations', simpleAuth, async (req, res, next) => {
  try {
    const {
      id_utilisateur,
      id_service,
      id_prestataire,
      quantite,
      details,
      prix_total,
      transaction_id
    } = req.body;

    const userId = id_utilisateur || req.user?.id;
    if (!userId) return res.status(400).json({ error: 'Utilisateur requis' });
    if (!id_service) return res.status(400).json({ error: 'Service requis' });
    if (!id_prestataire) return res.status(400).json({ error: 'Prestataire requis' });

    const reservation = await ReservationService.create({
      id_utilisateur: userId,
      id_service,
      id_prestataire,
      quantite: Number(quantite) || 1,
      details: details || {},
      prix_total: prix_total ? Number(prix_total) : null,
      transaction_id,
      statut: 'réservé',
      date_paiement: new Date()
    });

    res.status(201).json(reservation);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /services/reservations/{id}:
 *   put:
 *     tags:
 *       - Services
 *     summary: Modifier une réservation de service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Réservation modifiée
 *       404:
 *         description: Réservation non trouvée
 *       403:
 *         description: Accès refusé (admin/organisateur requis)
 *       500:
 *         description: Erreur serveur
 */
// PUT /api/services/reservations/:id - Modifier une réservation de service
router.put('/reservations/:id', simpleAuth, requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const resa = await ReservationService.findByPk(req.params.id);
    if (!resa) return res.status(404).json({ error: 'Réservation non trouvée' });
    await resa.update(req.body);
    res.json(resa);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /services/reservations/{id}:
 *   delete:
 *     tags:
 *       - Services
 *     summary: Supprimer une réservation de service
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
 *         description: Réservation supprimée
 *       404:
 *         description: Réservation non trouvée
 *       403:
 *         description: Accès refusé (admin/organisateur requis)
 *       500:
 *         description: Erreur serveur
 */
// DELETE /api/services/reservations/:id - Supprimer une réservation de service
router.delete('/reservations/:id', simpleAuth, requireRole('admin', 'organisateur'), async (req, res, next) => {
  try {
    const resa = await ReservationService.findByPk(req.params.id);
    if (!resa) return res.status(404).json({ error: 'Réservation non trouvée' });
    await resa.destroy();
    res.json({ message: 'Réservation supprimée' });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /services/with-prestataires:
 *   get:
 *     tags:
 *       - Services
 *     summary: Liste tous les services avec leurs prestataires
 *     description: Récupère tous les services incluant les informations des prestataires associés
 *     responses:
 *       200:
 *         description: Liste des services avec prestataires
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/with-prestataires', ctrl.getAllServicesWithPrestataires);

/**
 * @openapi
 * /services:
 *   get:
 *     tags:
 *       - Services
 *     summary: Liste tous les services
 *     description: Récupère la liste complète des services disponibles
 *     responses:
 *       200:
 *         description: Liste des services
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nom:
 *                     type: string
 *                   description:
 *                     type: string
 */
router.get('/', ctrl.getAllServices);

/**
 * @openapi
 * /services/{id}:
 *   get:
 *     tags:
 *       - Services
 *     summary: Récupère un service par ID
 *     description: Retourne les détails d'un service spécifique
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du service
 *     responses:
 *       200:
 *         description: Détails du service
 *       404:
 *         description: Service non trouvé
 */
router.get('/:id', ctrl.getServiceById);

/**
 * @openapi
 * /services:
 *   post:
 *     tags:
 *       - Services
 *     summary: Crée un nouveau service
 *     description: Ajoute un nouveau service au système
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_prestataire
 *               - nom_service_fr
 *             properties:
 *               id_prestataire:
 *                 type: integer
 *                 example: 1
 *               nom_service_fr:
 *                 type: string
 *                 example: Restauration
 *               nom_service_en:
 *                 type: string
 *                 example: Food Service
 *               nom_service:
 *                 type: object
 *                 description: Format bilingue alternatif
 *                 properties:
 *                   fr:
 *                     type: string
 *                   en:
 *                     type: string
 *               description_fr:
 *                 type: string
 *                 example: Service de restauration sur place
 *               description_en:
 *                 type: string
 *                 example: On-site food service
 *               description:
 *                 type: object
 *                 description: Format bilingue alternatif
 *                 properties:
 *                   fr:
 *                     type: string
 *                   en:
 *                     type: string
 *               prix_estime:
 *                 type: number
 *                 format: float
 *                 example: 15.50
 *     responses:
 *       201:
 *         description: Service créé avec succès
 *       401:
 *         description: Non authentifié
 */
router.post('/', requireRole('admin', 'organisateur', 'prestataire'), ctrl.createService);

/**
 * @openapi
 * /services/{id}:
 *   put:
 *     tags:
 *       - Services
 *     summary: Met à jour un service
 *     description: Modifie les informations d'un service existant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_prestataire:
 *                 type: integer
 *               nom_service_fr:
 *                 type: string
 *               nom_service_en:
 *                 type: string
 *               nom_service:
 *                 type: object
 *                 properties:
 *                   fr:
 *                     type: string
 *                   en:
 *                     type: string
 *               description_fr:
 *                 type: string
 *               description_en:
 *                 type: string
 *               description:
 *                 type: object
 *                 properties:
 *                   fr:
 *                     type: string
 *                   en:
 *                     type: string
 *               prix_estime:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Service mis à jour
 *       404:
 *         description: Service non trouvé
 */
router.put('/:id', requireRole('admin', 'organisateur', 'prestataire'), ctrl.updateService);

/**
 * @openapi
 * /services/{id}:
 *   delete:
 *     tags:
 *       - Services
 *     summary: Supprime un service
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
 *         description: Service supprimé
 *       404:
 *         description: Service non trouvé
 */
router.delete('/:id', requireRole('admin', 'organisateur', 'prestataire'), ctrl.deleteService);


module.exports = router;



