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

// HU3.1 - Registro de usuarios
const register = async (req, res) => {
  try {
    const { email, password, nombre, apellido, telefono, rol = 'organizador' } = req.body;

    // Verificar si ya existe un usuario con el mismo email
    const checkQuery = 'SELECT id FROM usuarios WHERE email = ?';
    const existing = await executeQuery(checkQuery, [email]);

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con ese email'
      });
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar nuevo usuario
    const insertQuery = `
      INSERT INTO usuarios 
      (email, password, nombre, apellido, telefono, rol, activo, fecha_registro)
      VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
    `;

    const result = await executeQuery(insertQuery, [
      email,
      hashedPassword,
      nombre,
      apellido,
      telefono || null,
      rol
    ]);

    // Obtener el usuario creado (sin contraseña)
    const newUserQuery = `
      SELECT id, email, nombre, apellido, telefono, rol, fecha_registro
      FROM usuarios 
      WHERE id = ?
    `;
    const newUser = await executeQuery(newUserQuery, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: newUser[0]
      }
    });

  } catch (error) {
    console.error('Error registrando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// HU3.3 - Edición de perfil de usuario
const updateProfile = async (req, res) => {
  try {
    const { nombre, apellido, telefono, email } = req.body;
    const userId = req.user.id;

    // Verificar si el nuevo email ya existe (si se está cambiando)
    if (email) {
      const emailCheckQuery = 'SELECT id FROM usuarios WHERE email = ? AND id != ?';
      const emailExists = await executeQuery(emailCheckQuery, [email, userId]);

      if (emailExists.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un usuario con ese email'
        });
      }
    }

    // Construir query de actualización dinámicamente
    const updateFields = [];
    const updateParams = [];

    if (nombre !== undefined) {
      updateFields.push('nombre = ?');
      updateParams.push(nombre);
    }
    if (apellido !== undefined) {
      updateFields.push('apellido = ?');
      updateParams.push(apellido);
    }
    if (telefono !== undefined) {
      updateFields.push('telefono = ?');
      updateParams.push(telefono);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateParams.push(email);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar'
      });
    }

    updateFields.push('fecha_actualizacion = NOW()');
    updateParams.push(userId);

    const updateQuery = `
      UPDATE usuarios 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;

    await executeQuery(updateQuery, updateParams);

    // Obtener el usuario actualizado
    const updatedUserQuery = `
      SELECT id, email, nombre, apellido, telefono, rol, fecha_registro, fecha_actualizacion
      FROM usuarios 
      WHERE id = ?
    `;
    const updatedUser = await executeQuery(updatedUserQuery, [userId]);

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        user: updatedUser[0]
      }
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// HU3.4 - Recuperación de credenciales
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Buscar usuario por email
    const userQuery = 'SELECT id, email, nombre FROM usuarios WHERE email = ? AND activo = 1';
    const users = await executeQuery(userQuery, [email]);

    if (users.length === 0) {
      // Por seguridad, siempre devolver éxito aunque el email no exista
      return res.status(200).json({
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña'
      });
    }

    const user = users[0];

    // Generar token de recuperación (válido por 1 hora)
    const resetToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        type: 'password_reset'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Guardar token en la base de datos (opcional, para invalidar tokens usados)
    // Por simplicidad, usaremos solo el token JWT

    // En un entorno real, aquí enviarías un email con el enlace de recuperación
    // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    console.log(`🔗 Enlace de recuperación para ${user.email}: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña',
      // En desarrollo, incluir el token para testing
      ...(process.env.NODE_ENV === 'development' && {
        resetToken: resetToken
      })
    });

  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token y nueva contraseña son requeridos'
      });
    }

    // Verificar el token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: 'El token de recuperación ha expirado'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Token de recuperación inválido'
      });
    }

    // Verificar que es un token de recuperación
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Verificar que el usuario aún existe
    const userQuery = 'SELECT id FROM usuarios WHERE id = ? AND email = ? AND activo = 1';
    const users = await executeQuery(userQuery, [decoded.userId, decoded.email]);

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    // Validar nueva contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Encriptar nueva contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    const updateQuery = `
      UPDATE usuarios 
      SET password = ?, fecha_actualizacion = NOW()
      WHERE id = ?
    `;
    await executeQuery(updateQuery, [hashedPassword, decoded.userId]);

    res.status(200).json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });

  } catch (error) {
    console.error('Error restableciendo contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// HU3.5 - Cierre de sesión
const logout = async (req, res) => {
  try {
    // Con JWT sin estado, el logout se maneja principalmente en el frontend
    // eliminando el token del almacenamiento local/session
    
    // Opcionalmente, podríamos mantener una blacklist de tokens en la base de datos
    // pero para simplificar, solo confirmamos el logout
    
    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  resetPassword,
  logout
};

