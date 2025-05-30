// Script de configuración inicial
import { db } from './database.js';
import { AuthManager } from './modules/auth/AuthManager.js';
import { BackupManager } from './modules/backup/BackupManager.js';
import { ConfigManager } from './modules/utils/ConfigManager.js';

export class SetupManager {
    constructor() {
        this.authManager = new AuthManager();
        this.backupManager = new BackupManager();
        this.configManager = new ConfigManager();
    }

    // Inicializar base de datos
    async initializeDatabase() {
        try {
            // Verificar si ya está inicializada
            const isInitialized = await this.checkInitialization();
            if (isInitialized) {
                console.log('La base de datos ya está inicializada');
                return true;
            }

            // Crear usuario administrador inicial
            await this.createInitialAdmin();

            // Iniciar respaldo automático
            await this.backupManager.startAutoBackup();

            console.log('Base de datos inicializada correctamente');
            return true;
        } catch (error) {
            console.error('Error al inicializar la base de datos:', error);
            return false;
        }
    }

    // Verificar inicialización
    async checkInitialization() {
        try {
            const admin = await db.users.where('username').equals('admin').first();
            return !!admin;
        } catch (error) {
            console.error('Error al verificar inicialización:', error);
            return false;
        }
    }

    // Crear administrador inicial
    async createInitialAdmin() {
        try {
            const adminData = {
                username: 'admin',
                password: 'RojasTech2024',
                email: 'admin@rojastech.com',
                nombre: 'Administrador',
                rol: 'admin',
                permisos: ['*'],
                activo: true,
                fechaCreacion: new Date()
            };

            await this.authManager.register(adminData);
            console.log('Usuario administrador creado');
        } catch (error) {
            console.error('Error al crear administrador:', error);
            throw error;
        }
    }

    // Restaurar base de datos desde archivo
    async restoreFromFile(file) {
        try {
            const reader = new FileReader();
            
            return new Promise((resolve, reject) => {
                reader.onload = async (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        // Limpiar base de datos actual
                        await db.delete();
                        await db.open();
                        
                        // Restaurar datos
                        await db.contracts.bulkAdd(data.contracts || []);
                        await db.hes.bulkAdd(data.hes || []);
                        await db.users.bulkAdd(data.users || []);
                        await db.auditLogs.bulkAdd(data.auditLogs || []);
                        await db.backups.bulkAdd(data.backups || []);
                        
                        console.log('Base de datos restaurada correctamente');
                        resolve(true);
                    } catch (error) {
                        console.error('Error al restaurar datos:', error);
                        reject(error);
                    }
                };
                
                reader.onerror = (error) => {
                    console.error('Error al leer archivo:', error);
                    reject(error);
                };
                
                reader.readAsText(file);
            });
        } catch (error) {
            console.error('Error en proceso de restauración:', error);
            throw error;
        }
    }

    // Exportar base de datos a archivo
    async exportToFile() {
        try {
            const data = {
                contracts: await db.contracts.toArray(),
                hes: await db.hes.toArray(),
                users: await db.users.toArray(),
                auditLogs: await db.auditLogs.toArray(),
                backups: await db.backups.toArray()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `sigescon_backup_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('Base de datos exportada correctamente');
            return true;
        } catch (error) {
            console.error('Error al exportar base de datos:', error);
            return false;
        }
    }
}

// Inicializar al cargar la página
window.addEventListener('DOMContentLoaded', async () => {
    const setup = new SetupManager();
    await setup.initializeDatabase();
}); 