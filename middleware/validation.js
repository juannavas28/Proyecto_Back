// Middleware para validar datos de entrada
const validateCorreo = (correo) => {
  const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return correoRegex.test(correo);
};

const validateRequired = (data, requiredFields) => {
  const missing = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  }
  
  return missing;
};

// Middleware para validar datos de usuario
const validateUserData = (req, res, next) => {
  const { correo, contraseña } = req.body;
  const errors = [];

  if (!correo || !validateCorreo(correo)) {
    errors.push('correo inválido');
  }

  if (!contraseña || contraseña.length < 6) {
    // Contar sólo caracteres distintos de espacio
    const countChars = contraseña ? contraseña.replace(/\s/g, '').length : 0;
    if (countChars < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres (sin contar espacios)');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors
    });
  }

  next();
};

// Middleware para validar datos de organización
const validateOrganizationData = (req, res, next) => {
  const { nombre, nit, representante_legal, email, telefono } = req.body;
  const errors = [];

  // Campos obligatorios
  if (!nombre || nombre.trim().length < 2) {
    errors.push('El nombre de la organización es obligatorio y debe tener al menos 2 caracteres');
  }

  if (!nit || nit.trim().length < 3) {
    errors.push('El NIT es obligatorio y debe tener al menos 3 caracteres');
  }

  if (!representante_legal || representante_legal.trim().length < 3) {
    errors.push('El representante legal es obligatorio y debe tener al menos 3 caracteres');
  }

  if (!email || !validateCorreo(email)) {
    errors.push('El email de contacto es obligatorio y debe ser válido');
  }

  if (!telefono || telefono.trim().length < 7) {
    errors.push('El teléfono es obligatorio y debe tener al menos 7 dígitos');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de organización inválidos',
      errors
    });
  }

  next();
};

// Middleware para validar datos de evento
const validateEventData = (req, res, next) => {
  const { nombre_evento, descripcion, fecha_inicio, fecha_fin, ubicacion } = req.body;
  const errors = [];

  if (!nombre_evento || nombre_evento.trim().length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  }

  if (!descripcion || descripcion.trim().length < 10) {
    errors.push('La descripción debe tener al menos 10 caracteres');
  }

  if (!fecha_inicio) {
    errors.push('La fecha de inicio es requerida');
  }

  if (!fecha_fin) {
    errors.push('La fecha de fin es requerida');
  }

  if (fecha_inicio && fecha_fin && new Date(fecha_inicio) >= new Date(fecha_fin)) {
    errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
  }

  if (!ubicacion || ubicacion.trim().length < 3) {
    errors.push('La ubicación debe tener al menos 3 caracteres');
  }

  // Validar que los archivos subidos sean PDF
  if (req.files) {
    if (req.files['aval_pdf'] && req.files['aval_pdf'][0]) {
      const avalFile = req.files['aval_pdf'][0];
      if (avalFile.mimetype !== 'application/pdf') {
        errors.push('El documento de aval debe ser un archivo PDF');
      }
      if (avalFile.size > 5 * 1024 * 1024) {
        errors.push('El documento de aval no puede superar los 5 MB');
      }
    }
    if (req.files['acta_comite_pdf'] && req.files['acta_comite_pdf'][0]) {
      const actaFile = req.files['acta_comite_pdf'][0];
      if (actaFile.mimetype !== 'application/pdf') {
        errors.push('El acta de comité debe ser un archivo PDF');
      }
      if (actaFile.size > 5 * 1024 * 1024) {
        errors.push('El acta de comité no puede superar los 5 MB');
      }
    }
  }

  if (errors.length > 0) {
    console.log('Errores de validación de evento:', errors);
    return res.status(400).json({
      success: false,
      message: 'Datos de evento inválidos',
      errors
    });
  }

  next();
};

// Middleware para validar datos de registro de usuario
const validateUserRegistrationData = (req, res, next) => {
  const { correo, contraseña, nombre, telefono, rol } = req.body;
  const errors = [];

  if (!correo || !validateCorreo(correo)) {
    errors.push('Correo inválido');
  }

  if (!contraseña || contraseña.length < 6) {
    const countChars = contraseña ? contraseña.replace(/\s/g, '').length : 0;
    if (countChars < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres (sin contar espacios)');
    }
  }

  if (!nombre || nombre.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }

  if (telefono && telefono.length < 7) {
    errors.push('Teléfono inválido');
  }

  if (rol && !['DOCENTE', 'ESTUDIANTE', 'SECRETARIO'].includes(rol)) {
    errors.push('Rol inválido. Debe ser "DOCENTE", "ESTUDIANTE" o "SECRETARIO"');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de registro inválidos',
      errors
    });
  }

  next();
};

// Middleware para validar datos de actualización de perfil de usuario
const validateUserProfileData = (req, res, next) => {
  const { correo, nombre, telefono } = req.body;
  const errors = [];

  if (correo && !validateCorreo(correo)) {
    errors.push('Correo inválido');
  }

  if (nombre !== undefined && (!nombre || nombre.trim().length < 2)) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }

  if (telefono && telefono.length < 7) {
    errors.push('Teléfono inválido');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de perfil inválidos',
      errors
    });
  }

  next();
};

// Middleware para validar solicitud de recuperación de contraseña
const validateForgotContraseñaData = (req, res, next) => {
  const { correo } = req.body;
  const errors = [];

  if (!correo || !validateCorreo(correo)) {
    errors.push('Correo inválido');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Correo requerido',
      errors
    });
  }

  next();
};

// Middleware para validar restablecimiento de contraseña
const validateResetContraseñaData = (req, res, next) => {
  const { token, nuevaContraseña, newContraseña } = req.body;
  const errors = [];

  if (!token || token.trim().length === 0) {
    errors.push('Token requerido');
  }

  const pwd = nuevaContraseña || newContraseña;
  if (!pwd) {
    errors.push('La nueva contraseña es requerida');
  } else {
    const countChars = pwd ? pwd.replace(/\s/g, '').length : 0;
    if (countChars < 6) {
      errors.push('La nueva contraseña debe tener al menos 6 caracteres (sin contar espacios)');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de restablecimiento inválidos',
      errors
    });
  }

  next();
};

// Middleware para validar datos de creación de evento
const validateEventCreationData = (req, res, next) => {
  const { nombre_evento, descripcion, fecha_inicio, fecha_fin, ubicacion } = req.body;
  const errors = [];

  if (!nombre_evento || nombre_evento.trim().length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  }

  if (!descripcion || descripcion.trim().length < 10) {
    errors.push('La descripción debe tener al menos 10 caracteres');
  }

  if (!fecha_inicio) {
    errors.push('La fecha de inicio es requerida');
  }

  if (!fecha_fin) {
    errors.push('La fecha de fin es requerida');
  }

  if (fecha_inicio && fecha_fin && new Date(fecha_inicio) >= new Date(fecha_fin)) {
    errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
  }

  if (!ubicacion || ubicacion.trim().length < 3) {
    errors.push('La ubicación debe tener al menos 3 caracteres');
  }


  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de evento inválidos',
      errors
    });
  }

  next();
};

module.exports = {
  validateCorreo,
  validateRequired,
  validateUserData,
  validateUserRegistrationData,
  validateUserProfileData,
  validateForgotContraseñaData,
  validateResetContraseñaData,
  validateOrganizationData,
  validateEventData,
  validateEventCreationData
};

