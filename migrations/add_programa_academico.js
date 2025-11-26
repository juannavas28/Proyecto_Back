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

    // Agregar columna programa_academico
    await conn.execute('ALTER TABLE usuarios ADD COLUMN programa_academico VARCHAR(100) AFTER facultad');
    console.log('✅ Columna programa_academico agregada a la tabla usuarios');

    // Verificar el cambio
    const [rows] = await conn.execute('DESCRIBE usuarios');
    const programaColumn = rows.find(row => row.Field === 'programa_academico');
    console.log('📋 Columna programa_academico:', programaColumn ? programaColumn.Type : 'No encontrada');

    console.log('🎉 Migración completada exitosamente');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️ La columna programa_academico ya existe');
    } else {
      console.error('❌ Error en la migración:', error.message);
      process.exit(1);
    }
  } finally {
    if (conn) await conn.end();
  }
}

runMigration();
