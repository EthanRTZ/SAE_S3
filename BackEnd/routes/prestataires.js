const express = require('express');
const ctrl = require('../controllers/prestatairesController');
const router = express.Router();

// Routes CRUD de base (TRIVIAL)
router.get('/', ctrl.getAllPrestataires);
router.get('/:id', ctrl.getPrestataireById);
router.post('/', ctrl.createPrestataire);
router.put('/:id', ctrl.updatePrestataire);
router.delete('/:id', ctrl.deletePrestataire);

// Routes NON-TRIVIALES
router.get('/:id/services', ctrl.getPrestataireServices);
router.get('/:id/emplacements', ctrl.getPrestataireEmplacements);
router.post('/:id/emplacements', ctrl.assignEmplacementToPrestataire);
router.delete('/:id/emplacements/:idEmplacement', ctrl.removeEmplacementFromPrestataire);

module.exports = router;

