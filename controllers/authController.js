const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../db');

// HU3.2 - Autenticación de usuarios (login con correo/contraseña)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const userQuery = `
      SELECT id, email, password, nombre, apellido, rol, activo 
      FROM usuarios 
      WHERE email = ? AND activo = 1
    `;
    
    const users = await executeQuery(userQuery, [email]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = users[0];

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Respuesta exitosa (sin incluir la contraseña)
    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol
        }
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Función para verificar el token (endpoint de verificación)
const verifyToken = async (req, res) => {
  try {
    // Si llegamos aquí, el middleware de autenticación ya validó el token
    res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Función para obtener información del usuario actual
const getCurrentUser = async (req, res) => {
  try {
    const userQuery = `
      SELECT id, email, nombre, apellido, rol, telefono, fecha_registro
      FROM usuarios 
      WHERE id = ? AND activo = 1
    `;
    
    const users = await executeQuery(userQuery, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: users[0]
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  login,
  verifyToken,
  getCurrentUser
};
