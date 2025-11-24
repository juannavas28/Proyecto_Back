const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { executeQuery } = require('../db');

// HU3.1 - Registro de usuarios
const registerUser = async (req, res) => {
  try {
    const { correo, contraseña, nombre, apellido, telefono, rol = 'ESTUDIANTE' } = req.body;

    // Validación de campos requeridos (evitar undefined en SQL)
    if (!correo || !contraseña || !nombre || !apellido) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: correo, contraseña, nombre, apellido'
      });
    }

    // Validar que el correo sea @uao.edu.co
    if (!correo.endsWith('@uao.edu.co')) {
      return res.status(400).json({
        success: false,
        message: 'Solo se permiten correos institucionales (@uao.edu.co)'
      });
    }

    // Verificar si ya existe un usuario con el mismo email
    const checkQuery = 'SELECT id FROM usuarios WHERE correo = ?';
    const existing = await executeQuery(checkQuery, [correo]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con ese correo'
      });
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const hashedContraseña = await bcrypt.hash(contraseña, saltRounds);

    // Insertar nuevo usuario
    const insertQuery = `
  INSERT INTO usuarios 
  (correo, contraseña, nombre, apellido, telefono, rol, activo, fecha_registro)
  VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
`;


    // Validación/normalización de rol (según esquema de BD)
    const allowedRoles = ['DOCENTE', 'ESTUDIANTE', 'SECRETARIO'];
    const rolUpper = typeof rol === 'string' ? rol.toUpperCase() : 'ESTUDIANTE';
    const rolSeguro = allowedRoles.includes(rolUpper) ? rolUpper : 'ESTUDIANTE';

    const result = await executeQuery(insertQuery, [
      correo,
      hashedContraseña,
      nombre,
      apellido,
      (telefono ?? null),
      rolSeguro
    ]);

    // Intentar inicializar campo de verificación de correo (si existe la columna)
    try {
      await executeQuery('UPDATE usuarios SET correo_verificado = 0 WHERE id = ?', [result.insertId]);
    } catch (e) {
      // columna no existe, no es crítico
    }

    // Generar token de verificación y enviar por correo si SMTP está configurado
    const verifyToken = jwt.sign({ userId: result.insertId, action: 'verify_email' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const smtpHost = process.env.SMTP_HOST;
    if (smtpHost) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
        });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verifyLink = `${frontendUrl}/verify-email?token=${verifyToken}`;
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'no-reply@example.com',
          to: correo,
          subject: 'Verifica tu correo - SIGEU',
          html: `<p>Bienvenido ${nombre}. Verifica tu correo haciendo clic en el siguiente enlace:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`
        });
      } catch (mailErr) {
        console.error('Error enviando email de verificación:', mailErr.message || mailErr);
      }
    }

    // Obtener el usuario creado (sin contraseña)
    const newUserQuery = `
      SELECT id, correo, nombre, apellido, telefono, rol
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

// HU3.2 - Autenticación de usuarios (login con email/password)
const loginUser = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    const userQuery = `
      SELECT id, correo, contraseña, nombre, apellido, rol, telefono
      FROM usuarios 
      WHERE correo = ? AND activo = 1
    `;
    const users = await executeQuery(userQuery, [correo]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = users[0];
    const isContraseñaValid = await bcrypt.compare(contraseña, user.contraseña);
    if (!isContraseñaValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = jwt.sign(
      { userId: user.id, correo: user.correo, rol: user.rol },
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
          correo: user.correo,
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
      SELECT id, correo, nombre, apellido, rol, telefono
      FROM usuarios 
      WHERE id = ? AND activo = 1
    `;
    const users = await executeQuery(userQuery, [req.user.userId]);

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
    let { nombre, apellido, telefono, correo } = req.body;
    const userId = req.user?.userId; // ID desde el token JWT

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "No se pudo identificar al usuario desde el token",
      });
    }

    // Evitar undefined → usar null
    nombre = nombre ?? null;
    apellido = apellido ?? null;
    telefono = telefono ?? null;
    correo = correo ?? null;

    // Si se proporciona un correo, verificar que no pertenezca a otro usuario
    if (correo) {
      const checkCorreoQuery = 'SELECT id FROM usuarios WHERE correo = ? AND id != ?';
      const found = await executeQuery(checkCorreoQuery, [correo, userId]);
      if (found.length > 0) {
        return res.status(409).json({ success: false, message: 'El correo ya está en uso por otro usuario' });
      }
    }

    console.log("📨 Datos recibidos:", { nombre, apellido, telefono, correo, userId });

    // Obtener correo anterior para detectar cambios y forzar verificación si cambió
    let previousCorreo = null;
    try {
      const prevQ = 'SELECT correo FROM usuarios WHERE id = ?';
      const prev = await executeQuery(prevQ, [userId]);
      if (prev && prev.length) previousCorreo = prev[0].correo;
    } catch (e) {
      console.warn('No se pudo leer correo anterior:', e.message || e);
    }

    const updateQuery = `
      UPDATE usuarios
      SET nombre = ?, apellido = ?, telefono = ?, correo = ?, fecha_actualizacion = NOW()
      WHERE id = ?
    `;

    await executeQuery(updateQuery, [nombre, apellido, telefono, correo, userId]);

    // Obtener usuario actualizado y devolverlo (sin contraseña)
    const getUserQuery = `
      SELECT id, correo, nombre, apellido, telefono, rol
      FROM usuarios
      WHERE id = ?
    `;
    const users = await executeQuery(getUserQuery, [userId]);

    // Si el correo cambió, forzar verificación: marcar como no verificado y enviar token
    const responseData = { user: users[0] };
    try {
      if (correo && previousCorreo && correo !== previousCorreo) {
        // Intentar marcar correo_verificado = 0 si la columna existe
        try {
          await executeQuery('UPDATE usuarios SET correo_verificado = 0 WHERE id = ?', [userId]);
        } catch (e) {
          console.warn('No se pudo actualizar columna correo_verificado:', e.message || e);
        }

        // Generar token de verificación
        const verifyToken = jwt.sign({ userId, action: 'verify_email' }, process.env.JWT_SECRET, { expiresIn: '7d' });

        const smtpHost = process.env.SMTP_HOST;
        if (smtpHost) {
          try {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
              secure: process.env.SMTP_SECURE === 'true',
              auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
            });
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const verifyLink = `${frontendUrl}/verify-email?token=${verifyToken}`;
            await transporter.sendMail({
              from: process.env.SMTP_FROM || 'no-reply@example.com',
              to: correo,
              subject: 'Verifica tu nuevo correo - SIGEU',
              html: `<p>Hola ${users[0].nombre || ''}. Verifica tu nuevo correo haciendo clic en el siguiente enlace:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`
            });
            responseData.verification = { sent: true, message: 'Email de verificación enviado' };
          } catch (mailErr) {
            console.error('Error enviando email de verificación:', mailErr.message || mailErr);
            // Fallback: devolver token para pruebas
            responseData.verification = { sent: false, token: verifyToken, message: 'SMTP falló; token devuelto para pruebas' };
          }
        } else {
          // No hay SMTP configurado: devolver token para pruebas
          responseData.verification = { sent: false, token: verifyToken, message: 'No hay SMTP configurado; token incluido en respuesta para pruebas' };
        }
      }
    } catch (e) {
      console.warn('Error procesando verificación de correo:', e.message || e);
    }

    res.status(200).json({
      success: true,
      message: "Perfil actualizado exitosamente",
      data: responseData
    });
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};


// Cambiar contraseña para usuario autenticado
const changePasswordAuthenticated = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, nuevaContraseña } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: 'Usuario no identificado' });
    if (!currentPassword || !nuevaContraseña) return res.status(400).json({ success: false, message: 'Contraseña actual y nueva son requeridas' });

    // Obtener contraseña actual desde BD
    const query = 'SELECT contraseña FROM usuarios WHERE id = ?';
    const users = await executeQuery(query, [userId]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    const hashed = users[0].contraseña;
    const isValid = await bcrypt.compare(currentPassword, hashed);
    if (!isValid) return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });

    // Validar nueva contraseña (contar sólo caracteres no-espacio), mínimo 6
    const countChars = nuevaContraseña.replace(/\s/g, '').length;
    if (countChars < 6) {
      return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres (sin contar espacios)' });
    }

    const saltRounds = 10;
    const newHashed = await bcrypt.hash(nuevaContraseña, saltRounds);
    await executeQuery('UPDATE usuarios SET contraseña = ?, fecha_actualizacion = NOW() WHERE id = ?', [newHashed, userId]);

    return res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error cambiando contraseña autenticada:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// HU3.4 - Recuperación de credenciales (genera token de reseteo firmado)
const forgotContraseña = async (req, res) => {
  try {
    const { correo } = req.body;
    if (!correo) {
      return res.status(400).json({ success: false, message: 'Correo es requerido' });
    }
    
    // Validar que el correo sea @uao.edu.co
    if (!correo.endsWith('@uao.edu.co')) {
      return res.status(400).json({ success: false, message: 'Solo se permiten correos institucionales (@uao.edu.co)' });
    }
    
    const findUserQuery = 'SELECT id, correo, nombre FROM usuarios WHERE correo = ? AND activo = 1';
    const users = await executeQuery(findUserQuery, [correo]);
    if (users.length === 0) {
      // No revelar si existe o no
      return res.status(200).json({ success: true, message: 'Si el correo existe, se enviará un enlace de recuperación' });
    }
    const user = users[0];
    
    const resetToken = jwt.sign(
      { userId: user.id, action: 'reset_password' },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );
    
    // Intentar enviar correo si la configuración SMTP está presente
    const smtpHost = process.env.SMTP_HOST;
    if (smtpHost) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'no-reply@example.com',
          to: user.correo,
          subject: 'Recuperación de contraseña - SIGEU',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <h2 style="color: #667eea; text-align: center;">Recuperación de Contraseña - SIGEU</h2>
              <p>Hola <strong>${user.nombre}</strong>,</p>
              <p>Recibimos una solicitud para restablecer tu contraseña.</p>
              <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Restablecer Contraseña</a>
              </div>
              <p style="color: #666; font-size: 14px;">O copia y pega este enlace en tu navegador:</p>
              <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">${resetLink}</p>
              <p><strong>Importante:</strong></p>
              <ul>
                <li>Este enlace es válido por <strong>30 minutos</strong></li>
                <li>Si no solicitaste este cambio, ignora este correo</li>
                <li>Tu contraseña actual seguirá siendo válida hasta que la cambies</li>
              </ul>
              <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
                Si no solicitaste este cambio, por favor contacta al administrador del sistema.
              </p>
            </div>
          `
        });

        return res.status(200).json({ success: true, message: 'Se ha enviado un enlace de recuperación a tu correo' });
      } catch (mailErr) {
        console.error('Error enviando correo SMTP:', mailErr.message || mailErr);
        // Fallback: devolver token (útil para pruebas)
        return res.status(200).json({ success: true, message: 'Token de reseteo (SMTP falló)', data: { resetToken } });
      }
    }

    // Si no hay configuración SMTP, devolver token para pruebas
    return res.status(200).json({ success: true, message: 'Token de reseteo generado', data: { resetToken } });
  } catch (error) {
    console.error('Error en forgotContraseña:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// HU3.4 - Reset de contraseña usando token
const resetContraseña = async (req, res) => {
  try {
    const { token, nuevaContraseña } = req.body;
    if (!token || !nuevaContraseña) {
      return res.status(400).json({ success: false, message: 'Token y nuevaContraseña son requeridos' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.action !== 'reset_password') {
      return res.status(400).json({ success: false, message: 'Token inválido' });
    }
    const saltRounds = 10;
    const hashed = await bcrypt.hash(nuevaContraseña, saltRounds);
    const updatePwdQuery = 'UPDATE usuarios SET contraseña = ?, fecha_actualizacion = NOW() WHERE id = ?';
    await executeQuery(updatePwdQuery, [hashed, decoded.userId]);
    return res.status(200).json({ success: true, message: 'Contraseña actualizada' });
  } catch (error) {
    console.error('Error en resetContraseña:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Verificación de correo con token
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token requerido' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Token inválido o expirado' });
    }

    if (decoded.action !== 'verify_email') {
      return res.status(400).json({ success: false, message: 'Token no válido para verificación de correo' });
    }

    const userId = decoded.userId;
    try {
      await executeQuery('UPDATE usuarios SET correo_verificado = 1 WHERE id = ?', [userId]);
      return res.status(200).json({ success: true, message: 'Correo verificado correctamente' });
    } catch (e) {
      // Si la columna no existe, devolver éxito pero avisar
      console.warn('No se pudo actualizar columna correo_verificado:', e.message || e);
      return res.status(200).json({ success: true, message: 'Token válido. Marca de verificación no guardada (columna falta).' });
    }
  } catch (error) {
    console.error('Error en verifyEmail:', error);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
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
  verifyEmail,
  forgotContraseña,
  resetContraseña,
  logoutUser,
  changePasswordAuthenticated
};
