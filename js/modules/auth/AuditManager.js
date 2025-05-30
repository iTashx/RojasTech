// Módulo de gestión de auditoría
import { db } from '../../database.js';
import { Notifications } from '../utils/Notifications.js';

export class AuditManager {
    constructor() {
        this.notifications = new Notifications();
    }

    // Registrar evento de auditoría
    async logEvent(event) {
        try {
            const auditLog = {
                timestamp: new Date(),
                userId: event.userId,
                action: event.action,
                module: event.module,
                details: event.details,
                ipAddress: event.ipAddress,
                userAgent: event.userAgent
            };

            await db.auditLogs.add(auditLog);
        } catch (error) {
            console.error('Error al registrar evento de auditoría:', error);
        }
    }

    // Obtener logs de auditoría
    async getAuditLogs(filters = {}) {
        try {
            let query = db.auditLogs.toCollection();

            if (filters.userId) {
                query = query.filter(log => log.userId === filters.userId);
            }

            if (filters.module) {
                query = query.filter(log => log.module === filters.module);
            }

            if (filters.action) {
                query = query.filter(log => log.action === filters.action);
            }

            if (filters.startDate) {
                query = query.filter(log => log.timestamp >= new Date(filters.startDate));
            }

            if (filters.endDate) {
                query = query.filter(log => log.timestamp <= new Date(filters.endDate));
            }

            return await query.toArray();
        } catch (error) {
            console.error('Error al obtener logs de auditoría:', error);
            return [];
        }
    }

    // Exportar logs de auditoría
    async exportAuditLogs(format = 'excel') {
        try {
            const logs = await this.getAuditLogs();
            
            if (format === 'excel') {
                return this.exportToExcel(logs);
            } else if (format === 'pdf') {
                return this.exportToPDF(logs);
            }
        } catch (error) {
            console.error('Error al exportar logs de auditoría:', error);
            throw error;
        }
    }

    // Exportar a Excel
    exportToExcel(logs) {
        // TODO: Implementar exportación a Excel
        return null;
    }

    // Exportar a PDF
    exportToPDF(logs) {
        // TODO: Implementar exportación a PDF
        return null;
    }

    // Limpiar logs antiguos
    async cleanOldLogs(daysToKeep = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            await db.auditLogs
                .where('timestamp')
                .below(cutoffDate)
                .delete();

            this.notifications.success('Logs antiguos eliminados');
        } catch (error) {
            console.error('Error al limpiar logs antiguos:', error);
            this.notifications.error('Error al limpiar logs antiguos');
        }
    }
} 