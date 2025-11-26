const mysql = require('mysql2/promise');

async function runMigration() {
  let conn;
  try {
    // Conectar a la base de datos
    conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'sigeu_db'
    });

    console.log('✅ Conectado a la base de datos');

    // Modificar columna facultad
    await conn.execute('ALTER TABLE usuarios MODIFY COLUMN facultad VARCHAR(100)');
    console.log('✅ Columna facultad modificada a VARCHAR(100)');

    // Verificar el cambio
    const [rows] = await conn.execute('DESCRIBE usuarios');
    const facultadColumn = rows.find(row => row.Field === 'facultad');
    console.log('📋 Tipo de columna facultad:', facultadColumn.Type);

    console.log('🎉 Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

runMigration();
