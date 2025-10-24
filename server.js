const express = require('express'); 
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar conexión a la base de datos
const { testConnection } = require('./db');

// Importar rutas
const authRoutes = require('./routes/auth');
const organizationRoutes = require('./routes/organizations');
const eventRoutes = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());

<<<<<<< HEAD
// Configuración de CORS (ajustado para permitir al frontend en 5173)
=======
// Configuración de CORS
>>>>>>> d03dc4a0b82a6bccaf46cf435ce916f26d85e793
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por ventana de tiempo
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  }
});
app.use(limiter);

// Rate limiting más estricto para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por IP
  message: {
    success: false,
    message: 'Demasiados intentos de login, intenta de nuevo en 15 minutos.'
  }
});

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ruta de salud del servidor
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SIGEU Backend API está funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rutas de la API
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/events', eventRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenido a la API del Sistema de Gestión de Eventos Universitarios (SIGEU)',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      organizations: '/api/organizations',
      events: '/api/events',
      health: '/health'
    }
  });
});

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

// Middleware global de manejo de errores
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido en el cuerpo de la petición'
    });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'El archivo es demasiado grande'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos. Saliendo...');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor SIGEU Backend ejecutándose en puerto ${PORT}`);
      console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📋 Documentación de endpoints:`);
      console.log(`   - GET  /health - Estado del servidor`);
      console.log(`   - POST /api/auth/login - Autenticación`);
      console.log(`   - GET  /api/auth/me - Usuario actual`);
      console.log(`   - GET  /api/organizations - Listar organizaciones`);
      console.log(`   - POST /api/organizations - Crear organización`);
      console.log(`   - GET  /api/events - Listar eventos`);
      console.log(`   - PUT  /api/events/:id - Editar evento`);
      console.log(`   - POST /api/events/:id/submit-validation - Enviar a validación`);
    });

  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Manejo de señales para cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Señal SIGTERM recibida. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Señal SIGINT recibida. Cerrando servidor...');
  process.exit(0);
});

// Iniciar el servidor
startServer();

module.exports = app;

<<<<<<< HEAD

=======
>>>>>>> d03dc4a0b82a6bccaf46cf435ce916f26d85e793
