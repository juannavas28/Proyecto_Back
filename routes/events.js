const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Multer storage config (guarda en /uploads)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const { 
  createEvent, 
  updateEvent, 
  getAllEvents, 
  getEventById, 
  searchEvents, 
  deleteEvent,
  getMyEvents,
  submitEventForApproval,
  listPendingReview,
  approveEvent,
  rejectEvent
} = require("../controllers/eventController");

const { authenticateToken, requireRole } = require("../middleware/auth");
const { validateEventData } = require("../middleware/validation");

// HU1.1 - Registro de evento (cualquier usuario autenticado)
router.post(
  "/",
  authenticateToken,
  upload.fields([{ name: 'aval_pdf' }, { name: 'acta_comite_pdf' }]),
  validateEventData,
  createEvent
);

// HU1.2 - Actualización de evento (cualquier usuario autenticado puede editar sus propios eventos)
router.put(
  "/:id",
  authenticateToken,
  upload.fields([{ name: 'aval_pdf' }, { name: 'acta_comite_pdf' }]),
  updateEvent
);

// HU1.3 - Obtener todos los eventos
router.get("/", authenticateToken, getAllEvents);

// S2 HU1.4 - Listado de eventos del organizador
router.get("/mis", authenticateToken, getMyEvents);

// S2 HU4.1 - Visualización de pendientes de evaluación (SECRETARIO)
router.get(
  "/pendientes",
  authenticateToken,
  requireRole(["SECRETARIO"]),
  listPendingReview
);

// HU1.5 - Buscar eventos
router.get("/buscar/filtro", authenticateToken, searchEvents);

// HU1.4 - Obtener evento por ID
router.get("/:id", authenticateToken, getEventById);

// HU1.6 - Eliminar evento (cualquier usuario autenticado puede eliminar sus propios eventos)
router.delete(
  "/:id",
  authenticateToken,
  deleteEvent
);

// S2 HU1.5 - Enviar evento a validación (cualquier usuario autenticado puede enviar sus propios eventos)
router.post(
  "/:id/enviar",
  authenticateToken,
  submitEventForApproval
);

// S2 - Aprobar/Rechazar evento (SECRETARIO)
router.post(
  "/:id/aprobar",
  authenticateToken,
  requireRole(["SECRETARIO"]),
  approveEvent
);
router.post(
  "/:id/rechazar",
  authenticateToken,
  requireRole(["SECRETARIO"]),
  rejectEvent
);

module.exports = router;
