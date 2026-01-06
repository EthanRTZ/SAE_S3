const express = require('express');
const ctrl = require('../controllers/servicesController');
const router = express.Router();

// Route NON-TRIVIALE (doit être AVANT /:id)
router.get('/with-prestataires', ctrl.getAllServicesWithPrestataires);

// Routes CRUD de base (TRIVIAL)
router.get('/', ctrl.getAllServices);
router.get('/:id', ctrl.getServiceById);
router.post('/', ctrl.createService);
router.put('/:id', ctrl.updateService);
router.delete('/:id', ctrl.deleteService);


module.exports = router;

