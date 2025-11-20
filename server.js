require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { getConnection, closeConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/emprendimientos', require('./routes/emprendimientos'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/openai', require('./routes/openai'));

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Chambita - Bienvenido',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      jobs: '/api/jobs',
      companies: '/api/companies',
      employees: '/api/employees',
      emprendimientos: '/api/emprendimientos',
      chat: '/api/chat',
      openai: '/api/openai'
    },
    documentation: 'Ver README.md para más información'
  });
});

// Ruta de health check
app.get('/health', async (req, res) => {
  try {
    await getConnection();
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(503).json({ status: 'Error', database: 'Disconnected', error: error.message });
  }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await getConnection();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║     🚀 API Chambita en funcionamiento        ║
║                                               ║
║     Puerto: ${PORT}                              ║
║     URL: http://localhost:${PORT}                ║
║     Entorno: ${process.env.NODE_ENV || 'development'}               ║
║                                               ║
╚═══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await closeConnection();
  process.exit(0);
});

startServer();
