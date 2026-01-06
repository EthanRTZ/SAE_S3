const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/artistesController');

// Routes CRUD de base (TRIVIAL)
router.get('/', ctrl.getAllArtistes);
router.get('/:id', ctrl.getArtisteById);
router.post('/', ctrl.createArtiste);
router.put('/:id', ctrl.updateArtiste);
router.delete('/:id', ctrl.deleteArtiste);

module.exports = router;

