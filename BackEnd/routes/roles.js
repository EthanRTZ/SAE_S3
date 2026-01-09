const express = require('express');
const ctrl = require('../controllers/rolesController');
const router = express.Router();

/**
 * @openapi
 * /roles:
 *   get:
 *     tags:
 *       - Rôles
 *     summary: Liste tous les rôles
 *     description: Récupère la liste complète des rôles disponibles dans le système
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des rôles
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
 *                     example: admin
 *                   description:
 *                     type: string
 */
router.get('/', ctrl.getAllRoles);

/**
 * @openapi
 * /roles/{id}:
 *   get:
 *     tags:
 *       - Rôles
 *     summary: Récupère un rôle par ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du rôle
 *     responses:
 *       200:
 *         description: Détails du rôle
 *       404:
 *         description: Rôle non trouvé
 */
router.get('/:id', ctrl.getRoleById);

/**
 * @openapi
 * /roles:
 *   post:
 *     tags:
 *       - Rôles
 *     summary: Crée un nouveau rôle
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
 *             properties:
 *               nom:
 *                 type: string
 *                 example: gestionnaire
 *               description:
 *                 type: string
 *                 example: Gestionnaire de prestataires
 *     responses:
 *       201:
 *         description: Rôle créé avec succès
 *       401:
 *         description: Non authentifié
 */
router.post('/', ctrl.createRole);

module.exports = router;



