const express = require('express');
const router = express.Router();
const { login, verifyToken, getCurrentUser } = require('../controllers/authController');
const { validateUserData } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// HU3.2 - Login de usuarios
// POST /api/auth/login
router.post('/login', validateUserData, login);

// Verificar token válido
// GET /api/auth/verify
router.get('/verify', authenticateToken, verifyToken);

// Obtener información del usuario actual
// GET /api/auth/me
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;
