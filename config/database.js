const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true, // Para Azure SQL
    trustServerCertificate: true, // Para desarrollo local
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

const getConnection = async () => {
  try {
    if (pool) {
      return pool;
    }
    pool = await sql.connect(config);
    console.log('✅ Conectado a SQL Server exitosamente');
    return pool;
  } catch (error) {
    console.error('❌ Error al conectar con SQL Server:', error);
    throw error;
  }
};

const closeConnection = async () => {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('🔒 Conexión cerrada');
    }
  } catch (error) {
    console.error('❌ Error al cerrar conexión:', error);
  }
};

module.exports = {
  sql,
  getConnection,
  closeConnection
};
