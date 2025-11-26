const mysql = require('mysql2/promise');

async function addLugaresEventos() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sigeu_db'
  });

  try {
    console.log('🔄 Creando tabla lugares_evento...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS lugares_evento (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(255) NOT NULL,
        capacidad INT NOT NULL,
        activo TINYINT(1) DEFAULT 1,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_nombre (nombre)
      )
    `);
    
    console.log('✅ Tabla lugares_evento creada exitosamente');
    
    // Insertar lugares predefinidos
    console.log('🔄 Insertando lugares predefinidos...');
    
    const lugares = [
      ['Auditorio Xepia', 200],
      ['Auditorio Yquinde', 400],
      ['Salón de Informática', 60],
      ['Canchas de la UAO', 500]
    ];
    
    for (const [nombre, capacidad] of lugares) {
      try {
        await connection.execute(
          'INSERT INTO lugares_evento (nombre, capacidad) VALUES (?, ?)',
          [nombre, capacidad]
        );
        console.log(`  ✓ ${nombre} - ${capacidad} personas`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠️  ${nombre} ya existe`);
        } else {
          throw err;
        }
      }
    }
    
    console.log('✅ Lugares predefinidos insertados');
    
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('⚠️  La tabla lugares_evento ya existe');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  } finally {
    await connection.end();
  }
}

addLugaresEventos()
  .then(() => {
    console.log('🎉 Migración completada');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Error en la migración:', err);
    process.exit(1);
  });
