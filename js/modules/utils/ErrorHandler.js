/**
 * ErrorHandler - Módulo para manejo centralizado de errores
 */
export class ErrorHandler {
    static errorTypes = {
        VALIDATION: 'VALIDATION_ERROR',
        DATABASE: 'DATABASE_ERROR',
        NETWORK: 'NETWORK_ERROR',
        EXPORT: 'EXPORT_ERROR',
        AUTH: 'AUTH_ERROR',
        UNKNOWN: 'UNKNOWN_ERROR'
    };

    static handleError(error, type = this.errorTypes.UNKNOWN) {
        console.error(`[${type}]`, error);

        // Registrar el error
        this.logError(error, type);

        // Mostrar notificación al usuario
        this.showErrorNotification(error);

        // Enviar reporte de error si es crítico
        if (this.isCriticalError(error)) {
            this.reportError(error, type);
        }

        return {
            type,
            message: error.message || 'Ha ocurrido un error inesperado',
            timestamp: new Date().toISOString()
        };
    }

    static logError(error, type) {
        const errorLog = {
            type,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };

        // Guardar en localStorage para persistencia
        const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
        logs.push(errorLog);
        localStorage.setItem('errorLogs', JSON.stringify(logs.slice(-100))); // Mantener últimos 100 errores
    }

    static showErrorNotification(error) {
        const message = error.message || 'Ha ocurrido un error inesperado';
        const type = 'error';

        // Usar el sistema de notificaciones existente
        if (window.UI && typeof window.UI.showToast === 'function') {
            window.UI.showToast(message, type);
        } else {
            // Fallback a alerta básica
            alert(message);
        }
    }

    static isCriticalError(error) {
        const criticalErrors = [
            'Database connection failed',
            'Data corruption detected',
            'Export failed',
            'Authentication failed'
        ];

        return criticalErrors.some(msg => 
            error.message && error.message.includes(msg)
        );
    }

    static async reportError(error, type) {
        try {
            const errorReport = {
                type,
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            // Aquí se podría implementar el envío a un servicio de monitoreo
            console.log('Error report:', errorReport);
        } catch (reportError) {
            console.error('Failed to report error:', reportError);
        }
    }

    static getErrorLogs() {
        return JSON.parse(localStorage.getItem('errorLogs') || '[]');
    }

    static clearErrorLogs() {
        localStorage.removeItem('errorLogs');
    }

    static async validateOperation(operation, errorType = this.errorTypes.UNKNOWN) {
        try {
            return await operation();
        } catch (error) {
            return this.handleError(error, errorType);
        }
    }

    static async recoverFromError(error, type) {
        try {
            switch (type) {
                case this.errorTypes.DATABASE:
                    return await this.recoverDatabaseError(error);
                case this.errorTypes.NETWORK:
                    return await this.recoverNetworkError(error);
                case this.errorTypes.EXPORT:
                    return await this.recoverExportError(error);
                default:
                    return false;
            }
        } catch (recoveryError) {
            console.error('Error en recuperación:', recoveryError);
            return false;
        }
    }

    static async recoverDatabaseError(error) {
        try {
            // Intentar reconexión a la base de datos
            const db = await this.reconnectDatabase();
            if (db) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error en recuperación de base de datos:', error);
            return false;
        }
    }

    static async recoverNetworkError(error) {
        try {
            // Verificar conexión
            const isOnline = navigator.onLine;
            if (isOnline) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error en recuperación de red:', error);
            return false;
        }
    }

    static async recoverExportError(error) {
        try {
            // Limpiar caché de exportación
            localStorage.removeItem('exportCache');
            return true;
        } catch (error) {
            console.error('Error en recuperación de exportación:', error);
            return false;
        }
    }

    static async reconnectDatabase() {
        try {
            // Implementar lógica de reconexión
            return true;
        } catch (error) {
            console.error('Error en reconexión de base de datos:', error);
            return false;
        }
    }

    static enhanceErrorLog(error, type) {
        return {
            ...error,
            type,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            browserInfo: {
                name: navigator.appName,
                version: navigator.appVersion,
                platform: navigator.platform
            }
        };
    }
}

export default ErrorHandler; 