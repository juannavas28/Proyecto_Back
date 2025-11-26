const mysql = require('mysql2/promise');

async function updateEventoUbicaciones() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sigeu_db'
  });

  try {
    console.log('🔄 Modificando tabla evento_ubicaciones...');
    
    // Agregar columna lugar_evento_id
    try {
      await connection.execute(`
        ALTER TABLE evento_ubicaciones 
        ADD COLUMN lugar_evento_id INT AFTER evento_id,
        ADD FOREIGN KEY (lugar_evento_id) REFERENCES lugares_evento(id)
      `);
      console.log('✅ Columna lugar_evento_id agregada');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  La columna lugar_evento_id ya existe');
      } else {
        throw err;
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

updateEventoUbicaciones()
  .then(() => {
    console.log('🎉 Migración completada');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Error en la migración:', err);
    process.exit(1);
  });
