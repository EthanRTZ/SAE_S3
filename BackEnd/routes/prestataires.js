const express = require('express');
const ctrl = require('../controllers/prestatairesController');
const { ReservationService, Service, Utilisateur, TypeService } = require('../models');
const router = express.Router();

/**
 * @openapi
 * /prestataires:
 *   get:
 *     tags:
 *       - Prestataires
 *     summary: Liste tous les prestataires
 *     description: Récupère la liste complète des prestataires du festival
 *     responses:
 *       200:
 *         description: Liste des prestataires
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', ctrl.getAllPrestataires);

/**
 * @openapi
 * /prestataires/{id}:
 *   get:
 *     tags:
 *       - Prestataires
 *     summary: Récupère un prestataire par ID
 *     description: Retourne les détails d'un prestataire spécifique
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du prestataire
 *     responses:
 *       200:
 *         description: Détails du prestataire
 *       404:
 *         description: Prestataire non trouvé
 */
router.get('/:id', ctrl.getPrestataireById);

/**
 * @openapi
 * /prestataires:
 *   post:
 *     tags:
 *       - Prestataires
 *     summary: Crée un nouveau prestataire
 *     description: Ajoute un nouveau prestataire au festival
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - type_prestataire
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Food Truck Paradise
 *               type_prestataire:
 *                 type: string
 *                 example: Restauration
 *               description_fr:
 *                 type: string
 *                 example: Cuisine street food premium
 *               description_en:
 *                 type: string
 *                 example: Premium street food cuisine
 *               description:
 *                 type: object
 *                 description: Format bilingue alternatif
 *                 properties:
 *                   fr:
 *                     type: string
 *                   en:
 *                     type: string
 *               contact_email:
 *                 type: string
 *                 format: email
 *               contact_tel:
 *                 type: string
 *               site_web:
 *                 type: string
 *               photo_url:
 *                 type: string
 *                 example: /media/prestataires/foodtruck.jpg
 *     responses:
 *       201:
 *         description: Prestataire créé avec succès
 *       401:
 *         description: Non authentifié
 */
router.post('/', ctrl.createPrestataire);

/**
 * @openapi
 * /prestataires/{id}:
 *   put:
 *     tags:
 *       - Prestataires
 *     summary: Met à jour un prestataire
 *     description: Modifie les informations d'un prestataire existant
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
 *               nom:
 *                 type: string
 *               type_prestataire:
 *                 type: string
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
 *               contact_email:
 *                 type: string
 *               contact_tel:
 *                 type: string
 *               site_web:
 *                 type: string
 *               photo_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prestataire mis à jour
 *       404:
 *         description: Prestataire non trouvé
 *       401:
 *         description: Non authentifié
 */
router.put('/:id', ctrl.updatePrestataire);

/**
 * @openapi
 * /prestataires/{id}:
 *   delete:
 *     tags:
 *       - Prestataires
 *     summary: Supprime un prestataire
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
 *         description: Prestataire supprimé
 *       404:
 *         description: Prestataire non trouvé
 */
router.delete('/:id', ctrl.deletePrestataire);

/**
 * @openapi
 * /prestataires/{id}/services:
 *   get:
 *     tags:
 *       - Prestataires
 *     summary: Récupère les services d'un prestataire
 *     description: Liste tous les services proposés par un prestataire
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du prestataire
 *     responses:
 *       200:
 *         description: Liste des services
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       404:
 *         description: Prestataire non trouvé
 */
router.get('/:id/services', ctrl.getPrestataireServices);

/**
 * @openapi
 * /prestataires/{id}/services:
 *   put:
 *     tags:
 *       - Prestataires
 *     summary: Synchronise les services d'un prestataire
 *     description: Crée, met à jour et supprime les services pour correspondre au tableau envoyé
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du prestataire
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - services
 *             properties:
 *               services:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_service:
 *                       type: integer
 *                     nom:
 *                       type: object
 *                       properties:
 *                         fr:
 *                           type: string
 *                         en:
 *                           type: string
 *                     description:
 *                       type: object
 *                       properties:
 *                         fr:
 *                           type: string
 *                         en:
 *                           type: string
 *                     prix:
 *                       type: number
 *                     id_type_service:
 *                       type: integer
 *                     champs_specifiques:
 *                       type: object
 *     responses:
 *       200:
 *         description: Services synchronisés avec succès
 *       404:
 *         description: Prestataire non trouvé
 */
router.put('/:id/services', ctrl.syncPrestataireServices);

/**
 * @openapi
 * /prestataires/{id}/emplacements:
 *   get:
 *     tags:
 *       - Prestataires
 *     summary: Récupère les emplacements d'un prestataire
 *     description: Liste tous les emplacements assignés à un prestataire
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du prestataire
 *     responses:
 *       200:
 *         description: Liste des emplacements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       404:
 *         description: Prestataire non trouvé
 */
router.get('/:id/emplacements', ctrl.getPrestataireEmplacements);

/**
 * @openapi
 * /prestataires/{id}/emplacements:
 *   post:
 *     tags:
 *       - Prestataires
 *     summary: Assigne un emplacement à un prestataire
 *     description: Ajoute un emplacement au prestataire
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du prestataire
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idEmplacement
 *             properties:
 *               idEmplacement:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Emplacement assigné
 *       404:
 *         description: Prestataire ou emplacement non trouvé
 */
router.post('/:id/emplacements', ctrl.assignEmplacementToPrestataire);

/**
 * @openapi
 * /prestataires/{id}/emplacements/{idEmplacement}:
 *   delete:
 *     tags:
 *       - Prestataires
 *     summary: Retire un emplacement à un prestataire
 *     description: Supprime l'assignation d'un emplacement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du prestataire
 *       - in: path
 *         name: idEmplacement
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'emplacement
 *     responses:
 *       200:
 *         description: Emplacement retiré
 *       404:
 *         description: Association non trouvée
 */
router.delete('/:id/emplacements/:idEmplacement', ctrl.removeEmplacementFromPrestataire);

/**
 * @openapi
 * /prestataires/{id}/reservations:
 *   get:
 *     tags:
 *       - Prestataires
 *     summary: Récupère les réservations de services d'un prestataire
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des réservations de services
 */
router.get('/:id/reservations', async (req, res, next) => {
  try {
    const reservations = await ReservationService.findAll({
      where: { id_prestataire: req.params.id },
      include: [
        {
          model: Service,
          as: 'service',
          include: [{ model: TypeService, as: 'typeService' }]
        },
        {
          model: Utilisateur,
          as: 'utilisateur',
          attributes: ['id_utilisateur', 'nom_utilisateur', 'email']
        }
      ],
      order: [['date_reservation', 'DESC']]
    });
    res.json(reservations);
  } catch (err) { next(err); }
});

module.exports = router;



