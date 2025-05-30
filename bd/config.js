const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Cambiar por la contraseña de tu MySQL
    database: 'sigescon',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Conexión a MySQL establecida correctamente');
        connection.release();
        return true;
    } catch (error) {
        console.error('Error al conectar con MySQL:', error);
        return false;
    }
}

// Función para ejecutar consultas
async function query(sql, params) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Error al ejecutar consulta:', error);
        throw error;
    }
}

module.exports = {
    pool,
    query,
    testConnection
}; 