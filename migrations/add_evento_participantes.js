const mysql = require('mysql2/promise');

async function addEventoParticipantes() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sigeu_db'
  });

  try {
    console.log('🔄 Creando tabla evento_participantes...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS evento_participantes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        evento_id INT NOT NULL,
        usuario_id INT NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_evento (evento_id),
        INDEX idx_usuario (usuario_id),
        UNIQUE KEY unique_evento_usuario (evento_id, usuario_id)
      )
    `);
    
    console.log('✅ Tabla evento_participantes creada exitosamente');
    
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('⚠️  La tabla evento_participantes ya existe');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  } finally {
    await connection.end();
  }
}

addEventoParticipantes()
  .then(() => {
    console.log('🎉 Migración completada');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Error en la migración:', err);
    process.exit(1);
  });
