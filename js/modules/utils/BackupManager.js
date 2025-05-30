/**
 * BackupManager - Módulo para gestión de respaldos
 */
import { ErrorHandler } from './ErrorHandler.js';

export class BackupManager {
    static async createBackup() {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                data: {}
            };

            // Obtener datos de IndexedDB
            const db = await this.getDatabaseData();
            backup.data = db;

            // Convertir a JSON
            const backupString = JSON.stringify(backup, null, 2);

            // Crear archivo de respaldo
            const blob = new Blob([backupString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Descargar archivo
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return {
                success: true,
                message: 'Respaldo creado exitosamente',
                timestamp: backup.timestamp
            };
        } catch (error) {
            return ErrorHandler.handleError(error, ErrorHandler.errorTypes.DATABASE);
        }
    }

    static async restoreBackup(file) {
        try {
            // Validar archivo
            if (!file || file.type !== 'application/json') {
                throw new Error('Archivo de respaldo inválido');
            }

            // Leer archivo
            const backup = await this.readBackupFile(file);

            // Validar estructura
            if (!this.validateBackupStructure(backup)) {
                throw new Error('Estructura de respaldo inválida');
            }

            // Restaurar datos
            await this.restoreDatabaseData(backup.data);

            return {
                success: true,
                message: 'Respaldo restaurado exitosamente',
                timestamp: backup.timestamp
            };
        } catch (error) {
            return ErrorHandler.handleError(error, ErrorHandler.errorTypes.DATABASE);
        }
    }

    static async getDatabaseData() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SIGESCON_DB');
            
            request.onerror = () => reject(new Error('Error al acceder a la base de datos'));
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['contracts', 'partidas', 'hes', 'users'], 'readonly');
                const data = {};

                Promise.all([
                    this.getAllRecords(transaction.objectStore('contracts')),
                    this.getAllRecords(transaction.objectStore('partidas')),
                    this.getAllRecords(transaction.objectStore('hes')),
                    this.getAllRecords(transaction.objectStore('users'))
                ]).then(([contracts, partidas, hes, users]) => {
                    data.contracts = contracts;
                    data.partidas = partidas;
                    data.hes = hes;
                    data.users = users;
                    resolve(data);
                }).catch(reject);
            };
        });
    }

    static async restoreDatabaseData(data) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SIGESCON_DB');
            
            request.onerror = () => reject(new Error('Error al acceder a la base de datos'));
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['contracts', 'partidas', 'hes', 'users'], 'readwrite');

                Promise.all([
                    this.clearAndRestore(transaction.objectStore('contracts'), data.contracts),
                    this.clearAndRestore(transaction.objectStore('partidas'), data.partidas),
                    this.clearAndRestore(transaction.objectStore('hes'), data.hes),
                    this.clearAndRestore(transaction.objectStore('users'), data.users)
                ]).then(resolve).catch(reject);
            };
        });
    }

    static async getAllRecords(store) {
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Error al obtener registros'));
        });
    }

    static async clearAndRestore(store, data) {
        return new Promise((resolve, reject) => {
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => {
                const promises = data.map(item => {
                    return new Promise((resolve, reject) => {
                        const request = store.add(item);
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(new Error('Error al restaurar registro'));
                    });
                });
                Promise.all(promises).then(resolve).catch(reject);
            };
            clearRequest.onerror = () => reject(new Error('Error al limpiar store'));
        });
    }

    static async readBackupFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    resolve(backup);
                } catch (error) {
                    reject(new Error('Error al leer archivo de respaldo'));
                }
            };
            reader.onerror = () => reject(new Error('Error al leer archivo'));
            reader.readAsText(file);
        });
    }

    static validateBackupStructure(backup) {
        return (
            backup &&
            typeof backup === 'object' &&
            backup.timestamp &&
            backup.version &&
            backup.data &&
            typeof backup.data === 'object' &&
            Array.isArray(backup.data.contracts) &&
            Array.isArray(backup.data.partidas) &&
            Array.isArray(backup.data.hes) &&
            Array.isArray(backup.data.users)
        );
    }

    static async createCompressedBackup() {
        try {
            const backup = await this.createBackup();
            const compressedData = await this.compressData(backup.data);
            
            const blob = new Blob([compressedData], { type: 'application/zip' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_compressed_${new Date().toISOString().slice(0,10)}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return {
                success: true,
                message: 'Respaldo comprimido creado exitosamente',
                timestamp: backup.timestamp
            };
        } catch (error) {
            return ErrorHandler.handleError(error, ErrorHandler.errorTypes.DATABASE);
        }
    }

    static async compressData(data) {
        try {
            const jsonString = JSON.stringify(data);
            const blob = new Blob([jsonString]);
            const compressed = await blob.arrayBuffer();
            return compressed;
        } catch (error) {
            throw new Error(`Error al comprimir datos: ${error.message}`);
        }
    }

    static async validateBackupIntegrity(backup) {
        try {
            // Validar estructura básica
            if (!backup || !backup.data || !backup.timestamp) {
                throw new Error('Estructura de respaldo inválida');
            }

            // Validar timestamp
            const backupDate = new Date(backup.timestamp);
            if (isNaN(backupDate.getTime())) {
                throw new Error('Timestamp de respaldo inválido');
            }

            // Validar datos
            for (const [store, records] of Object.entries(backup.data)) {
                if (!Array.isArray(records)) {
                    throw new Error(`Formato inválido para store: ${store}`);
                }
                
                for (const record of records) {
                    if (!this.validateRecord(record)) {
                        throw new Error(`Registro inválido en store: ${store}`);
                    }
                }
            }

            return true;
        } catch (error) {
            throw new Error(`Error en validación de integridad: ${error.message}`);
        }
    }

    static validateRecord(record) {
        try {
            // Validar campos requeridos
            const requiredFields = ['id', 'createdAt', 'updatedAt'];
            for (const field of requiredFields) {
                if (!(field in record)) {
                    return false;
                }
            }

            // Validar tipos de datos
            if (typeof record.id !== 'string' && typeof record.id !== 'number') {
                return false;
            }

            if (!(record.createdAt instanceof Date) && isNaN(new Date(record.createdAt).getTime())) {
                return false;
            }

            if (!(record.updatedAt instanceof Date) && isNaN(new Date(record.updatedAt).getTime())) {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }
}

export default BackupManager; 