-- Migración: Cambiar columna facultad de ENUM a VARCHAR para aceptar cualquier texto
-- Fecha: 2025-11-25

USE sigeu_db;

-- Modificar columna facultad para aceptar texto libre
ALTER TABLE usuarios MODIFY COLUMN facultad VARCHAR(100);

-- Verificar el cambio
DESCRIBE usuarios;
