// Módulo de gestión de respaldo
import { db } from '../../database.js';
import { Notifications } from '../utils/Notifications.js';
import { ConfigManager } from '../utils/ConfigManager.js';
import { AuditManager } from '../auth/AuditManager.js';

export class BackupManager {
    constructor() {
        this.notifications = new Notifications();
        this.configManager = new ConfigManager();
        this.auditManager = new AuditManager();
        this.backupInterval = null;
    }

    // Iniciar respaldo automático
    async startAutoBackup() {
        try {
            const config = await this.configManager.getSystemConfig();
            const interval = config.backup.interval * 60 * 60 * 1000; // horas a milisegundos

            this.backupInterval = setInterval(async () => {
                await this.createBackup();
            }, interval);

            this.notifications.success('Respaldo automático iniciado');
        } catch (error) {
            console.error('Error al iniciar respaldo automático:', error);
            this.notifications.error('Error al iniciar respaldo automático');
        }
    }

    // Detener respaldo automático
    stopAutoBackup() {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
            this.notifications.info('Respaldo automático detenido');
        }
    }

    // Crear respaldo
    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backup = {
                timestamp,
                data: await this.exportDatabase(),
                metadata: {
                    version: '1.0',
                    createdBy: 'system',
                    size: 0 // Se actualizará después
                }
            };

            // Guardar respaldo
            await db.backups.add(backup);

            // Registrar evento
            await this.auditManager.logEvent({
                userId: 'system',
                action: 'backup_created',
                module: 'backup',
                details: `Respaldo creado: ${timestamp}`,
                ipAddress: 'system',
                userAgent: 'system'
            });

            this.notifications.success('Respaldo creado exitosamente');
            return backup;
        } catch (error) {
            console.error('Error al crear respaldo:', error);
            this.notifications.error('Error al crear respaldo');
            return null;
        }
    }

    // Exportar base de datos
    async exportDatabase() {
        try {
            const data = {
                contracts: await db.contracts.toArray(),
                hes: await db.hes.toArray(),
                users: await db.users.toArray(),
                auditLogs: await db.auditLogs.toArray(),
                backups: await db.backups.toArray()
            };

            return JSON.stringify(data);
        } catch (error) {
            console.error('Error al exportar base de datos:', error);
            throw error;
        }
    }

    // Restaurar respaldo
    async restoreBackup(backupId) {
        try {
            const backup = await db.backups.get(backupId);
            if (!backup) {
                throw new Error('Respaldo no encontrado');
            }

            const data = JSON.parse(backup.data);

            // Restaurar datos
            await db.contracts.clear();
            await db.hes.clear();
            await db.users.clear();
            await db.auditLogs.clear();
            await db.backups.clear();

            await db.contracts.bulkAdd(data.contracts);
            await db.hes.bulkAdd(data.hes);
            await db.users.bulkAdd(data.users);
            await db.auditLogs.bulkAdd(data.auditLogs);
            await db.backups.bulkAdd(data.backups);

            // Registrar evento
            await this.auditManager.logEvent({
                userId: 'system',
                action: 'backup_restored',
                module: 'backup',
                details: `Respaldo restaurado: ${backup.timestamp}`,
                ipAddress: 'system',
                userAgent: 'system'
            });

            this.notifications.success('Respaldo restaurado exitosamente');
            return true;
        } catch (error) {
            console.error('Error al restaurar respaldo:', error);
            this.notifications.error('Error al restaurar respaldo');
            return false;
        }
    }

    // Listar respaldos
    async listBackups() {
        try {
            return await db.backups.toArray();
        } catch (error) {
            console.error('Error al listar respaldos:', error);
            return [];
        }
    }

    // Eliminar respaldo
    async deleteBackup(backupId) {
        try {
            await db.backups.delete(backupId);

            // Registrar evento
            await this.auditManager.logEvent({
                userId: 'system',
                action: 'backup_deleted',
                module: 'backup',
                details: `Respaldo eliminado: ${backupId}`,
                ipAddress: 'system',
                userAgent: 'system'
            });

            this.notifications.success('Respaldo eliminado exitosamente');
            return true;
        } catch (error) {
            console.error('Error al eliminar respaldo:', error);
            this.notifications.error('Error al eliminar respaldo');
            return false;
        }
    }

    // Limpiar respaldos antiguos
    async cleanOldBackups(daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const oldBackups = await db.backups
                .where('timestamp')
                .below(cutoffDate.toISOString())
                .toArray();

            for (const backup of oldBackups) {
                await this.deleteBackup(backup.id);
            }

            this.notifications.success('Respaldos antiguos eliminados');
        } catch (error) {
            console.error('Error al limpiar respaldos antiguos:', error);
            this.notifications.error('Error al limpiar respaldos antiguos');
        }
    }
} 