const express = require('express');
const ctrl = require('../controllers/typesServiceController');
const router = express.Router();

/**
 * @openapi
 * /types-service:
 *   get:
 *     tags:
 *       - Types de Service
 *     summary: Liste tous les types de service
 *     description: Récupère la liste des types de service prédéfinis (réservation, commande, location)
 *     responses:
 *       200:
 *         description: Liste des types de service
 */
router.get('/', ctrl.getAllTypesService);

/**
 * @openapi
 * /types-service/nom/{nom}/services:
 *   get:
 *     tags:
 *       - Types de Service
 *     summary: Récupère les services par nom de type (reservation, commande, location)
 *     parameters:
 *       - in: path
 *         name: nom
 *         required: true
 *         schema:
 *           type: string
 *           enum: [reservation, commande, location]
 *     responses:
 *       200:
 *         description: Type et liste des services associés
 *       404:
 *         description: Type de service non trouvé
 */
router.get('/nom/:nom/services', ctrl.getServicesByTypeName);

/**
 * @openapi
 * /types-service/{id}:
 *   get:
 *     tags:
 *       - Types de Service
 *     summary: Récupère un type de service par ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails du type de service
 *       404:
 *         description: Type de service non trouvé
 */
router.get('/:id', ctrl.getTypeServiceById);

/**
 * @openapi
 * /types-service/{id}/services:
 *   get:
 *     tags:
 *       - Types de Service
 *     summary: Récupère tous les services d'un type donné
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Type et liste des services associés
 *       404:
 *         description: Type de service non trouvé
 */
router.get('/:id/services', ctrl.getServicesByType);

module.exports = router;

