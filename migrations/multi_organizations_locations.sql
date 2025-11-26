-- Migración: Soporte para múltiples organizaciones y ubicaciones por evento
-- Fecha: 2024

-- Tabla puente para múltiples organizaciones por evento
CREATE TABLE IF NOT EXISTS evento_organizaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  evento_id BIGINT NOT NULL,
  organizacion_externa_id BIGINT NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
  FOREIGN KEY (organizacion_externa_id) REFERENCES organizaciones_externas(id) ON DELETE CASCADE,
  UNIQUE KEY unique_evento_org (evento_id, organizacion_externa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para múltiples ubicaciones por evento
CREATE TABLE IF NOT EXISTS evento_ubicaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  evento_id BIGINT NOT NULL,
  nombre_lugar VARCHAR(255) NOT NULL,
  direccion TEXT,
  orden INT DEFAULT 0,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para mejorar el rendimiento
CREATE INDEX idx_evento_org_evento ON evento_organizaciones(evento_id);
CREATE INDEX idx_evento_org_organizacion ON evento_organizaciones(organizacion_externa_id);
CREATE INDEX idx_evento_ubicaciones_evento ON evento_ubicaciones(evento_id);

-- Migrar datos existentes de eventos
-- Si un evento tiene organizacion_externa_id, migrarla a la nueva tabla
INSERT INTO evento_organizaciones (evento_id, organizacion_externa_id)
SELECT id, organizacion_externa_id 
FROM eventos 
WHERE organizacion_externa_id IS NOT NULL;

-- Si un evento tiene ubicacion, migrarla a la nueva tabla
INSERT INTO evento_ubicaciones (evento_id, nombre_lugar, orden)
SELECT id, ubicacion, 1 
FROM eventos 
WHERE ubicacion IS NOT NULL AND ubicacion != '';

-- NOTA: Los campos organizacion_externa_id y ubicacion en la tabla eventos
-- se mantienen por compatibilidad y retrocompatibilidad.
-- Pueden ser deprecados en el futuro si es necesario.
