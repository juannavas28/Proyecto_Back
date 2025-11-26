// Script para agregar columna facultad a la tabla usuarios
const { pool } = require('./db');

async function addFacultadColumn() {
  let connection;
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    connection = await pool.getConnection();
    console.log('✅ Conexión establecida\n');

    console.log('1. Agregando columna facultad a usuarios...');
    await connection.query(`
      ALTER TABLE usuarios 
      ADD COLUMN facultad ENUM('INGENIERIA', 'ARTES', 'COMUNICACION', 'DISEÑO', 'NEGOCIOS_INTERNACIONALES') 
      AFTER rol
    `);
    console.log('✅ Columna facultad agregada\n');

    console.log('📋 Nueva estructura de tabla usuarios:');
    const usuariosDesc = await connection.query('DESCRIBE usuarios');
    console.table(usuariosDesc[0]);

    console.log('\n✅ Migración completada exitosamente');
    console.log('Columna agregada: facultad (ENUM con 5 opciones)');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  La columna facultad ya existe');
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

addFacultadColumn();
