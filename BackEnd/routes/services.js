const express = require('express');
const ctrl = require('../controllers/servicesController');
const router = express.Router();

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
router.post('/', ctrl.createService);

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
router.put('/:id', ctrl.updateService);

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
router.delete('/:id', ctrl.deleteService);


module.exports = router;



