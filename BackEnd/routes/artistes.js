const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/artistesController');

/**
 * @openapi
 * /artistes:
 *   get:
 *     tags:
 *       - Artistes
 *     summary: Liste tous les artistes
 *     description: Récupère la liste complète des artistes du festival
 *     responses:
 *       200:
 *         description: Liste des artistes
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
 *                   biographie:
 *                     type: string
 *                   genre_musical:
 *                     type: string
 *       500:
 *         description: Erreur serveur
 */
router.get('/', ctrl.getAllArtistes);

/**
 * @openapi
 * /artistes/{id}:
 *   get:
 *     tags:
 *       - Artistes
 *     summary: Récupère un artiste par ID
 *     description: Retourne les détails d'un artiste spécifique
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'artiste
 *     responses:
 *       200:
 *         description: Détails de l'artiste
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Artiste non trouvé
 */
router.get('/:id', ctrl.getArtisteById);

/**
 * @openapi
 * /artistes:
 *   post:
 *     tags:
 *       - Artistes
 *     summary: Crée un nouvel artiste
 *     description: Ajoute un nouvel artiste au festival
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
 *                 example: The Rolling Stones
 *               biographie:
 *                 type: string
 *                 example: Groupe de rock légendaire
 *               genre_musical:
 *                 type: string
 *                 example: Rock
 *               photo_url:
 *                 type: string
 *                 example: /media/artistes/rolling-stones.jpg
 *     responses:
 *       201:
 *         description: Artiste créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.post('/', ctrl.createArtiste);

/**
 * @openapi
 * /artistes/{id}:
 *   put:
 *     tags:
 *       - Artistes
 *     summary: Met à jour un artiste
 *     description: Modifie les informations d'un artiste existant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'artiste
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               biographie:
 *                 type: string
 *               genre_musical:
 *                 type: string
 *               photo_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Artiste mis à jour
 *       404:
 *         description: Artiste non trouvé
 *       401:
 *         description: Non authentifié
 */
router.put('/:id', ctrl.updateArtiste);

/**
 * @openapi
 * /artistes/{id}:
 *   delete:
 *     tags:
 *       - Artistes
 *     summary: Supprime un artiste
 *     description: Supprime un artiste du système
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'artiste
 *     responses:
 *       200:
 *         description: Artiste supprimé
 *       404:
 *         description: Artiste non trouvé
 *       401:
 *         description: Non authentifié
 */
router.delete('/:id', ctrl.deleteArtiste);

module.exports = router;



