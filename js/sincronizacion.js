// js/sincronizacion.js
// Sincronización automática de selectores y módulos

// Si se usa como módulo:
// import databaseManager from './database.js';
// Si no, usar window.databaseManager
const dbManager = window.databaseManager || (typeof databaseManager !== 'undefined' ? databaseManager : null);

// Función para crear un respaldo automático
async function createAutomaticBackup() {
    try {
        await dbManager.createBackup();
        console.log('Respaldo automático creado correctamente');
    } catch (error) {
        console.error('Error al crear respaldo automático:', error);
    }
}

// Función para limpiar respaldos antiguos (más de 90 días)
async function cleanOldBackups() {
    try {
        const backups = await dbManager.db.backups.toArray();
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        for (const backup of backups) {
            if (new Date(backup.timestamp) < ninetyDaysAgo) {
                await dbManager.db.backups.delete(backup.id);
            }
        }
        console.log('Respaldos antiguos limpiados correctamente');
    } catch (error) {
        console.error('Error al limpiar respaldos antiguos:', error);
    }
}

// Configurar respaldos automáticos cada 24 horas
setInterval(async () => {
    await createAutomaticBackup();
    await cleanOldBackups();
}, 24 * 60 * 60 * 1000); // 24 horas en milisegundos

// Ejecutar respaldo inicial al cargar
createAutomaticBackup();

(function() {
    // Aquí irá la lógica de sincronización de selectores de contratos en todos los módulos
    window.initSincronizacion = function() {
        // Inicialización futura
    };
})(); 