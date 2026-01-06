const express = require('express');
const ctrl = require('../controllers/rolesController');
const router = express.Router();

// Routes CRUD de base (TRIVIAL)
router.get('/', ctrl.getAllRoles);
router.get('/:id', ctrl.getRoleById);
router.post('/', ctrl.createRole);

module.exports = router;

