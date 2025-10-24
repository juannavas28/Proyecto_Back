const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../db');

// HU3.1 - Registro de usuarios
const registerUser = async (req, res) => {
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
      message: 'Error interno del servidor'
    });
  }
};

// HU3.2 - Autenticación de usuarios (login con correo/contraseña)
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

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
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

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
      message: 'Error interno del servidor'
    });
  }
};

// HU3.3 - Obtener usuario actual
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
      data: { user: users[0] }
    });

  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// HU3.3 - Actualizar perfil
const updateProfile = async (req, res) => {
  try {
    const { nombre, apellido, telefono, email } = req.body;
    const userId = req.user.id;

    const updateQuery = `
      UPDATE usuarios
      SET nombre = ?, apellido = ?, telefono = ?, email = ?, fecha_actualizacion = NOW()
      WHERE id = ?
    `;

    await executeQuery(updateQuery, [nombre, apellido, telefono, email, userId]);

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// HU3.4 - Recuperación de credenciales
const forgotPassword = async (req, res) => {
  res.json({ success: true, message: "Recuperación de contraseña (por implementar)" });
};

const resetPassword = async (req, res) => {
  res.json({ success: true, message: "Restablecimiento de contraseña (por implementar)" });
};

// HU3.5 - Cierre de sesión
const logoutUser = async (req, res) => {
  res.json({ success: true, message: "Sesión cerrada exitosamente" });
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  resetPassword,
  logoutUser
};
