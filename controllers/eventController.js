const { executeQuery } = require('../db');

// HU1.2 - Edición de evento antes de validación (UPDATE)
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      titulo, 
      descripcion, 
      fecha_inicio, 
      fecha_fin, 
      ubicacion, 
      capacidad_maxima,
      costo_entrada,
      categoria,
      organizador_id,
      organizacion_externa_id
    } = req.body;

    // Verificar que el evento existe
    const checkQuery = 'SELECT id, estado FROM eventos WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    const event = existing[0];

    // Solo permitir edición si el evento está en estado 'borrador' o 'pendiente_revision'
    if (!['borrador', 'pendiente_revision'].includes(event.estado)) {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden editar eventos en estado "borrador" o "pendiente_revision"'
      });
    }

    // Construir query de actualización dinámicamente
    const updateFields = [];
    const updateParams = [];

    if (titulo !== undefined) {
      updateFields.push('titulo = ?');
      updateParams.push(titulo);
    }
    if (descripcion !== undefined) {
      updateFields.push('descripcion = ?');
      updateParams.push(descripcion);
    }
    if (fecha_inicio !== undefined) {
      updateFields.push('fecha_inicio = ?');
      updateParams.push(fecha_inicio);
    }
    if (fecha_fin !== undefined) {
      updateFields.push('fecha_fin = ?');
      updateParams.push(fecha_fin);
    }
    if (ubicacion !== undefined) {
      updateFields.push('ubicacion = ?');
      updateParams.push(ubicacion);
    }
    if (capacidad_maxima !== undefined) {
      updateFields.push('capacidad_maxima = ?');
      updateParams.push(capacidad_maxima);
    }
    if (costo_entrada !== undefined) {
      updateFields.push('costo_entrada = ?');
      updateParams.push(costo_entrada);
    }
    if (categoria !== undefined) {
      updateFields.push('categoria = ?');
      updateParams.push(categoria);
    }
    if (organizador_id !== undefined) {
      updateFields.push('organizador_id = ?');
      updateParams.push(organizador_id);
    }
    if (organizacion_externa_id !== undefined) {
      updateFields.push('organizacion_externa_id = ?');
      updateParams.push(organizacion_externa_id);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar'
      });
    }

    updateFields.push('fecha_actualizacion = NOW()');
    updateParams.push(id);

    const updateQuery = `
      UPDATE eventos 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;

    await executeQuery(updateQuery, updateParams);

    // Obtener el evento actualizado
    const updatedEventQuery = `
      SELECT e.*, 
             u.nombre as organizador_nombre, 
             u.apellido as organizador_apellido,
             o.nombre as organizacion_nombre
      FROM eventos e
      LEFT JOIN usuarios u ON e.organizador_id = u.id
      LEFT JOIN organizaciones_externas o ON e.organizacion_externa_id = o.id
      WHERE e.id = ?
    `;
    const updatedEvent = await executeQuery(updatedEventQuery, [id]);

    res.status(200).json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: {
        event: updatedEvent[0]
      }
    });

  } catch (error) {
    console.error('Error actualizando evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// HU1.5 - Envío de evento a validación/aprobación (UPDATE estado del evento)
const submitEventForValidation = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el evento existe
    const checkQuery = 'SELECT id, estado, titulo, descripcion, fecha_inicio, fecha_fin, ubicacion FROM eventos WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    const event = existing[0];

    // Solo permitir envío a validación si el evento está en estado 'borrador'
    if (event.estado !== 'borrador') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden enviar a validación eventos en estado "borrador"'
      });
    }

    // Validar que el evento tenga todos los campos requeridos
    const requiredFields = ['titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'ubicacion'];
    const missingFields = requiredFields.filter(field => !event[field] || event[field].trim() === '');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El evento debe tener todos los campos requeridos antes de enviarse a validación',
        missingFields
      });
    }

    // Actualizar estado a 'pendiente_revision'
    const updateQuery = `
      UPDATE eventos 
      SET estado = 'pendiente_revision', 
          fecha_envio_validacion = NOW(),
          fecha_actualizacion = NOW()
      WHERE id = ?
    `;

    await executeQuery(updateQuery, [id]);

    // Obtener el evento actualizado
    const updatedEventQuery = `
      SELECT e.*, 
             u.nombre as organizador_nombre, 
             u.apellido as organizador_apellido,
             o.nombre as organizacion_nombre
      FROM eventos e
      LEFT JOIN usuarios u ON e.organizador_id = u.id
      LEFT JOIN organizaciones_externas o ON e.organizacion_externa_id = o.id
      WHERE e.id = ?
    `;
    const updatedEvent = await executeQuery(updatedEventQuery, [id]);

    res.status(200).json({
      success: true,
      message: 'Evento enviado a validación exitosamente',
      data: {
        event: updatedEvent[0]
      }
    });

  } catch (error) {
    console.error('Error enviando evento a validación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Función adicional: Obtener evento por ID
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT e.*, 
             u.nombre as organizador_nombre, 
             u.apellido as organizador_apellido,
             u.email as organizador_email,
             o.nombre as organizacion_nombre,
             o.email as organizacion_email
      FROM eventos e
      LEFT JOIN usuarios u ON e.organizador_id = u.id
      LEFT JOIN organizaciones_externas o ON e.organizacion_externa_id = o.id
      WHERE e.id = ?
    `;
    const events = await executeQuery(query, [id]);

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        event: events[0]
      }
    });

  } catch (error) {
    console.error('Error obteniendo evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Función adicional: Obtener eventos por estado
const getEventsByStatus = async (req, res) => {
  try {
    const { estado, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT e.*, 
             u.nombre as organizador_nombre, 
             u.apellido as organizador_apellido,
             o.nombre as organizacion_nombre
      FROM eventos e
      LEFT JOIN usuarios u ON e.organizador_id = u.id
      LEFT JOIN organizaciones_externas o ON e.organizacion_externa_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      query += ' AND e.estado = ?';
      params.push(estado);
    }

    // Contar total de registros
    const countQuery = query.replace('SELECT e.*, u.nombre as organizador_nombre, u.apellido as organizador_apellido, o.nombre as organizacion_nombre', 'SELECT COUNT(*) as total');
    const countResult = await executeQuery(countQuery, params);
    const total = countResult[0].total;

    // Obtener registros paginados
    query += ' ORDER BY e.fecha_creacion DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const events = await executeQuery(query, params);

    res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// HU1.1 - Registro de evento
const createEvent = async (req, res) => {
  try {
    const { 
      titulo, 
      descripcion, 
      fecha_inicio, 
      fecha_fin, 
      ubicacion, 
      capacidad_maxima,
      costo_entrada,
      categoria,
      organizacion_externa_id
    } = req.body;

    const organizador_id = req.user.id;

    // Verificar que la organización externa existe (si se proporciona)
    if (organizacion_externa_id) {
      const orgCheckQuery = 'SELECT id FROM organizaciones_externas WHERE id = ? AND activo = 1';
      const orgExists = await executeQuery(orgCheckQuery, [organizacion_externa_id]);

      if (orgExists.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Organización externa no encontrada o inactiva'
        });
      }
    }

    // Insertar nuevo evento
    const insertQuery = `
      INSERT INTO eventos 
      (titulo, descripcion, fecha_inicio, fecha_fin, ubicacion, capacidad_maxima, 
       costo_entrada, categoria, estado, organizador_id, organizacion_externa_id, fecha_creacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'borrador', ?, ?, NOW())
    `;

    const result = await executeQuery(insertQuery, [
      titulo,
      descripcion,
      fecha_inicio,
      fecha_fin,
      ubicacion,
      capacidad_maxima || null,
      costo_entrada || 0,
      categoria || 'General',
      organizador_id,
      organizacion_externa_id || null
    ]);

    // Obtener el evento creado con información del organizador y organización
    const newEventQuery = `
      SELECT e.*, 
             u.nombre as organizador_nombre, 
             u.apellido as organizador_apellido,
             o.nombre as organizacion_nombre
      FROM eventos e
      LEFT JOIN usuarios u ON e.organizador_id = u.id
      LEFT JOIN organizaciones_externas o ON e.organizacion_externa_id = o.id
      WHERE e.id = ?
    `;
    const newEvent = await executeQuery(newEventQuery, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: {
        event: newEvent[0]
      }
    });

  } catch (error) {
    console.error('Error creando evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createEvent,
  updateEvent,
  submitEventForValidation,
  getEventById,
  getEventsByStatus
};

module.exports.createEventEnhanced = async function createEventEnhanced(req, res) {
  const { validationResult } = require('express-validator');
  const path = require('path');
  const fs = require('fs');
  const db = require('mysql2/promise'); // usa tu pool mysql2/promise

  try {
    // --- Validación de campos obligatorios ---
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Hay campos obligatorios sin completar',
        details: errors.array().map(e => ({ field: e.path, code: e.msg })),
      });
    }

    // --- Validación de PDF (por multer o por body .pdf) ---
    let aval_pdf_path;
    const isPdfName = (s) => /\.pdf$/i.test(String(s || '').trim());

    if (!req.file) {
      const avalPdfBody =
        req.body?.aval_pdf_path ||
        req.body?.avalPdfPath ||
        req.body?.avalPdf ||
        null;

      if (!avalPdfBody) {
        return res.status(400).json({
          success: false,
          message: 'Debe adjuntar el aval en PDF',
          details: [{ field: 'avalPdf', code: 'AVAL_PDF_REQUERIDO' }],
        });
      }
      if (!isPdfName(avalPdfBody)) {
        return res.status(400).json({
          success: false,
          message: 'El archivo adjunto no es válido: solo se acepta PDF.',
          details: [{ field: 'aval_pdf_path', code: 'AVAL_DEBE_SER_PDF' }],
        });
      }
      aval_pdf_path = avalPdfBody;
    } else {
      if (req.file.mimetype !== 'application/pdf') {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
        return res.status(400).json({
          success: false,
          message: 'El archivo adjunto no es válido: solo se acepta PDF.',
          details: [{ field: 'avalPdf', code: 'AVAL_DEBE_SER_PDF' }],
        });
      }
      // guarda ruta relativa amigable
      aval_pdf_path = path.join('uploads', 'avales', path.basename(req.file.path));
    }

    // --- Verificar que la organización exista ---
    const orgId = Number(req.body.organizacion_id);
    const [orgRows] = await db.query('SELECT id FROM organizations WHERE id = ?', [orgId]);
    if (!orgRows || orgRows.length === 0) {
      // si subiste archivo físico y la org no existe, limpia
      if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
      return res.status(400).json({
        success: false,
        message: 'La organización no existe',
        details: [{ field: 'organizacion_id', code: 'ORGANIZACION_NO_ENCONTRADA' }],
      });
    }

    // --- Estado por defecto: Borrador ---
    const estado = req.body?.estado || 'Borrador';

    // --- Datos del body ---
    const {
      nombre,
      tipo,
      fecha,
      lugar,
      unidad_academica,
      responsable,
      descripcion = null,
    } = req.body;

    const created_by = req.user ? req.user.id : null;

    // --- INSERT (no toca tu SQL existente en otros handlers) ---
    const [result] = await db.query(
      `INSERT INTO events
        (nombre, tipo, fecha, lugar, unidad_academica, responsable, descripcion,
         organizacion_id, aval_pdf_path, estado, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        tipo,
        fecha,
        lugar,
        unidad_academica,
        responsable,
        descripcion,
        orgId,
        aval_pdf_path,
        estado,
        created_by,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Evento registrado en estado "Borrador".',
      data: { id: result.insertId, nombre, estado },
    });
  } catch (err) {
    console.error('createEventEnhanced error:', err);
    return res.status(500).json({ success: false, message: 'Error interno al registrar el evento' });
  }
};
