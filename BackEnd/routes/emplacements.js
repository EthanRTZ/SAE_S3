const express = require('express');
const ctrl = require('../controllers/emplacementsController');
const router = express.Router();

// Routes CRUD de base (TRIVIAL)
router.get('/', ctrl.getAllEmplacements);
router.get('/:id', ctrl.getEmplacementById);
router.post('/', ctrl.createEmplacement);
router.put('/:id', ctrl.updateEmplacement);
router.delete('/:id', ctrl.deleteEmplacement);

module.exports = router;

