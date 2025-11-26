// Script para verificar estructura de la tabla usuarios
const { pool } = require('./db');

async function checkUsuarios() {
  let connection;
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    connection = await pool.getConnection();
    console.log('✅ Conexión establecida\n');

    console.log('📋 Estructura de tabla usuarios:');
    const usuariosDesc = await connection.query('DESCRIBE usuarios');
    console.table(usuariosDesc[0]);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      connection.release();
      console.log('\n🔌 Conexión cerrada');
    }
    process.exit(0);
  }
}

checkUsuarios();
