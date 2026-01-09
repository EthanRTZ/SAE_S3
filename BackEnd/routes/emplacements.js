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
 *                 properties:
 *                   id_emplacement:
 *                     type: integer
 *                   nom_emplacement:
 *                     type: string
 *                   coord_x:
 *                     type: number
 *                   coord_y:
 *                     type: number
 *                   coordonnees_completes:
 *                     type: string
 *                   id_zone:
 *                     type: integer
 *                   statut:
 *                     type: string
 *                     enum: [libre, pris, en_attente, indisponible]
 *                   description:
 *                     type: string
 *                   moyens_logistiques:
 *                     type: string
 *                   surface_volume:
 *                     type: string
 *                   nombre_prises:
 *                     type: integer
 *                   acces_eau:
 *                     type: boolean
 */
router.get('/', ctrl.getAllEmplacements);

/**
 * @openapi
 * /emplacements/{id}:
 *   get:
 *     tags:
 *       - Emplacements
 *     summary: Récupère un emplacement par ID
 *     description: Retourne les détails complets d'un emplacement spécifique
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'emplacement
 *     responses:
 *       200:
 *         description: Détails de l'emplacement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_emplacement:
 *                   type: integer
 *                 nom_emplacement:
 *                   type: string
 *                 coord_x:
 *                   type: number
 *                 coord_y:
 *                   type: number
 *                 coordonnees_completes:
 *                   type: string
 *                 id_zone:
 *                   type: integer
 *                 statut:
 *                   type: string
 *                 description:
 *                   type: string
 *                 moyens_logistiques:
 *                   type: string
 *                 surface_volume:
 *                   type: string
 *                 nombre_prises:
 *                   type: integer
 *                 acces_eau:
 *                   type: boolean
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
 *             properties:
 *               nom_emplacement:
 *                 type: string
 *                 example: "Stand VIP A1"
 *               coord_x:
 *                 type: number
 *                 format: float
 *                 example: 4.96457
 *               coord_y:
 *                 type: number
 *                 format: float
 *                 example: 47.30532
 *               coordonnees_completes:
 *                 type: string
 *                 example: "47.30532,4.96457"
 *               id_zone:
 *                 type: integer
 *               statut:
 *                 type: string
 *                 enum: [libre, pris, en_attente, indisponible]
 *                 default: libre
 *               description:
 *                 type: string
 *               moyens_logistiques:
 *                 type: string
 *                 example: "Électricité 220V, Wi-Fi, Éclairage LED"
 *               surface_volume:
 *                 type: string
 *                 example: "45 m²"
 *               nombre_prises:
 *                 type: integer
 *                 example: 4
 *               acces_eau:
 *                 type: boolean
 *                 default: false
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
 *         description: ID de l'emplacement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom_emplacement:
 *                 type: string
 *               coord_x:
 *                 type: number
 *                 format: float
 *               coord_y:
 *                 type: number
 *                 format: float
 *               coordonnees_completes:
 *                 type: string
 *               id_zone:
 *                 type: integer
 *               statut:
 *                 type: string
 *                 enum: [libre, pris, en_attente, indisponible]
 *               description:
 *                 type: string
 *               moyens_logistiques:
 *                 type: string
 *               surface_volume:
 *                 type: string
 *               nombre_prises:
 *                 type: integer
 *               acces_eau:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Emplacement mis à jour
 *       404:
 *         description: Emplacement non trouvé
 *       401:
 *         description: Non authentifié
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



