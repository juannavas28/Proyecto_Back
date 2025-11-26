const mysql = require('mysql2/promise');

async function removeCampoNombreLugar() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sigeu_db'
  });

  try {
    console.log('🔧 Verificando si existe el campo nombre_lugar en evento_ubicaciones...');
    
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'sigeu_db' 
      AND TABLE_NAME = 'evento_ubicaciones' 
      AND COLUMN_NAME = 'nombre_lugar'
    `);

    if (columns.length > 0) {
      console.log('📝 Eliminando campo nombre_lugar de evento_ubicaciones...');
      await connection.execute(`
        ALTER TABLE evento_ubicaciones 
        DROP COLUMN nombre_lugar
      `);
      console.log('✅ Campo nombre_lugar eliminado correctamente');
    } else {
      console.log('ℹ️ El campo nombre_lugar no existe, no es necesario eliminarlo');
    }

    // Verificar que lugar_evento_id existe
    const [fkColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'sigeu_db' 
      AND TABLE_NAME = 'evento_ubicaciones' 
      AND COLUMN_NAME = 'lugar_evento_id'
    `);

    if (fkColumns.length === 0) {
      console.log('⚠️ El campo lugar_evento_id no existe. Se debe ejecutar la migración update_evento_ubicaciones.js primero');
    } else {
      console.log('✅ El campo lugar_evento_id existe correctamente');
    }

    console.log('\n📋 Estructura actual de evento_ubicaciones:');
    const [structure] = await connection.execute('DESCRIBE evento_ubicaciones');
    console.table(structure);

  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  removeCampoNombreLugar()
    .then(() => {
      console.log('✅ Migración completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando migración:', error);
      process.exit(1);
    });
}

module.exports = removeCampoNombreLugar;
