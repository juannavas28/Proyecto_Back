const express = require('express');
const router = express.Router();
const {
  createEvent,
  updateEvent,
  submitEventForValidation,
  getEventById,
  getEventsByStatus
} = require('../controllers/eventController');
const { validateEventData, validateEventCreationData } = require('../middleware/validation');
const { authenticateToken, requireRole } = require('../middleware/auth');

// HU1.1 - Registro de evento
// POST /api/events
router.post('/', authenticateToken, requireRole(['admin', 'organizador']), validateEventCreationData, createEvent);

// Obtener eventos por estado (con paginación)
// GET /api/events?estado=borrador&page=1&limit=10
router.get('/', authenticateToken, getEventsByStatus);

// Obtener evento por ID
// GET /api/events/:id
router.get('/:id', authenticateToken, getEventById);

// HU1.2 - Edición de evento antes de validación
// PUT /api/events/:id
router.put('/:id', authenticateToken, requireRole(['admin', 'organizador']), validateEventData, updateEvent);

// HU1.5 - Envío de evento a validación/aprobación
// POST /api/events/:id/submit-validation
router.post('/:id/submit-validation', authenticateToken, requireRole(['admin', 'organizador']), submitEventForValidation);

module.exports = router;

