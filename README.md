# SIGEU Backend - Sistema de Gestión de Eventos Universitarios

## Descripción
Backend API RESTful para el Sistema de Gestión de Eventos Universitarios (SIGEU). Desarrollado con Node.js, Express y MySQL, proporciona endpoints para la gestión de usuarios, organizaciones externas y eventos universitarios.

## Características Implementadas

### Sprint 1
- ✅ **HU3.1** - Registro de usuarios
- ✅ **HU3.2** - Autenticación de usuarios (login con JWT)
- ✅ **HU3.3** - Edición de perfil de usuario
- ✅ **HU3.4** - Recuperación de credenciales
- ✅ **HU3.5** - Cierre de sesión
- ✅ **HU2.1** - Registro de organización externa
- ✅ **HU2.2** - Búsqueda de organización externa
- ✅ **HU2.3** - Visualización de datos de organización externa
- ✅ **HU2.4** - Edición de organización externa
- ✅ **HU1.1** - Registro de evento

### Sprint 2
- ✅ **HU1.2** - Edición de evento antes de validación
- ✅ **HU1.5** - Envío de evento a validación/aprobación

## Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MySQL** - Base de datos relacional
- **mysql2/promise** - Cliente MySQL con soporte para async/await
- **JWT** - Autenticación basada en tokens
- **bcryptjs** - Encriptación de contraseñas
- **CORS** - Configuración de políticas de origen cruzado
- **Helmet** - Middleware de seguridad
- **express-rate-limit** - Limitación de velocidad de requests

## Estructura del Proyecto

```
IngSoft_backend/
├── controllers/          # Lógica de negocio
│   ├── authController.js
│   ├── organizationController.js
│   └── eventController.js
├── middleware/           # Middlewares personalizados
│   ├── auth.js
│   └── validation.js
├── routes/              # Definición de rutas
│   ├── auth.js
│   ├── organizations.js
│   └── events.js
├── db.js               # Configuración de conexión MySQL
├── server.js           # Configuración principal del servidor
├── package.json        # Dependencias del proyecto
├── config.env.example  # Variables de entorno de ejemplo
├── API_DOCUMENTATION.md # Documentación completa de la API
└── test-examples.md    # Ejemplos de pruebas
```

## Instalación y Configuración

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
```bash
cp config.env.example .env
```

Editar el archivo `.env` con tus credenciales:
```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=sigeu_database
DB_PORT=3306
JWT_SECRET=tu_clave_secreta_muy_segura
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

### 3. Configurar Base de Datos
Asegúrate de que tu base de datos MySQL esté ejecutándose y que las tablas necesarias estén creadas.

### 4. Ejecutar el Servidor

**Desarrollo:**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario
- `GET /api/auth/me` - Información del usuario actual
- `PUT /api/auth/profile` - Editar perfil de usuario
- `POST /api/auth/forgot-password` - Recuperación de contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña
- `POST /api/auth/logout` - Cierre de sesión

### Organizaciones
- `GET /api/organizations` - Listar organizaciones
- `POST /api/organizations` - Crear organización
- `GET /api/organizations/search` - Buscar organizaciones
- `GET /api/organizations/:id` - Obtener organización por ID
- `PUT /api/organizations/:id` - Actualizar organización

### Eventos
- `POST /api/events` - Crear evento
- `GET /api/events` - Listar eventos
- `GET /api/events/:id` - Obtener evento por ID
- `PUT /api/events/:id` - Editar evento
- `POST /api/events/:id/submit-validation` - Enviar a validación

## Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación. Incluye el token en el header:

```
Authorization: Bearer <tu_token>
```

## Documentación

- [Documentación Completa de la API](API_DOCUMENTATION.md)
- [Ejemplos de Pruebas](test-examples.md)

## Características de Seguridad

- ✅ Autenticación JWT
- ✅ Validación de entrada de datos
- ✅ Prepared statements para prevenir SQL injection
- ✅ Rate limiting para prevenir ataques de fuerza bruta
- ✅ CORS configurado
- ✅ Helmet para headers de seguridad
- ✅ Validación de roles y permisos

## Desarrollo

### Scripts Disponibles
- `npm start` - Ejecutar en producción
- `npm run dev` - Ejecutar en desarrollo con nodemon

### Estructura de Respuestas
Todas las respuestas siguen el formato:
```json
{
  "success": true/false,
  "message": "Mensaje descriptivo",
  "data": { /* datos específicos */ }
}
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Contacto

Para preguntas o soporte, contacta al equipo de desarrollo de SIGEU.
