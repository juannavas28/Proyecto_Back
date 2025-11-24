const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Multer storage for organization uploads
const storageOrg = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const uploadOrg = multer({ storage: storageOrg, limits: { fileSize: 10 * 1024 * 1024 } });
// Ya no se requiere subida de PDF aquí según el esquema actual

const {
  createOrganization,
  searchOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getAllOrganizations
} = require("../controllers/organizationController");

const { validateOrganizationData } = require("../middleware/validation");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Eliminado multer: no se adjunta certificado en organizaciones_externas

// HU2.1 - Registro de organización externa
router.post(
  "/",
  authenticateToken,
  uploadOrg.single('certificado_pdf'),
  validateOrganizationData,
  createOrganization
);

// Listar todas las organizaciones (con paginación)
router.get("/", authenticateToken, getAllOrganizations);

// HU2.2 - Búsqueda de organización externa
router.get("/search", authenticateToken, searchOrganizations);

// HU2.3 - Visualización de datos de organización externa
router.get("/:id", authenticateToken, getOrganizationById);

// HU2.4 - Edición de organización externa
// Cualquier usuario autenticado puede editar (el controlador valida que sea el creador)
router.put(
  "/:id",
  authenticateToken,
  uploadOrg.single('certificado_pdf'),
  validateOrganizationData,
  updateOrganization
);

// HU2.5 - Eliminación de organización externa
// Cualquier usuario autenticado puede eliminar (el controlador valida que sea el creador y que no tenga eventos)
router.delete("/:id", authenticateToken, deleteOrganization);

module.exports = router;