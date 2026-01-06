const express = require('express');
const ctrl = require('../controllers/authController');
const router = express.Router();

// Routes d'authentification (NON-TRIVIALES)
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', ctrl.getCurrentUser);

module.exports = router;

