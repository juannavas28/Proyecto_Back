// Script para verificar estructura de las tablas
const { pool } = require('./db');

async function checkTables() {
  let connection;
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    connection = await pool.getConnection();
    console.log('✅ Conexión establecida\n');

    console.log('📋 Estructura de tabla eventos:');
    const eventosDesc = await connection.query('DESCRIBE eventos');
    console.table(eventosDesc[0]);

    console.log('\n📋 Estructura de tabla organizaciones_externas:');
    const orgsDesc = await connection.query('DESCRIBE organizaciones_externas');
    console.table(orgsDesc[0]);

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

checkTables();
