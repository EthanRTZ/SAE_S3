const express = require('express');
const ctrl = require('../controllers/utilisateursController');
const { requireRole } = require('../middleware/simpleAuth');
const router = express.Router();

/**
 * @openapi
 * /utilisateurs:
 *   get:
 *     tags:
 *       - Utilisateurs
 *     summary: Liste tous les utilisateurs
 *     description: Récupère la liste complète des utilisateurs du système
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                   nom:
 *                     type: string
 *                   prenom:
 *                     type: string
 *       401:
 *         description: Non authentifié
 */
router.get('/', requireRole('admin', 'organisateur'), ctrl.getAllUtilisateurs);

/**
 * @openapi
 * /utilisateurs/{id}:
 *   get:
 *     tags:
 *       - Utilisateurs
 *     summary: Récupère un utilisateur par ID
 *     description: Retourne les détails d'un utilisateur spécifique
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Utilisateur non trouvé
 *       401:
 *         description: Non authentifié
 */
router.get('/:id', (req, res, next) => {
  const isAdmin = ['admin', 'organisateur'].includes(req.user?.role);
  const isSelf = req.user?.id === parseInt(req.params.id, 10);
  if (!isAdmin && !isSelf) return res.status(403).json({ error: 'Accès refusé' });
  next();
}, ctrl.getUtilisateurById);

/**
 * @openapi
 * /utilisateurs/{id}:
 *   put:
 *     tags:
 *       - Utilisateurs
 *     summary: Met à jour un utilisateur
 *     description: Modifie les informations d'un utilisateur existant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 *       404:
 *         description: Utilisateur non trouvé
 *       401:
 *         description: Non authentifié
 */
router.put('/:id', (req, res, next) => {
  const isAdmin = ['admin', 'organisateur'].includes(req.user?.role);
  const isSelf = req.user?.id === parseInt(req.params.id, 10);
  if (!isAdmin && !isSelf) return res.status(403).json({ error: 'Accès refusé' });
  next();
}, ctrl.updateUtilisateur);

/**
 * @openapi
 * /utilisateurs/{id}:
 *   delete:
 *     tags:
 *       - Utilisateurs
 *     summary: Supprime un utilisateur
 *     description: Supprime un utilisateur du système
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 *       404:
 *         description: Utilisateur non trouvé
 *       401:
 *         description: Non authentifié
 */
router.delete('/:id', requireRole('admin', 'organisateur'), ctrl.deleteUtilisateur);

module.exports = router;



