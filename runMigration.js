// Script para ejecutar la migración de base de datos
// Ejecutar con: node runMigration.js

const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    connection = await pool.getConnection();
    console.log('✅ Conexión establecida\n');

    // Crear tabla evento_organizaciones
    console.log('1. Creando tabla evento_organizaciones...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS evento_organizaciones (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        evento_id BIGINT NOT NULL,
        organizacion_externa_id BIGINT NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
        FOREIGN KEY (organizacion_externa_id) REFERENCES organizaciones_externas(id) ON DELETE CASCADE,
        UNIQUE KEY unique_evento_org (evento_id, organizacion_externa_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla evento_organizaciones creada\n');

    // Crear tabla evento_ubicaciones
    console.log('2. Creando tabla evento_ubicaciones...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS evento_ubicaciones (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        evento_id BIGINT NOT NULL,
        nombre_lugar VARCHAR(255) NOT NULL,
        direccion TEXT,
        orden INT DEFAULT 0,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla evento_ubicaciones creada\n');

    // Crear índices
    console.log('3. Creando índices...');
    try {
      await connection.query('CREATE INDEX idx_evento_org_evento ON evento_organizaciones(evento_id)');
      console.log('  ✓ Índice idx_evento_org_evento');
    } catch (e) { console.log('  ⚠️  Índice ya existe'); }
    
    try {
      await connection.query('CREATE INDEX idx_evento_org_organizacion ON evento_organizaciones(organizacion_externa_id)');
      console.log('  ✓ Índice idx_evento_org_organizacion');
    } catch (e) { console.log('  ⚠️  Índice ya existe'); }
    
    try {
      await connection.query('CREATE INDEX idx_evento_ubicaciones_evento ON evento_ubicaciones(evento_id)');
      console.log('  ✓ Índice idx_evento_ubicaciones_evento');
    } catch (e) { console.log('  ⚠️  Índice ya existe'); }
    console.log('');

    // Migrar datos existentes - organizaciones
    console.log('4. Migrando organizaciones existentes...');
    const orgResult = await connection.query(`
      INSERT IGNORE INTO evento_organizaciones (evento_id, organizacion_externa_id)
      SELECT id, organizacion_externa_id 
      FROM eventos 
      WHERE organizacion_externa_id IS NOT NULL
    `);
    console.log(`✅ ${orgResult[0].affectedRows} organizaciones migradas\n`);

    // Migrar datos existentes - ubicaciones
    console.log('5. Migrando ubicaciones existentes...');
    const ubResult = await connection.query(`
      INSERT IGNORE INTO evento_ubicaciones (evento_id, nombre_lugar, orden)
      SELECT id, ubicacion, 1 
      FROM eventos 
      WHERE ubicacion IS NOT NULL AND ubicacion != ''
    `);
    console.log(`✅ ${ubResult[0].affectedRows} ubicaciones migradas\n`);

    console.log('✅ Migración completada exitosamente');
    console.log('\nTablas creadas:');
    console.log('  - evento_organizaciones (múltiples organizaciones por evento)');
    console.log('  - evento_ubicaciones (múltiples ubicaciones por evento)');
    console.log('\nÍndices creados para optimizar consultas');
    console.log('Datos existentes migrados a las nuevas tablas\n');

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
      console.log('🔌 Conexión cerrada');
    }
    process.exit(0);
  }
}

// Ejecutar migración
runMigration();
