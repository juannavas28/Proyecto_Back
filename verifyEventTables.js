const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyTables() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('📋 Verificando tablas relacionadas con eventos:\n');

    // Verificar tabla evento_organizaciones
    console.log('1. Tabla evento_organizaciones:');
    const [orgCols] = await connection.execute('DESCRIBE evento_organizaciones');
    orgCols.forEach(col => {
      console.log(`   - ${col.Field.padEnd(30)} ${col.Type.padEnd(20)} ${col.Key}`);
    });

    // Verificar tabla evento_ubicaciones
    console.log('\n2. Tabla evento_ubicaciones:');
    const [ubicCols] = await connection.execute('DESCRIBE evento_ubicaciones');
    ubicCols.forEach(col => {
      console.log(`   - ${col.Field.padEnd(30)} ${col.Type.padEnd(20)} ${col.Key}`);
    });

    // Verificar si hay datos de prueba
    const [orgCount] = await connection.execute('SELECT COUNT(*) as total FROM evento_organizaciones');
    const [ubicCount] = await connection.execute('SELECT COUNT(*) as total FROM evento_ubicaciones');

    console.log('\n📊 Registros actuales:');
    console.log(`   - evento_organizaciones: ${orgCount[0].total} registros`);
    console.log(`   - evento_ubicaciones: ${ubicCount[0].total} registros`);

    console.log('\n✅ Verificación completa');
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyTables();
