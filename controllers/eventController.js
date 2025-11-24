const { executeQuery } = require('../db');

// HU1.1 - Registro de evento
const createEvent = async (req, res) => {
  try {
    const {
      nombre_evento,
      descripcion,
      tipo,
      fecha_inicio,
      fecha_fin,
      ubicacion,
      organizacion_externa_id = null
    } = req.body;

    const creado_por = req.user?.id || null;

    // Convertir tipo a mayúsculas para que coincida con el ENUM de la BD
    const tipoUpper = tipo ? tipo.toUpperCase() : 'ACADEMICO';

    const insertQuery = `
      INSERT INTO eventos
      (nombre_evento, descripcion, tipo, fecha_inicio, fecha_fin, ubicacion, organizacion_externa_id, creado_por, estado, fecha_registro)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'borrador', NOW())
    `;

    const result = await executeQuery(insertQuery, [
      nombre_evento,
      descripcion,
      tipoUpper,
      fecha_inicio || null,
      fecha_fin || null,
      ubicacion || null,
      organizacion_externa_id || null,
      creado_por
    ]);

    const newEvent = await executeQuery('SELECT * FROM eventos WHERE id = ?', [result.insertId]);

    // Manejar ficheros subidos (no se guardan en BD por compatibilidad; se devuelven URLs)
    const fileUrls = {};
    if (req.files) {
      const host = req.protocol + '://' + req.get('host');
      if (req.files['aval_pdf'] && req.files['aval_pdf'][0]) {
        fileUrls.aval_pdf = host + '/uploads/' + req.files['aval_pdf'][0].filename;
      }
      if (req.files['acta_comite_pdf'] && req.files['acta_comite_pdf'][0]) {
        fileUrls.acta_comite_pdf = host + '/uploads/' + req.files['acta_comite_pdf'][0].filename;
      }
    }

    const eventToReturn = { ...newEvent[0] };
    if (Object.keys(fileUrls).length) eventToReturn.files = fileUrls;

    return res.status(201).json({ success: true, data: { event: eventToReturn } });
  } catch (error) {
    console.error('Error creando evento:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Obtener todos los eventos (con filtros opcionales y paginación)
const getAllEvents = async (req, res) => {
  try {
    const { tipo, estado, organizacion_externa_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Consulta para contar total
    let countQuery = `
      SELECT COUNT(*) as total
      FROM eventos e
      WHERE 1=1
    `;
    const countParams = [];
    
    // FILTRO POR ROL: 
    // - Si se filtra por 'aprobado', todos pueden ver esos eventos
    // - Si no es aprobado, Docentes/Estudiantes solo ven sus propios eventos
    // - SECRETARIO/ADMINISTRADOR ven todos
    if (estado === 'aprobado') {
      // Todos pueden ver eventos aprobados
    } else if (req.user?.rol !== 'SECRETARIO' && req.user?.rol !== 'ADMINISTRADOR') {
      countQuery += ' AND e.creado_por = ?';
      countParams.push(req.user?.userId);
    }
    
    if (tipo) { countQuery += ' AND e.tipo = ?'; countParams.push(tipo); }
    if (estado) { countQuery += ' AND e.estado = ?'; countParams.push(estado); }
    if (organizacion_externa_id) { countQuery += ' AND e.organizacion_externa_id = ?'; countParams.push(organizacion_externa_id); }

    const [countResult] = await executeQuery(countQuery, countParams);
    const total = countResult.total;

    // Consulta para obtener eventos paginados
    let query = `
      SELECT e.*, u.nombre as organizador_nombre, u.apellido as organizador_apellido, o.nombre as organizacion_nombre
      FROM eventos e
      LEFT JOIN usuarios u ON e.creado_por = u.id
      LEFT JOIN organizaciones_externas o ON e.organizacion_externa_id = o.id
      WHERE 1=1
    `;
    const params = [];
    
    // FILTRO POR ROL: 
    // - Si se filtra por 'aprobado', todos pueden ver esos eventos
    // - Si no es aprobado, Docentes/Estudiantes solo ven sus propios eventos
    // - SECRETARIO/ADMINISTRADOR ven todos
    if (estado === 'aprobado') {
      // Todos pueden ver eventos aprobados
    } else if (req.user?.rol !== 'SECRETARIO' && req.user?.rol !== 'ADMINISTRADOR') {
      query += ' AND e.creado_por = ?';
      params.push(req.user?.userId);
    }
    
    if (tipo) { query += ' AND e.tipo = ?'; params.push(tipo); }
    if (estado) { query += ' AND e.estado = ?'; params.push(estado); }
    if (organizacion_externa_id) { query += ' AND e.organizacion_externa_id = ?'; params.push(organizacion_externa_id); }
    query += ` ORDER BY e.fecha_registro DESC LIMIT ${limit} OFFSET ${offset}`;

    const events = await executeQuery(query, params);
    
    return res.status(200).json({ 
      success: true, 
      data: { 
        events, 
        total,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      } 
    });
  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// HU1.2 - Edición de evento antes de validación (UPDATE)
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre_evento,
      descripcion,
      tipo,
      fecha_inicio,
      fecha_fin,
      ubicacion,
      estado
    } = req.body;

    const checkQuery = 'SELECT id, estado, creado_por FROM eventos WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado.'
      });
    }

    // Permitir edición sólo en BORRADOR (antes de enviar a validación)
    if (existing[0].estado !== 'borrador') {
      return res.status(400).json({ success: false, message: 'Sólo se puede editar un evento en borrador.' });
    }
    
    // AUTORIZACIÓN: Solo el creador o ADMINISTRADOR puede editar (SECRETARIO NO puede editar)
    if (req.user?.rol !== 'ADMINISTRADOR' && existing[0].creado_por !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'No autorizado para editar este evento.' });
    }

    const updateFields = [];
    const updateParams = [];

    if (nombre_evento !== undefined) {
      updateFields.push('nombre_evento = ?');
      updateParams.push(nombre_evento);
    }
    if (descripcion !== undefined) {
      updateFields.push('descripcion = ?');
      updateParams.push(descripcion);
    }
    if (tipo !== undefined) {
      updateFields.push('tipo = ?');
      updateParams.push(tipo);
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
    if (estado !== undefined) {
      updateFields.push('estado = ?');
      updateParams.push(estado);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar.'
      });
    }

    updateParams.push(id);
    const updateQuery = `
      UPDATE eventos 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await executeQuery(updateQuery, updateParams);

    res.status(200).json({
      success: true,
      message: 'Evento actualizado exitosamente.'
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
    const checkQuery = 'SELECT id, estado, nombre_evento, descripcion, fecha_inicio, fecha_fin, ubicacion FROM eventos WHERE id = ?';
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
    const requiredFields = ['nombre_evento', 'descripcion', 'fecha_inicio', 'fecha_fin', 'ubicacion'];
    const missingFields = requiredFields.filter(field => !event[field] || (typeof event[field] === 'string' && event[field].trim() === ''));

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
      LEFT JOIN usuarios u ON e.creado_por = u.id
      LEFT JOIN organizaciones_externas o ON e.organizacion_externa_id = o.id
      WHERE e.id = ?
    `;
    const events = await executeQuery(updatedEventQuery, [id]);

    res.status(200).json({
      success: true,
      data: { events, total: events.length }
    });
  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// HU1.4 - Obtener evento por ID
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT * FROM eventos WHERE id = ?`;
    const result = await executeQuery(query, [id]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado.'
      });
    }

    res.status(200).json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error obteniendo evento por ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// HU1.5 - Buscar eventos por nombre o tipo
const searchEvents = async (req, res) => {
  try {
    const { nombre_evento, tipo } = req.query;
    let query = `
      SELECT * FROM eventos
      WHERE 1=1
    `;
    const params = [];

    if (nombre_evento) {
      query += ' AND nombre_evento LIKE ?';
      params.push(`%${nombre_evento}%`);
    }

    if (tipo) {
      query += ' AND tipo = ?';
      params.push(tipo);
    }

    query += ' ORDER BY fecha_inicio ASC';

    const events = await executeQuery(query, params);

    res.status(200).json({
      success: true,
      data: { events, total: events.length }
    });

  } catch (error) {
    console.error('Error buscando eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// HU1.6 - Eliminar evento
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery = 'SELECT id, estado, creado_por FROM eventos WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado.'
      });
    }

    const event = existing[0];

    // Solo se pueden eliminar eventos en estado borrador o rechazado
    if (event.estado !== 'borrador' && event.estado !== 'rechazado') {
      return res.status(400).json({ 
        success: false, 
        message: 'Solo se pueden eliminar eventos en estado borrador o rechazado.' 
      });
    }

    // Verificar permisos: solo el creador puede eliminar su propio evento
    if (event.creado_por !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'Solo puedes eliminar tus propios eventos.' });
    }

    // Eliminar archivos PDF del sistema si existen
    // Los archivos se nombran con el patrón: timestamp-random-nombreoriginal.pdf
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    try {
      // Buscar y eliminar archivos que contengan el ID del evento en su nombre
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        files.forEach(file => {
          // Los archivos podrían tener nombres como: 1732397184523-123456789-aval.pdf
          // Eliminamos archivos PDF que puedan estar relacionados con este evento
          if (file.endsWith('.pdf')) {
            const filePath = path.join(uploadsDir, file);
            // Como no tenemos referencia directa, eliminamos todos los PDFs creados en la misma sesión
            // En producción, deberías guardar las rutas en la BD
            // Por ahora, solo registramos que existen archivos
            console.log('Archivo PDF encontrado:', file);
          }
        });
      }
    } catch (err) {
      console.error('Error al verificar archivos PDF:', err);
      // No fallar la eliminación si hay error con archivos
    }

    // Primero eliminar evaluaciones asociadas (por foreign key constraint)
    const deleteEvaluationsQuery = 'DELETE FROM evaluaciones WHERE evento_id = ?';
    await executeQuery(deleteEvaluationsQuery, [id]);

    // Eliminar el evento de la base de datos
    const deleteQuery = 'DELETE FROM eventos WHERE id = ?';
    await executeQuery(deleteQuery, [id]);

    res.status(200).json({
      success: true,
      message: 'Evento eliminado correctamente.'
    });

  } catch (error) {
    console.error('Error eliminando evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// SPRINT 2 - HU1.4 Listado de eventos del organizador
const getMyEvents = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const query = `
      SELECT * FROM eventos
      WHERE creado_por = ?
      ORDER BY fecha_inicio ASC
    `;
    const events = await executeQuery(query, [userId]);
    res.status(200).json({ success: true, data: { events, total: events.length } });
  } catch (error) {
    console.error('Error listando mis eventos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// SPRINT 2 - HU1.5 Envío de evento a validación/aprobación (cambia a pendiente_revision)
const submitEventForApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery = 'SELECT id, estado, creado_por FROM eventos WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado.' });
    }
    // Permitir envío desde borrador o rechazado
    if (existing[0].estado !== 'borrador' && existing[0].estado !== 'rechazado') {
      return res.status(400).json({ success: false, message: 'Solo se puede enviar a validación desde borrador o rechazado.' });
    }
    
    // AUTORIZACIÓN: Solo el creador puede enviar su propio evento a validación
    if (existing[0].creado_por !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'Solo puedes enviar a validación tus propios eventos.' });
    }
    
    // Limpiar justificación al reenviar
    const updateQuery = `UPDATE eventos SET estado = 'enviado', justificacion = NULL WHERE id = ?`;
    await executeQuery(updateQuery, [id]);
    res.status(200).json({ success: true, message: 'Evento enviado a validación.' });
  } catch (error) {
    console.error('Error enviando a validación:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// SPRINT 2 - HU4.1 Visualización de pendientes de evaluación (SECRETARIO)
const listPendingReview = async (req, res) => {
  try {
    const query = `
      SELECT e.*, 
             u.nombre as organizador_nombre, 
             u.apellido as organizador_apellido,
             o.nombre as organizacion_nombre
      FROM eventos e
      LEFT JOIN usuarios u ON e.creado_por = u.id
      LEFT JOIN organizaciones_externas o ON e.organizacion_externa_id = o.id
      WHERE e.estado = 'enviado'
      ORDER BY e.fecha_inicio ASC
    `;
    const events = await executeQuery(query);
    res.status(200).json({ success: true, data: { events, total: events.length } });
  } catch (error) {
    console.error('Error listando pendientes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// SPRINT 2 - Aprobar o rechazar (SECRETARIO) y registrar evaluación
const approveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { justificacion } = req.body;
    const checkQuery = 'SELECT id, estado FROM eventos WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado.' });
    }
    if (existing[0].estado !== 'enviado') {
      return res.status(400).json({ success: false, message: 'El evento no está pendiente de revisión.' });
    }
    await executeQuery('UPDATE eventos SET estado = "aprobado", justificacion = ? WHERE id = ?', [justificacion || null, id]);
    await executeQuery(
      'INSERT INTO evaluaciones (evento_id, evaluado_por, resultado, justificacion) VALUES (?, ?, "APROBADO", ?)',
      [id, req.user.userId, justificacion ?? null]
    );
    res.status(200).json({ success: true, message: 'Evento aprobado.' });
  } catch (error) {
    console.error('Error aprobando evento:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const rejectEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { justificacion } = req.body;
    const checkQuery = 'SELECT id, estado FROM eventos WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado.' });
    }
    if (existing[0].estado !== 'enviado') {
      return res.status(400).json({ success: false, message: 'El evento no está pendiente de revisión.' });
    }
    if (!justificacion || !justificacion.trim()) {
      return res.status(400).json({ success: false, message: 'La justificación es requerida para rechazar un evento.' });
    }
    await executeQuery('UPDATE eventos SET estado = "rechazado", justificacion = ? WHERE id = ?', [justificacion, id]);
    await executeQuery(
      'INSERT INTO evaluaciones (evento_id, evaluado_por, resultado, justificacion) VALUES (?, ?, "RECHAZADO", ?)',
      [id, req.user.userId, justificacion]
    );
    res.status(200).json({ success: true, message: 'Evento rechazado.' });
  } catch (error) {
    console.error('Error rechazando evento:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = {
  createEvent,
  updateEvent,
  getAllEvents,
  getEventById,
  searchEvents,
  deleteEvent,
  getMyEvents,
  submitEventForApproval,
  listPendingReview,
  approveEvent,
  rejectEvent
};
