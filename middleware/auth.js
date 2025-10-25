const jwt = require("jsonwebtoken");

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ success: false, message: "Token no proporcionado" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // guarda info del usuario (id, rol, etc.)
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token inválido o expirado" });
  }
};

// Middleware para verificar rol de usuario
const requireRole = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado: rol no autorizado",
      });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };
