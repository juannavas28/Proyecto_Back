const express = require('express');
const router = express.Router();
const { getLugares } = require('../controllers/lugarController');
const { authenticateToken } = require('../middleware/auth');

// Obtener lugares disponibles
router.get('/', authenticateToken, getLugares);

module.exports = router;
