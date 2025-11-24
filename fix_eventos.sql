-- Actualizar el enum de estado para que coincida con el frontend
ALTER TABLE eventos MODIFY COLUMN estado ENUM('borrador','enviado','aprobado','rechazado') DEFAULT 'borrador';
