const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Obtener la ruta de la aplicación
const appPath = process.env.NODE_ENV === 'production' 
  ? path.join(process.resourcesPath, 'config')
  : __dirname;

// Configuración de la base de datos
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost',
  username: 'root',
  password: '',
  database: 'gescon_db',
  logging: false,
  define: {
    timestamps: true
  }
});

// Función para inicializar la base de datos
async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: true });
    console.log('Base de datos sincronizada correctamente.');
    
    return true;
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    return false;
  }
}

module.exports = {
  sequelize,
  initDatabase
}; 