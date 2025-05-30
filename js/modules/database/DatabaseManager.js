// Módulo de gestión de base de datos
import { db } from '../../database.js';
import { Notifications } from '../utils/Notifications.js';
import { AuditManager } from '../auth/AuditManager.js';

export class DatabaseManager {
    constructor() {
        this.dbName = 'sigesconDB';
        this.dbVersion = 1;
        this.db = null;
        this.stores = {
            contracts: 'contracts',
            hes: 'hes',
            items: 'items',
            settings: 'settings',
            backups: 'backups'
        };
        
        this.notifications = new Notifications();
        this.auditManager = new AuditManager();
        this.init();
    }

    async init() {
        try {
            this.db = await this.openDatabase();
            console.log('Base de datos inicializada correctamente');
        } catch (error) {
            console.error('Error al inicializar la base de datos:', error);
            throw error;
        }
    }

    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                reject('Error al abrir la base de datos: ' + event.target.error);
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Crear object stores
                if (!db.objectStoreNames.contains(this.stores.contracts)) {
                    db.createObjectStore(this.stores.contracts, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(this.stores.hes)) {
                    db.createObjectStore(this.stores.hes, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(this.stores.items)) {
                    db.createObjectStore(this.stores.items, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    db.createObjectStore(this.stores.settings, { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains(this.stores.backups)) {
                    db.createObjectStore(this.stores.backups, { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    async export() {
        try {
            const data = {};
            for (const store of Object.values(this.stores)) {
                data[store] = await this.getAll(store);
            }
            return data;
        } catch (error) {
            console.error('Error al exportar la base de datos:', error);
            throw error;
        }
    }

    async import(data) {
        try {
            // Validar estructura de datos
            this.validateImportData(data);

            // Iniciar transacción
            const transaction = this.db.transaction(Object.values(this.stores), 'readwrite');

            // Limpiar stores existentes
            for (const store of Object.values(this.stores)) {
                await this.clearStore(store);
            }

            // Importar datos
            for (const [store, items] of Object.entries(data)) {
                for (const item of items) {
                    await this.add(store, item);
                }
            }

            // Crear respaldo automático
            await this.createBackup('Importación automática');

            return true;
        } catch (error) {
            console.error('Error al importar la base de datos:', error);
            throw error;
        }
    }

    validateImportData(data) {
        const requiredStores = Object.values(this.stores);
        for (const store of requiredStores) {
            if (!data[store] || !Array.isArray(data[store])) {
                throw new Error(`Datos inválidos: falta o es inválido el store ${store}`);
            }
        }
    }

    async createBackup(description = '') {
        try {
            const data = await this.export();
            const backup = {
                timestamp: new Date().toISOString(),
                description,
                data
            };
            await this.add(this.stores.backups, backup);
            return backup;
        } catch (error) {
            console.error('Error al crear respaldo:', error);
            throw error;
        }
    }

    async restoreBackup(backupId) {
        try {
            const backup = await this.get(this.stores.backups, backupId);
            if (!backup) {
                throw new Error('Respaldo no encontrado');
            }
            await this.import(backup.data);
            return true;
        } catch (error) {
            console.error('Error al restaurar respaldo:', error);
            throw error;
        }
    }

    async getAll(store) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(store, 'readonly');
            const objectStore = transaction.objectStore(store);
            const request = objectStore.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(store, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(store, 'readonly');
            const objectStore = transaction.objectStore(store);
            const request = objectStore.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async add(store, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(store, 'readwrite');
            const objectStore = transaction.objectStore(store);
            const request = objectStore.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(store, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(store, 'readwrite');
            const objectStore = transaction.objectStore(store);
            const request = objectStore.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(store, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(store, 'readwrite');
            const objectStore = transaction.objectStore(store);
            const request = objectStore.delete(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearStore(store) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(store, 'readwrite');
            const objectStore = transaction.objectStore(store);
            const request = objectStore.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Exportar base de datos
    async exportDatabase() {
        try {
            const backup = {
                contracts: await db.contracts.toArray(),
                hes: await db.hes.toArray(),
                users: await db.users.toArray(),
                auditLogs: await db.auditLogs.toArray(),
                backups: await db.backups.toArray(),
                config: await db.config.toArray(),
                notifications: await db.notifications.toArray()
            };

            // Crear archivo de descarga
            const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SIGESCON_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            // Registrar evento
            await this.auditManager.logEvent({
                action: 'export_database',
                details: 'Exportación manual de base de datos'
            });

            this.notifications.success('Base de datos exportada correctamente');
            return true;
        } catch (error) {
            console.error('Error al exportar base de datos:', error);
            this.notifications.error('Error al exportar base de datos');
            return false;
        }
    }

    // Importar base de datos
    async importDatabase(file) {
        try {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validar estructura
                    if (!this.validateBackupStructure(data)) {
                        throw new Error('Estructura de respaldo inválida');
                    }

                    // Limpiar base de datos actual
                    await this.clearDatabase();

                    // Importar datos
                    for (const [store, items] of Object.entries(data)) {
                        await db[store].bulkAdd(items);
                    }

                    // Registrar evento
                    await this.auditManager.logEvent({
                        action: 'import_database',
                        details: 'Importación manual de base de datos'
                    });

                    this.notifications.success('Base de datos importada correctamente');
                } catch (error) {
                    console.error('Error al procesar archivo:', error);
                    this.notifications.error('Error al importar base de datos');
                }
            };

            reader.readAsText(file);
        } catch (error) {
            console.error('Error al importar base de datos:', error);
            this.notifications.error('Error al importar base de datos');
            return false;
        }
    }

    // Validar estructura del respaldo
    validateBackupStructure(data) {
        const requiredStores = ['contracts', 'hes', 'users', 'auditLogs', 'backups', 'config', 'notifications'];
        return requiredStores.every(store => Array.isArray(data[store]));
    }

    // Limpiar base de datos
    async clearDatabase() {
        try {
            const stores = ['contracts', 'hes', 'users', 'auditLogs', 'backups', 'config', 'notifications'];
            for (const store of stores) {
                await db[store].clear();
            }
            return true;
        } catch (error) {
            console.error('Error al limpiar base de datos:', error);
            return false;
        }
    }

    // Crear respaldo automático
    async createAutomaticBackup() {
        try {
            const backup = {
                contracts: await db.contracts.toArray(),
                hes: await db.hes.toArray(),
                users: await db.users.toArray(),
                auditLogs: await db.auditLogs.toArray(),
                config: await db.config.toArray(),
                notifications: await db.notifications.toArray()
            };

            // Guardar respaldo
            await db.backups.add({
                fecha: new Date(),
                datos: backup,
                tipo: 'automatico'
            });

            // Limpiar respaldos antiguos
            await this.cleanOldBackups();

            return true;
        } catch (error) {
            console.error('Error al crear respaldo automático:', error);
            return false;
        }
    }

    // Limpiar respaldos antiguos
    async cleanOldBackups() {
        try {
            const config = await db.config.get('system');
            const diasRetener = config?.backup?.diasRetener || 90;
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - diasRetener);

            await db.backups
                .where('fecha')
                .below(fechaLimite)
                .delete();

            return true;
        } catch (error) {
            console.error('Error al limpiar respaldos antiguos:', error);
            return false;
        }
    }

    // Listar respaldos disponibles
    async listBackups() {
        try {
            return await db.backups
                .orderBy('fecha')
                .reverse()
                .toArray();
        } catch (error) {
            console.error('Error al listar respaldos:', error);
            return [];
        }
    }
}

// Exportar la clase
window.DatabaseManager = DatabaseManager; 