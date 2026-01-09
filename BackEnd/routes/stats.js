const express = require('express');
const ctrl = require('../controllers/statsController');
const router = express.Router();

/**
 * @openapi
 * /stats/dashboard:
 *   get:
 *     tags:
 *       - Stats
 *     summary: Statistiques du tableau de bord
 *     description: Récupère les statistiques globales pour le tableau de bord administrateur
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques du dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPrestataires:
 *                   type: integer
 *                 totalArtistes:
 *                   type: integer
 *                 totalUtilisateurs:
 *                   type: integer
 *       401:
 *         description: Non authentifié
 */
router.get('/dashboard', ctrl.getDashboardStats);

/**
 * @openapi
 * /stats/prestataires:
 *   get:
 *     tags:
 *       - Stats
 *     summary: Statistiques des prestataires
 *     description: Récupère les statistiques détaillées concernant les prestataires
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des prestataires
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/prestataires', ctrl.getPrestatairesStats);

/**
 * @openapi
 * /stats/emplacements:
 *   get:
 *     tags:
 *       - Stats
 *     summary: Statistiques des emplacements
 *     description: Récupère les statistiques sur l'occupation des emplacements
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des emplacements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/emplacements', ctrl.getEmplacementsStats);

/**
 * @openapi
 * /stats/artistes:
 *   get:
 *     tags:
 *       - Stats
 *     summary: Statistiques des artistes
 *     description: Récupère les statistiques concernant les artistes du festival
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des artistes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/artistes', ctrl.getArtistesStats);

module.exports = router;





