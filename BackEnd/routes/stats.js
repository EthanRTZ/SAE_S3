const express = require('express');
const ctrl = require('../controllers/statsController');
const router = express.Router();

// Routes NON-TRIVIALES de statistiques
router.get('/dashboard', ctrl.getDashboardStats);
router.get('/prestataires', ctrl.getPrestatairesStats);
router.get('/emplacements', ctrl.getEmplacementsStats);
router.get('/artistes', ctrl.getArtistesStats);

module.exports = router;



