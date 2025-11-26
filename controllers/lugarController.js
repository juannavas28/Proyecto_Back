const { executeQuery } = require('../db');

// Obtener todos los lugares disponibles
const getLugares = async (req, res) => {
  try {
    const query = 'SELECT id, nombre, capacidad FROM lugares_evento WHERE activo = 1 ORDER BY nombre';
    const lugares = await executeQuery(query);
    
    res.status(200).json({
      success: true,
      data: lugares
    });
  } catch (error) {
    console.error('Error obteniendo lugares:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getLugares
};
