# Ejemplos de Pruebas para la API SIGEU

## Configuración Inicial

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar archivo .env:**
```bash
cp config.env.example .env
# Editar .env con tus credenciales de MySQL
```

3. **Iniciar el servidor:**
```bash
npm run dev
```

---

## Ejemplos de Requests con cURL

### 1. Autenticación (HU3.2)

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@universidad.edu",
    "password": "admin123"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@universidad.edu",
      "nombre": "Admin",
      "apellido": "Sistema",
      "rol": "admin"
    }
  }
}
```

**Verificar usuario actual:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### 2. Organizaciones Externas

**Crear organización (HU2.1):**
```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "nombre": "Empresa Tecnológica XYZ",
    "email": "contacto@empresaxyz.com",
    "telefono": "555-0123",
    "direccion": "Av. Tecnología 123, Ciudad",
    "descripcion": "Empresa especializada en desarrollo de software",
    "tipo_organizacion": "Empresa"
  }'
```

**Buscar organizaciones (HU2.2):**
```bash
curl -X GET "http://localhost:3000/api/organizations/search?nombre=tecnológica" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Obtener organización por ID (HU2.3):**
```bash
curl -X GET http://localhost:3000/api/organizations/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Actualizar organización (HU2.4):**
```bash
curl -X PUT http://localhost:3000/api/organizations/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "nombre": "Empresa Tecnológica XYZ Actualizada",
    "telefono": "555-9999",
    "descripcion": "Empresa líder en desarrollo de software y consultoría"
  }'
```

### 3. Eventos

**Obtener eventos:**
```bash
curl -X GET "http://localhost:3000/api/events?estado=borrador" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Obtener evento por ID:**
```bash
curl -X GET http://localhost:3000/api/events/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Editar evento (HU1.2):**
```bash
curl -X PUT http://localhost:3000/api/events/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "titulo": "Conferencia de Inteligencia Artificial",
    "descripcion": "Evento sobre las últimas tendencias en IA y machine learning",
    "fecha_inicio": "2024-03-15T09:00:00.000Z",
    "fecha_fin": "2024-03-15T17:00:00.000Z",
    "ubicacion": "Auditorio Central",
    "capacidad_maxima": 250,
    "costo_entrada": 0,
    "categoria": "Conferencia"
  }'
```

**Enviar evento a validación (HU1.5):**
```bash
curl -X POST http://localhost:3000/api/events/1/submit-validation \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## Ejemplos con Postman

### Colección de Postman

Puedes importar esta colección en Postman:

```json
{
  "info": {
    "name": "SIGEU API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@universidad.edu\",\n  \"password\": \"admin123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/auth/login",
              "host": ["{{base_url}}"],
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    }
  ]
}
```

---

## Datos de Prueba para MySQL

### Insertar usuario de prueba:

```sql
INSERT INTO usuarios (email, password, nombre, apellido, rol, activo, fecha_registro) 
VALUES (
  'admin@universidad.edu', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: admin123
  'Admin', 
  'Sistema', 
  'admin', 
  1, 
  NOW()
);
```

### Insertar organización de prueba:

```sql
INSERT INTO organizaciones_externas (nombre, email, telefono, direccion, descripcion, tipo_organizacion, fecha_registro, activo) 
VALUES (
  'Empresa Demo', 
  'demo@empresa.com', 
  '555-0000', 
  'Calle Demo 123', 
  'Empresa de demostración', 
  'Empresa', 
  NOW(), 
  1
);
```

### Insertar evento de prueba:

```sql
INSERT INTO eventos (titulo, descripcion, fecha_inicio, fecha_fin, ubicacion, capacidad_maxima, costo_entrada, categoria, estado, organizador_id, organizacion_externa_id, fecha_creacion) 
VALUES (
  'Evento de Prueba', 
  'Este es un evento de prueba para testing', 
  '2024-03-01 10:00:00', 
  '2024-03-01 18:00:00', 
  'Auditorio Principal', 
  100, 
  0, 
  'Conferencia', 
  'borrador', 
  1, 
  1, 
  NOW()
);
```

---

## Verificación de Funcionalidad

### Checklist de Pruebas:

- [ ] ✅ Servidor inicia correctamente
- [ ] ✅ Conexión a MySQL establecida
- [ ] ✅ Login de usuario funciona
- [ ] ✅ Token JWT se genera correctamente
- [ ] ✅ Middleware de autenticación funciona
- [ ] ✅ Crear organización funciona
- [ ] ✅ Buscar organizaciones funciona
- [ ] ✅ Obtener organización por ID funciona
- [ ] ✅ Actualizar organización funciona
- [ ] ✅ Obtener eventos funciona
- [ ] ✅ Editar evento funciona
- [ ] ✅ Enviar evento a validación funciona
- [ ] ✅ Validaciones de entrada funcionan
- [ ] ✅ Manejo de errores funciona
- [ ] ✅ CORS configurado correctamente

### Comandos de Verificación:

```bash
# Verificar que el servidor responde
curl http://localhost:3000/health

# Verificar que la API raíz responde
curl http://localhost:3000/

# Verificar que las rutas protegidas requieren autenticación
curl http://localhost:3000/api/organizations
# Debería devolver 401 Unauthorized
```
