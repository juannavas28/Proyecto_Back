// routes/auth.js
const express = require("express");
const router = express.Router();

// Importar controlador de autenticación
const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  resetPassword,
  logoutUser
} = require("../controllers/authController");

// HU3.1 - Registro de usuarios
router.post("/register", registerUser);

// HU3.2 - Autenticación de usuarios (login)
router.post("/login", loginUser);

// HU3.3 - Obtener información del usuario actual
router.get("/me", getCurrentUser);

// HU3.3 - Actualizar perfil de usuario
router.put("/profile", updateProfile);

// HU3.4 - Recuperación de credenciales
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// HU3.5 - Cierre de sesión
router.post("/logout", logoutUser);

module.exports = router;
