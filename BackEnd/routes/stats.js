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

/**
 * @openapi
 * /stats/reservations:
 *   get:
 *     tags:
 *       - Stats
 *     summary: Statistiques des réservations
 *     description: Récupère les indicateurs liés aux réservations de billets et services
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des réservations
 */
router.get('/reservations', ctrl.getReservationsStats);

/**
 * @openapi
 * /stats/avis-festival:
 *   get:
 *     tags:
 *       - Stats
 *     summary: Statistiques des avis festival
 *     description: Récupère les moyennes et répartitions des avis sur le festival
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des avis festival
 */
router.get('/avis-festival', ctrl.getAvisFestivalStats);

/**
 * @openapi
 * /stats/avis-prestataires:
 *   get:
 *     tags:
 *       - Stats
 *     summary: Statistiques des avis prestataires
 *     description: Récupère les statistiques de notation des prestataires
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des avis prestataires
 */
router.get('/avis-prestataires', ctrl.getAvisPrestatairesStats);

module.exports = router;





