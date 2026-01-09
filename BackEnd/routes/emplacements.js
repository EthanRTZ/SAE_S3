const express = require('express');
const ctrl = require('../controllers/emplacementsController');
const router = express.Router();

/**
 * @openapi
 * /emplacements:
 *   get:
 *     tags:
 *       - Emplacements
 *     summary: Liste tous les emplacements
 *     description: Récupère la liste complète des emplacements disponibles
 *     responses:
 *       200:
 *         description: Liste des emplacements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', ctrl.getAllEmplacements);

/**
 * @openapi
 * /emplacements/{id}:
 *   get:
 *     tags:
 *       - Emplacements
 *     summary: Récupère un emplacement par ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails de l'emplacement
 *       404:
 *         description: Emplacement non trouvé
 */
router.get('/:id', ctrl.getEmplacementById);

/**
 * @openapi
 * /emplacements:
 *   post:
 *     tags:
 *       - Emplacements
 *     summary: Crée un nouvel emplacement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Emplacement créé
 *       401:
 *         description: Non authentifié
 */
router.post('/', ctrl.createEmplacement);

/**
 * @openapi
 * /emplacements/{id}:
 *   put:
 *     tags:
 *       - Emplacements
 *     summary: Met à jour un emplacement
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
 *         description: Emplacement mis à jour
 *       404:
 *         description: Emplacement non trouvé
 */
router.put('/:id', ctrl.updateEmplacement);

/**
 * @openapi
 * /emplacements/{id}:
 *   delete:
 *     tags:
 *       - Emplacements
 *     summary: Supprime un emplacement
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
 *         description: Emplacement supprimé
 *       404:
 *         description: Emplacement non trouvé
 */
router.delete('/:id', ctrl.deleteEmplacement);

module.exports = router;



