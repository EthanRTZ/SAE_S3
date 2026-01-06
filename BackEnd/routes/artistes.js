const express = require('express');
module.exports = router;

router.delete('/:id', ctrl.deleteArtiste);
router.put('/:id', ctrl.updateArtiste);
router.post('/', ctrl.createArtiste);
router.get('/:id', ctrl.getArtisteById);
router.get('/', ctrl.getAllArtistes);
// Routes CRUD de base (TRIVIAL)

const router = express.Router();
const ctrl = require('../controllers/artistesController');

