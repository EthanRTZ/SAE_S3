const express = require('express');
const ctrl = require('../controllers/utilisateursController');
const router = express.Router();

// Routes CRUD de base (TRIVIAL)
router.get('/', ctrl.getAllUtilisateurs);
router.get('/:id', ctrl.getUtilisateurById);
router.put('/:id', ctrl.updateUtilisateur);
router.delete('/:id', ctrl.deleteUtilisateur);

module.exports = router;

