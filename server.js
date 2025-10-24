const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
console.log("JWT_SECRET:", process.env.JWT_SECRET);


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

// Configuración de CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  }
});
app.use(limiter);

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SIGEU Backend API está funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/events', eventRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenido a la API del SIGEU'
  });
});

// Middleware de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor SIGEU Backend ejecutándose en puerto ${PORT}`);
      console.log(`🌐 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
