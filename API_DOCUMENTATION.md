# SIGEU Backend API - Documentación

## Descripción
API RESTful para el Sistema de Gestión de Eventos Universitarios (SIGEU). Esta API permite la gestión de usuarios, organizaciones externas y eventos universitarios.

## Base URL
```
http://localhost:3000/api
```

## Autenticación
La API utiliza JWT (JSON Web Tokens) para la autenticación. Incluye el token en el header `Authorization`:
```
Authorization: Bearer <token>
```

---

## Endpoints de Autenticación

### POST /auth/login
**HU3.2** - Autenticación de usuarios

**Request:**
```json
{
  "email": "usuario@universidad.edu",
  "password": "contraseña123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "usuario@universidad.edu",
      "nombre": "Juan",
      "apellido": "Pérez",
      "rol": "organizador"
    }
  }
}
```

### GET /auth/me
Obtener información del usuario actual (requiere autenticación)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@universidad.edu",
      "nombre": "Juan",
      "apellido": "Pérez",
      "rol": "organizador",
      "telefono": "123456789",
      "fecha_registro": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

## Endpoints de Organizaciones Externas

### GET /organizations
**HU2.2** - Listar organizaciones (con paginación)

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10)
- `activo` (opcional): Filtrar por estado activo (default: 1)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "id": 1,
        "nombre": "Empresa ABC",
        "email": "contacto@empresa.com",
        "telefono": "123456789",
        "direccion": "Calle 123, Ciudad",
        "descripcion": "Empresa de tecnología",
        "tipo_organizacion": "Empresa",
        "fecha_registro": "2024-01-15T10:30:00.000Z",
        "activo": 1
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### GET /organizations/search
**HU2.2** - Búsqueda de organizaciones por nombre

**Query Parameters:**
- `nombre` (opcional): Búsqueda parcial por nombre
- `tipo_organizacion` (opcional): Filtrar por tipo
- `activo` (opcional): Filtrar por estado

**Response (200):**
```json
{
  "success": true,
  "data": {
    "organizations": [...],
    "total": 5
  }
}
```

### POST /organizations
**HU2.1** - Crear organización externa (requiere autenticación + rol admin/organizador)

**Request:**
```json
{
  "nombre": "Nueva Empresa",
  "email": "contacto@nuevaempresa.com",
  "telefono": "987654321",
  "direccion": "Avenida Principal 456",
  "descripcion": "Empresa de servicios",
  "tipo_organizacion": "Empresa"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Organización creada exitosamente",
  "data": {
    "organization": {
      "id": 2,
      "nombre": "Nueva Empresa",
      "email": "contacto@nuevaempresa.com",
      "telefono": "987654321",
      "direccion": "Avenida Principal 456",
      "descripcion": "Empresa de servicios",
      "tipo_organizacion": "Empresa",
      "fecha_registro": "2024-01-15T12:00:00.000Z",
      "activo": 1
    }
  }
}
```

### GET /organizations/:id
**HU2.3** - Obtener organización por ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "organization": {
      "id": 1,
      "nombre": "Empresa ABC",
      "email": "contacto@empresa.com",
      "telefono": "123456789",
      "direccion": "Calle 123, Ciudad",
      "descripcion": "Empresa de tecnología",
      "tipo_organizacion": "Empresa",
      "fecha_registro": "2024-01-15T10:30:00.000Z",
      "activo": 1
    }
  }
}
```

### PUT /organizations/:id
**HU2.4** - Actualizar organización externa (requiere autenticación + rol admin/organizador)

**Request:**
```json
{
  "nombre": "Empresa ABC Actualizada",
  "email": "nuevo@empresa.com",
  "telefono": "111222333"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Organización actualizada exitosamente",
  "data": {
    "organization": {
      "id": 1,
      "nombre": "Empresa ABC Actualizada",
      "email": "nuevo@empresa.com",
      "telefono": "111222333",
      "direccion": "Calle 123, Ciudad",
      "descripcion": "Empresa de tecnología",
      "tipo_organizacion": "Empresa",
      "fecha_registro": "2024-01-15T10:30:00.000Z",
      "fecha_actualizacion": "2024-01-15T14:30:00.000Z",
      "activo": 1
    }
  }
}
```

---

## Endpoints de Eventos

### GET /events
Listar eventos (con paginación)

**Query Parameters:**
- `estado` (opcional): Filtrar por estado (borrador, pendiente_revision, aprobado, rechazado)
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "titulo": "Conferencia de Tecnología",
        "descripcion": "Evento sobre las últimas tendencias tecnológicas",
        "fecha_inicio": "2024-02-15T09:00:00.000Z",
        "fecha_fin": "2024-02-15T17:00:00.000Z",
        "ubicacion": "Auditorio Principal",
        "capacidad_maxima": 200,
        "costo_entrada": 0,
        "categoria": "Conferencia",
        "estado": "pendiente_revision",
        "organizador_id": 1,
        "organizador_nombre": "Juan",
        "organizador_apellido": "Pérez",
        "organizacion_externa_id": 1,
        "organizacion_nombre": "Empresa ABC",
        "fecha_creacion": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "pages": 2
    }
  }
}
```

### GET /events/:id
Obtener evento por ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": 1,
      "titulo": "Conferencia de Tecnología",
      "descripcion": "Evento sobre las últimas tendencias tecnológicas",
      "fecha_inicio": "2024-02-15T09:00:00.000Z",
      "fecha_fin": "2024-02-15T17:00:00.000Z",
      "ubicacion": "Auditorio Principal",
      "capacidad_maxima": 200,
      "costo_entrada": 0,
      "categoria": "Conferencia",
      "estado": "pendiente_revision",
      "organizador_id": 1,
      "organizador_nombre": "Juan",
      "organizador_apellido": "Pérez",
      "organizador_email": "juan@universidad.edu",
      "organizacion_externa_id": 1,
      "organizacion_nombre": "Empresa ABC",
      "organizacion_email": "contacto@empresa.com",
      "fecha_creacion": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### PUT /events/:id
**HU1.2** - Editar evento antes de validación (requiere autenticación + rol admin/organizador)

**Request:**
```json
{
  "titulo": "Conferencia de Tecnología Actualizada",
  "descripcion": "Evento actualizado sobre las últimas tendencias tecnológicas",
  "fecha_inicio": "2024-02-20T09:00:00.000Z",
  "fecha_fin": "2024-02-20T17:00:00.000Z",
  "ubicacion": "Nuevo Auditorio",
  "capacidad_maxima": 300,
  "costo_entrada": 50
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Evento actualizado exitosamente",
  "data": {
    "event": {
      "id": 1,
      "titulo": "Conferencia de Tecnología Actualizada",
      "descripcion": "Evento actualizado sobre las últimas tendencias tecnológicas",
      "fecha_inicio": "2024-02-20T09:00:00.000Z",
      "fecha_fin": "2024-02-20T17:00:00.000Z",
      "ubicacion": "Nuevo Auditorio",
      "capacidad_maxima": 300,
      "costo_entrada": 50,
      "categoria": "Conferencia",
      "estado": "borrador",
      "fecha_actualizacion": "2024-01-15T16:00:00.000Z"
    }
  }
}
```

### POST /events/:id/submit-validation
**HU1.5** - Enviar evento a validación/aprobación (requiere autenticación + rol admin/organizador)

**Response (200):**
```json
{
  "success": true,
  "message": "Evento enviado a validación exitosamente",
  "data": {
    "event": {
      "id": 1,
      "titulo": "Conferencia de Tecnología",
      "descripcion": "Evento sobre las últimas tendencias tecnológicas",
      "fecha_inicio": "2024-02-15T09:00:00.000Z",
      "fecha_fin": "2024-02-15T17:00:00.000Z",
      "ubicacion": "Auditorio Principal",
      "capacidad_maxima": 200,
      "costo_entrada": 0,
      "categoria": "Conferencia",
      "estado": "pendiente_revision",
      "fecha_envio_validacion": "2024-01-15T16:30:00.000Z",
      "fecha_actualizacion": "2024-01-15T16:30:00.000Z"
    }
  }
}
```

---

## Códigos de Estado HTTP

- `200` - OK: Solicitud exitosa
- `201` - Created: Recurso creado exitosamente
- `400` - Bad Request: Datos de entrada inválidos
- `401` - Unauthorized: Token de autenticación requerido o inválido
- `403` - Forbidden: Permisos insuficientes
- `404` - Not Found: Recurso no encontrado
- `409` - Conflict: Conflicto con datos existentes
- `413` - Payload Too Large: Archivo demasiado grande
- `429` - Too Many Requests: Límite de solicitudes excedido
- `500` - Internal Server Error: Error interno del servidor

---

## Estructura de Respuestas

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": {
    // Datos específicos del endpoint
  }
}
```

### Respuesta de Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": ["Lista de errores específicos"] // Opcional
}
```

---

## Configuración del Entorno

Crea un archivo `.env` basado en `config.env.example`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=sigeu_database
DB_PORT=3306

# JWT Configuration
JWT_SECRET=tu_clave_secreta_muy_segura
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

## Instalación y Ejecución

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno (crear archivo `.env`)

3. Ejecutar en desarrollo:
```bash
npm run dev
```

4. Ejecutar en producción:
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`
