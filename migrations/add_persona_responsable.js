const mysql = require('mysql2/promise');

async function addPersonaResponsable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sigeu_db'
  });

  try {
    console.log('🔄 Agregando columna persona_responsable a organizaciones_externas...');
    
    await connection.execute(`
      ALTER TABLE organizaciones_externas 
      ADD COLUMN persona_responsable VARCHAR(255) AFTER representante_legal
    `);
    
    console.log('✅ Columna persona_responsable agregada exitosamente');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  La columna persona_responsable ya existe');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  } finally {
    await connection.end();
  }
}

addPersonaResponsable()
  .then(() => {
    console.log('🎉 Migración completada');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Error en la migración:', err);
    process.exit(1);
  });
