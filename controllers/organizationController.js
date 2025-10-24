const { executeQuery } = require('../db');

// HU2.1 - Registro de organización externa (INSERT)
const createOrganization = async (req, res) => {
  try {
    const { nombre, email, telefono, direccion, descripcion, tipo_organizacion } = req.body;

    // Verificar si ya existe una organización con el mismo nombre
    const checkQuery = 'SELECT id FROM organizaciones_externas WHERE nombre = ?';
    const existing = await executeQuery(checkQuery, [nombre]);

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una organización con ese nombre'
      });
    }

    // Insertar nueva organización
    const insertQuery = `
      INSERT INTO organizaciones_externas 
      (nombre, email, telefono, direccion, descripcion, tipo_organizacion, fecha_registro, activo)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)
    `;

    const result = await executeQuery(insertQuery, [
      nombre,
      email || null,
      telefono || null,
      direccion || null,
      descripcion || null,
      tipo_organizacion || 'General'
    ]);

    // Obtener la organización creada
    const newOrgQuery = 'SELECT * FROM organizaciones_externas WHERE id = ?';
    const newOrg = await executeQuery(newOrgQuery, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Organización creada exitosamente',
      data: {
        organization: newOrg[0]
      }
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

// HU2.2 - Búsqueda de organización externa (SELECT con filtro por nombre)
const searchOrganizations = async (req, res) => {
  try {
    const { nombre, tipo_organizacion, activo = '1' } = req.query;
    let query = 'SELECT * FROM organizaciones_externas WHERE 1=1';
    const params = [];

    // Filtro por nombre (búsqueda parcial)
    if (nombre) {
      query += ' AND nombre LIKE ?';
      params.push(`%${nombre}%`);
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

// HU2.4 - Edición de organización externa (UPDATE)
const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, direccion, descripcion, tipo_organizacion, activo } = req.body;

    // Verificar que la organización existe
    const checkQuery = 'SELECT id FROM organizaciones_externas WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada'
      });
    }

    // Verificar si el nuevo nombre ya existe (si se está cambiando)
    if (nombre) {
      const nameCheckQuery = 'SELECT id FROM organizaciones_externas WHERE nombre = ? AND id != ?';
      const nameExists = await executeQuery(nameCheckQuery, [nombre, id]);

      if (nameExists.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una organización con ese nombre'
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
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateParams.push(email);
    }
    if (telefono !== undefined) {
      updateFields.push('telefono = ?');
      updateParams.push(telefono);
    }
    if (direccion !== undefined) {
      updateFields.push('direccion = ?');
      updateParams.push(direccion);
    }
    if (descripcion !== undefined) {
      updateFields.push('descripcion = ?');
      updateParams.push(descripcion);
    }
    if (tipo_organizacion !== undefined) {
      updateFields.push('tipo_organizacion = ?');
      updateParams.push(tipo_organizacion);
    }
    if (activo !== undefined) {
      updateFields.push('activo = ?');
      updateParams.push(activo ? 1 : 0);
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

// Función adicional: Obtener todas las organizaciones (para listado completo)
const getAllOrganizations = async (req, res) => {
  try {
    const { page = 1, limit = 10, activo = '1' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM organizaciones_externas WHERE 1=1';
    const params = [];

    if (activo !== undefined) {
      query += ' AND activo = ?';
      params.push(activo === '1' ? 1 : 0);
    }

    // Contar total de registros
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await executeQuery(countQuery, params);
    const total = countResult[0].total;

    // Obtener registros paginados
    query += ' ORDER BY nombre ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const organizations = await executeQuery(query, params);

    res.status(200).json({
      success: true,
      data: {
        organizations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo organizaciones:', error);
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
    const checkQuery = 'SELECT id, activo FROM organizaciones_externas WHERE id = ?';
    const organization = await executeQuery(checkQuery, [id]);

    if (organization.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'La organización externa no existe.'
      });
    }

    // Validar que la organización no esté ya inactiva
    if (organization[0].activo === 0) {
      return res.status(400).json({
        success: false,
        message: 'La organización ya está eliminada o inactiva.'
      });
    }

    // Desactivar la organización (eliminación lógica)
    const updateQuery = `
      UPDATE organizaciones_externas 
      SET activo = 0, fecha_actualizacion = NOW() 
      WHERE id = ?
    `;
    await executeQuery(updateQuery, [id]);

    // Confirmar la eliminación
    res.status(200).json({
      success: true,
      message: 'Organización externa eliminada exitosamente.',
      data: {
        id,
        estado: 'inactiva'
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


module.exports = {
  createOrganization,
  searchOrganizations,
  getOrganizationById,
  updateOrganization,
  getAllOrganizations,
  deleteOrganization
};

