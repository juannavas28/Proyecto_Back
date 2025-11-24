const jwt = require("jsonwebtoken");

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token no proporcionado",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Normalizar el objeto user para que siempre tenga 'id' (el JWT contiene 'userId')
    req.user = {
      ...decoded,
      id: decoded.userId || decoded.id // Asegurar que siempre haya 'id'
    };
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Token inválido o expirado",
    });
  }
};

// Middleware para verificar rol de usuario
const requireRole = (rolesPermitidos) => {
  return (req, res, next) => {
    // Asegura que el usuario exista y tenga rol válido
    if (!req.user || !req.user.rol) {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado: usuario sin rol asignado",
      });
    }

    // Normaliza ambos lados a mayúsculas para comparar correctamente
    const rolUsuario = req.user.rol.toUpperCase();
    const rolesUpper = rolesPermitidos.map((r) => String(r).toUpperCase());

    if (!rolesUpper.includes(rolUsuario)) {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado: rol no autorizado",
      });
    }

    next();
  };
};

module.exports = { authenticateToken, requireRole };
