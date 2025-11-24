const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
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
app.use(helmet({
  contentSecurityPolicy: false, // Permite recursos estáticos sin restricciones
  crossOriginEmbedderPolicy: false
}));

// Configuración de CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
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

// Middleware para parsing de JSON y formularios
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Servir archivos PDF y otros uploads de forma pública
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas principales de API
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/events', eventRoutes);

// ✅ Ruta de salud (verificación del servidor)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Servir archivos estáticos del frontend (si existe carpeta build/dist)
// IMPORTANTE: Esto va DESPUÉS de las rutas de API para que no interfieran
const publicPath = path.join(__dirname, 'dist'); // o 'build' según tu frontend
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  console.log(`📦 Sirviendo archivos estáticos desde: ${publicPath}`);
}

// Ruta raíz - Si hay frontend construido, servirlo, sino mostrar mensaje de API
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({
      success: true,
      message: 'Bienvenido a la API del SIGEU',
      frontend: 'Frontend no construido. Ejecuta el build del frontend para servir archivos estáticos.'
    });
  }
});

// Middleware de rutas no encontradas (debe ir al final)
// Si hay frontend construido, servir index.html para SPAs, sino mostrar error 404 JSON
app.use('*', (req, res) => {
  // Si es una ruta de API, retornar JSON 404
  if (req.originalUrl.startsWith('/api')) {
    res.status(404).json({
      success: false,
      message: 'Endpoint no encontrado',
      path: req.originalUrl
    });
  } else {
    // Para rutas del frontend (SPA), servir index.html si existe
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({
        success: false,
        message: 'Ruta no encontrada. Frontend no disponible.',
        path: req.originalUrl
      });
    }
  }
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
      console.log(`📁 Carpeta pública de uploads: http://localhost:${PORT}/uploads`);
    });
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
