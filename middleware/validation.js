// Middleware para validar datos de entrada
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
  const { email, password } = req.body;
  const errors = [];

  if (!email || !validateEmail(email)) {
    errors.push('Email inválido');
  }

  if (!password || password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
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
  const { nombre, email, telefono, direccion } = req.body;
  const errors = [];

  if (!nombre || nombre.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }

  if (email && !validateEmail(email)) {
    errors.push('Email inválido');
  }

  if (telefono && telefono.length < 7) {
    errors.push('Teléfono inválido');
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
  const { titulo, descripcion, fecha_inicio, fecha_fin, ubicacion } = req.body;
  const errors = [];

  if (!titulo || titulo.trim().length < 3) {
    errors.push('El título debe tener al menos 3 caracteres');
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
  validateEmail,
  validateRequired,
  validateUserData,
  validateOrganizationData,
  validateEventData
};
