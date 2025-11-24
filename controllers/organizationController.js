const path = require('path');
const fs = require('fs');
const { executeQuery } = require('../db');

// HU2.1 - Registro de organización externa (según esquema)
const createOrganization = async (req, res) => {
  try {
    const { nombre, nit, representante_legal, telefono, email, ubicacion, actividad_principal, tipo_organizacion = 'OTRA' } = req.body;

    // Verificar si ya existe una organización con el mismo nombre
    const checkQuery = 'SELECT id FROM organizaciones_externas WHERE nombre = ? OR nit = ?';
    const existing = await executeQuery(checkQuery, [nombre, nit || null]);

    if (existing.length > 0) {
      // Si ya existe, borrar el archivo recién subido para no dejar basura
      return res.status(409).json({
        success: false,
        message: 'Ya existe una organización con ese nombre o NIT'
      });
    }

    // Insertar nueva organización con posible archivo
    const insertQuery = `
      INSERT INTO organizaciones_externas 
      (nombre, nit, representante_legal, telefono, email, ubicacion, actividad_principal, tipo_organizacion, fecha_registro, activo, creado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1, ?)
    `;

    const result = await executeQuery(insertQuery, [
      nombre,
      nit,
      representante_legal,
      telefono,
      email,
      ubicacion || null,
      actividad_principal || null,
      tipo_organizacion,
      req.user?.id || null
    ]);

    // Obtener la organización creada
    const newOrgQuery = 'SELECT * FROM organizaciones_externas WHERE id = ?';
    const newOrg = await executeQuery(newOrgQuery, [result.insertId]);

    // Si se subió un archivo, devolver su URL (no lo guardamos en BD para mantener compatibilidad)
    let fileUrl = null;
    if (req.file) {
      const host = req.protocol + '://' + req.get('host');
      fileUrl = host + '/uploads/' + req.file.filename;
    }

    const responseData = { organization: newOrg[0] };
    if (fileUrl) responseData.file = { certificado_pdf: fileUrl };

    res.status(201).json({
      success: true,
      message: 'Organización creada exitosamente',
      data: responseData
    });

  } catch (error) {
    console.error('Error creando organización:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// HU2.2 - Búsqueda de organización externa (filtros por nombre, NIT, tipo)
const searchOrganizations = async (req, res) => {
  try {
    const { nombre, nit, tipo_organizacion, activo = '1' } = req.query;
    let query = 'SELECT * FROM organizaciones_externas WHERE 1=1';
    const params = [];

    // Filtro por nombre (búsqueda parcial)
    if (nombre) {
      query += ' AND nombre LIKE ?';
      params.push(`%${nombre}%`);
    }

    if (nit) {
      query += ' AND nit = ?';
      params.push(nit);
    }

    // Filtro por tipo de organización
    if (tipo_organizacion) {
      query += ' AND tipo_organizacion = ?';
      params.push(tipo_organizacion);
    }

    // Filtro por estado activo
    if (activo !== undefined) {
      query += ' AND activo = ?';
      params.push(activo === '1' ? 1 : 0);
    }

    query += ' ORDER BY nombre ASC';

    const organizations = await executeQuery(query, params);

    res.status(200).json({
      success: true,
      data: {
        organizations,
        total: organizations.length
      }
    });

  } catch (error) {
    console.error('Error buscando organizaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// HU2.3 - Visualización de datos de organización externa (SELECT por id)
const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'SELECT * FROM organizaciones_externas WHERE id = ?';
    const organizations = await executeQuery(query, [id]);

    if (organizations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        organization: organizations[0]
      }
    });

  } catch (error) {
    console.error('Error obteniendo organización:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// HU2.4 - Edición de organización externa
const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, nit, representante_legal, telefono, email, ubicacion, actividad_principal, tipo_organizacion, activo } = req.body;

    // Verificar que la organización existe
    const checkQuery = 'SELECT * FROM organizaciones_externas WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada'
      });
    }

    // Verificar permisos: el creador o el secretario pueden editar
    const isCreator = existing[0].creado_por === req.user.id;
    const isSecretario = req.user.rol?.toUpperCase() === 'SECRETARIO';
    
    if (!isCreator && !isSecretario) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar esta organización.'
      });
    }

    // Construir query de actualización dinámicamente
    const updateFields = [];
    const updateParams = [];

    if (nombre !== undefined) {
      updateFields.push('nombre = ?');
      updateParams.push(nombre);
    }
    if (nit !== undefined) { updateFields.push('nit = ?'); updateParams.push(nit); }
    if (representante_legal !== undefined) { updateFields.push('representante_legal = ?'); updateParams.push(representante_legal); }
    if (telefono !== undefined) {
      updateFields.push('telefono = ?');
      updateParams.push(telefono);
    }
    if (email !== undefined) { updateFields.push('email = ?'); updateParams.push(email); }
    if (ubicacion !== undefined) { updateFields.push('ubicacion = ?'); updateParams.push(ubicacion); }
    if (actividad_principal !== undefined) { updateFields.push('actividad_principal = ?'); updateParams.push(actividad_principal); }
    if (tipo_organizacion !== undefined) {
      updateFields.push('tipo_organizacion = ?');
      updateParams.push(tipo_organizacion);
    }
    if (activo !== undefined) {
      updateFields.push('activo = ?');
      updateParams.push(activo ? 1 : 0);
    }

    updateFields.push('fecha_actualizacion = NOW()');
    updateParams.push(id);

    const updateQuery = `
      UPDATE organizaciones_externas 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;

    await executeQuery(updateQuery, updateParams);

    // Obtener la organización actualizada
    const updatedOrgQuery = 'SELECT * FROM organizaciones_externas WHERE id = ?';
    const updatedOrg = await executeQuery(updatedOrgQuery, [id]);

    res.status(200).json({
      success: true,
      message: 'Organización actualizada exitosamente',
      data: {
        organization: updatedOrg[0]
      }
    });

  } catch (error) {
    console.error('Error actualizando organización:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// HU2.5 - Eliminación de organización externa (soft delete)
const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la organización exista
    const checkQuery = 'SELECT id, activo, creado_por FROM organizaciones_externas WHERE id = ?';
    const organization = await executeQuery(checkQuery, [id]);

    if (organization.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'La organización externa no existe.'
      });
    }

    // Verificar si la organización está vinculada a algún evento
    const checkEventsQuery = 'SELECT COUNT(*) as count FROM eventos WHERE organizacion_externa_id = ?';
    const eventsResult = await executeQuery(checkEventsQuery, [id]);
    
    console.log('🗑️ DELETE Organization:', {
      orgId: id,
      creador_bd: organization[0].creado_por,
      usuario_id: req.user.id,
      usuario_rol: req.user.rol,
      eventos_vinculados: eventsResult[0].count,
      es_creador: organization[0].creado_por === req.user.id
    });
    
    // REGLA: No se puede eliminar si está conectada a eventos
    if (eventsResult[0].count > 0) {
      console.log('❌ Eliminación bloqueada: organización tiene eventos vinculados');
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la organización porque está conectada a uno o más eventos.'
      });
    }

    // Verificar permisos: el creador o el secretario pueden eliminar
    const isCreator = organization[0].creado_por === req.user.id;
    const isSecretario = req.user.rol?.toUpperCase() === 'SECRETARIO';
    
    if (!isCreator && !isSecretario) {
      console.log('❌ Eliminación bloqueada: usuario no es el creador ni secretario');
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta organización.'
      });
    }

    // Eliminar COMPLETAMENTE la organización de la base de datos (hard delete)
    const deleteQuery = 'DELETE FROM organizaciones_externas WHERE id = ?';
    await executeQuery(deleteQuery, [id]);

    console.log(`✅ Organización ${id} eliminada PERMANENTEMENTE por usuario ${req.user.id}`);

    // Confirmar la eliminación
    res.status(200).json({
      success: true,
      message: 'Organización eliminada exitosamente.',
      data: {
        id,
        estado: 'eliminada'
      }
    });

  } catch (error) {
    console.error('Error eliminando organización externa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Obtener todas las organizaciones (opcional)
const getAllOrganizations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Obtener total de organizaciones activas
    const countQuery = "SELECT COUNT(*) as total FROM organizaciones_externas WHERE activo = 1";
    const countResult = await executeQuery(countQuery);
    const total = countResult[0].total;

    // Obtener organizaciones con paginación
    const query = `
      SELECT * FROM organizaciones_externas 
      WHERE activo = 1 
      ORDER BY fecha_registro DESC, nombre ASC 
      LIMIT ${limit} OFFSET ${offset}
    `;
    const organizations = await executeQuery(query);

    res.status(200).json({
      success: true,
      data: { 
        organizations, 
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      },
    });
  } catch (error) {
    console.error("Error obteniendo organizaciones:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


module.exports = {
  createOrganization,
  searchOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getAllOrganizations
};
