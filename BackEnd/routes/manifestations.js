const express = require('express');
const { Festival } = require('../models');

const router = express.Router();

/**
 * @openapi
 * /manifestations:
 *   get:
 *     tags:
 *       - Manifestations
 *     summary: Liste toutes les manifestations
 *     description: Récupère la liste des manifestations (stockées dans la table festival).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des manifestations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Non authentifié
 */
router.get('/', async (req, res, next) => {
  try {
    const rows = await Festival.findAll();
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /manifestations/{id}:
 *   get:
 *     tags:
 *       - Manifestations
 *     summary: Récupère une manifestation par ID
 *     description: Retourne les détails d'une manifestation (festival).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du festival (manifestation)
 *     responses:
 *       200:
 *         description: Détails de la manifestation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Manifestation non trouvée
 *       401:
 *         description: Non authentifié
 */
router.get('/:id', async (req, res, next) => {
  try {
    const row = await Festival.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Manifestation non trouvée' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /manifestations:
 *   post:
 *     tags:
 *       - Manifestations
 *     summary: Crée une manifestation
 *     description: Crée une nouvelle manifestation (festival).
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
 *               - annee
 *               - date_debut
 *               - date_fin
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Golden Coast
 *               annee:
 *                 type: integer
 *                 example: 2026
 *               date_debut:
 *                 type: string
 *                 format: date
 *                 example: 2026-07-01
 *               date_fin:
 *                 type: string
 *                 format: date
 *                 example: 2026-07-03
 *               lieu_nom:
 *                 type: string
 *                 example: Plage centrale
 *               description_fr:
 *                 type: string
 *               description_en:
 *                 type: string
 *               actif:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Manifestation créée
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.post('/', async (req, res, next) => {
  try {
    const created = await Festival.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /manifestations/{id}:
 *   put:
 *     tags:
 *       - Manifestations
 *     summary: Met à jour une manifestation
 *     description: Met à jour une manifestation existante (festival).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du festival (manifestation)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Manifestation mise à jour
 *       404:
 *         description: Manifestation non trouvée
 *       401:
 *         description: Non authentifié
 */
router.put('/:id', async (req, res, next) => {
  try {
    const row = await Festival.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Manifestation non trouvée' });

    await row.update(req.body);
    res.json(row);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /manifestations/{id}:
 *   delete:
 *     tags:
 *       - Manifestations
 *     summary: Supprime une manifestation
 *     description: Supprime une manifestation (festival).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du festival (manifestation)
 *     responses:
 *       200:
 *         description: Manifestation supprimée
 *       404:
 *         description: Manifestation non trouvée
 *       401:
 *         description: Non authentifié
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const row = await Festival.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Manifestation non trouvée' });

    await row.destroy();
    res.json({ message: 'Manifestation supprimée' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
