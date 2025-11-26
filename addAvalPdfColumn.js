// Script para agregar columna aval_pdf a la tabla usuarios
const { pool } = require('./db');

async function addAvalPdfColumn() {
  let connection;
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    connection = await pool.getConnection();
    console.log('✅ Conexión establecida\n');

    console.log('1. Agregando columna aval_pdf a usuarios...');
    await connection.query(`
      ALTER TABLE usuarios 
      ADD COLUMN aval_pdf VARCHAR(255) 
      AFTER facultad
    `);
    console.log('✅ Columna aval_pdf agregada\n');

    console.log('📋 Nueva estructura de tabla usuarios:');
    const usuariosDesc = await connection.query('DESCRIBE usuarios');
    console.table(usuariosDesc[0]);

    console.log('\n✅ Migración completada exitosamente');
    console.log('Columna agregada: aval_pdf (VARCHAR 255) para docentes y secretarios');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  La columna aval_pdf ya existe');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    if (connection) {
      connection.release();
      console.log('\n🔌 Conexión cerrada');
    }
    process.exit(0);
  }
}

addAvalPdfColumn();
