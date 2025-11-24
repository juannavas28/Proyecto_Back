// routes/auth.js
const express = require("express");
const router = express.Router();

// Importar controlador de autenticación
const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  forgotContraseña,
  resetContraseña,
  logoutUser,
  verifyEmail,
  changePasswordAuthenticated,
} = require("../controllers/authController");

// Importar middlewares de autenticación JWT
const { authenticateToken, requireRole } = require("../middleware/auth");

// HU3.1 - Registro de usuarios
router.post("/register", registerUser);

// HU3.2 - Autenticación de usuarios (login)
router.post("/login", loginUser);

// HU3.3 - Obtener información del usuario actual
router.get("/me", authenticateToken, getCurrentUser);

// HU3.3 - Actualizar perfil de usuario
router.put("/profile", authenticateToken, updateProfile);

// Cambiar contraseña (usuario autenticado)
router.put('/profile/password', authenticateToken, changePasswordAuthenticated);

// HU3.4 - Recuperación de credenciales
router.post("/forgot-contraseña", forgotContraseña);
router.post("/reset-contraseña", resetContraseña);
// Rutas alternativas ASCII para evitar problemas con caracteres especiales
router.post("/forgot-password", forgotContraseña);
router.post("/reset-password", resetContraseña);

// Verificación de correo
router.post("/verify-email", verifyEmail);

// HU3.5 - Cierre de sesión
router.post("/logout", authenticateToken, logoutUser);

module.exports = router;
