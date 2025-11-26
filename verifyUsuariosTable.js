const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('📋 Estructura de la tabla usuarios:\n');
    const [columns] = await connection.execute('DESCRIBE usuarios');
    columns.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.Field.padEnd(20)} - ${col.Type.padEnd(20)} - Null: ${col.Null}`);
    });

    console.log('\n✅ Verificación completa');
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyTable();
