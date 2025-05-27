// Módulo de gestión de configuración
import { db } from '../../database.js';
import { Notifications } from './Notifications.js';

export class ConfigManager {
    constructor() {
        this.notifications = new Notifications();
    }

    // Obtener configuración
    async getConfig(key) {
        try {
            const config = await db.settings.get(key);
            return config ? config.value : null;
        } catch (error) {
            console.error('Error al obtener configuración:', error);
            this.notifications.error(error.message || 'Error al obtener configuración');
            return null;
        }
    }

    // Guardar configuración
    async setConfig(key, value) {
        try {
            await db.settings.put({
                key,
                value,
                fechaCreacion: new Date()
            });
            return true;
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            this.notifications.error(error.message || 'Error al guardar configuración');
            return false;
        }
    }

    // Eliminar configuración
    async deleteConfig(key) {
        try {
            await db.settings.delete(key);
            return true;
        } catch (error) {
            console.error('Error al eliminar configuración:', error);
            this.notifications.error(error.message || 'Error al eliminar configuración');
            return false;
        }
    }

    // Listar configuraciones
    async listConfigs() {
        try {
            const configs = await db.settings.toArray();
            return configs.reduce((acc, config) => {
                acc[config.key] = config.value;
                return acc;
            }, {});
        } catch (error) {
            console.error('Error al listar configuraciones:', error);
            this.notifications.error(error.message || 'Error al listar configuraciones');
            return {};
        }
    }

    // Obtener configuración de empresa
    async getCompanyConfig() {
        try {
            const config = await this.getConfig('company');
            if (!config) {
                // Configuración por defecto
                const defaultConfig = {
                    nombre: 'Rojas Tech',
                    ruc: '',
                    razonSocial: '',
                    direccion: {
                        calle: '',
                        distrito: '',
                        provincia: '',
                        departamento: ''
                    },
                    contacto: {
                        telefono: '',
                        email: '',
                        web: ''
                    },
                    logo: null,
                    moneda: 'PEN',
                    igv: 18,
                    retencion: 0
                };
                await this.setConfig('company', defaultConfig);
                return defaultConfig;
            }
            return config;
        } catch (error) {
            console.error('Error al obtener configuración de empresa:', error);
            this.notifications.error(error.message || 'Error al obtener configuración de empresa');
            return null;
        }
    }

    // Guardar configuración de empresa
    async setCompanyConfig(config) {
        try {
            return await this.setConfig('company', config);
        } catch (error) {
            console.error('Error al guardar configuración de empresa:', error);
            this.notifications.error(error.message || 'Error al guardar configuración de empresa');
            return false;
        }
    }

    // Obtener configuración de usuario
    async getUserConfig() {
        try {
            const config = await this.getConfig('user');
            if (!config) {
                // Configuración por defecto
                const defaultConfig = {
                    tema: 'light',
                    idioma: 'es',
                    moneda: 'PEN',
                    formatoFecha: 'dd/MM/yyyy',
                    formatoHora: 'HH:mm',
                    formatoNumero: '#,##0.00',
                    notificaciones: {
                        email: true,
                        push: true,
                        sonido: true
                    }
                };
                await this.setConfig('user', defaultConfig);
                return defaultConfig;
            }
            return config;
        } catch (error) {
            console.error('Error al obtener configuración de usuario:', error);
            this.notifications.error(error.message || 'Error al obtener configuración de usuario');
            return null;
        }
    }

    // Guardar configuración de usuario
    async setUserConfig(config) {
        try {
            return await this.setConfig('user', config);
        } catch (error) {
            console.error('Error al guardar configuración de usuario:', error);
            this.notifications.error(error.message || 'Error al guardar configuración de usuario');
            return false;
        }
    }

    // Obtener configuración de sistema
    async getSystemConfig() {
        try {
            const config = await this.getConfig('system');
            if (!config) {
                // Configuración por defecto
                const defaultConfig = {
                    version: '1.0.0',
                    fechaInstalacion: new Date(),
                    ultimaActualizacion: new Date(),
                    baseDatos: {
                        version: 1,
                        fechaCreacion: new Date()
                    },
                    seguridad: {
                        longitudMinimaPassword: 8,
                        intentosMaximosLogin: 3,
                        tiempoBloqueo: 30, // minutos
                        sesionTimeout: 30 // minutos
                    },
                    backup: {
                        automatico: true,
                        frecuencia: 'daily',
                        hora: '00:00',
                        retener: 30 // días
                    }
                };
                await this.setConfig('system', defaultConfig);
                return defaultConfig;
            }
            return config;
        } catch (error) {
            console.error('Error al obtener configuración de sistema:', error);
            this.notifications.error(error.message || 'Error al obtener configuración de sistema');
            return null;
        }
    }

    // Guardar configuración de sistema
    async setSystemConfig(config) {
        try {
            return await this.setConfig('system', config);
        } catch (error) {
            console.error('Error al guardar configuración de sistema:', error);
            this.notifications.error(error.message || 'Error al guardar configuración de sistema');
            return false;
        }
    }

    // Obtener configuración de correo
    async getEmailConfig() {
        try {
            const config = await this.getConfig('email');
            if (!config) {
                // Configuración por defecto
                const defaultConfig = {
                    servidor: '',
                    puerto: 587,
                    seguridad: 'tls',
                    usuario: '',
                    password: '',
                    remitente: '',
                    nombre: '',
                    respuesta: '',
                    plantillas: {
                        bienvenida: '',
                        recuperacion: '',
                        notificacion: ''
                    }
                };
                await this.setConfig('email', defaultConfig);
                return defaultConfig;
            }
            return config;
        } catch (error) {
            console.error('Error al obtener configuración de correo:', error);
            this.notifications.error(error.message || 'Error al obtener configuración de correo');
            return null;
        }
    }

    // Guardar configuración de correo
    async setEmailConfig(config) {
        try {
            return await this.setConfig('email', config);
        } catch (error) {
            console.error('Error al guardar configuración de correo:', error);
            this.notifications.error(error.message || 'Error al guardar configuración de correo');
            return false;
        }
    }

    // Obtener configuración de almacenamiento
    async getStorageConfig() {
        try {
            const config = await this.getConfig('storage');
            if (!config) {
                // Configuración por defecto
                const defaultConfig = {
                    tipo: 'local',
                    ruta: '',
                    maxSize: 100 * 1024 * 1024, // 100MB
                    tiposPermitidos: [
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'image/jpeg',
                        'image/png',
                        'image/gif'
                    ],
                    compresion: {
                        activa: true,
                        calidad: 0.8
                    }
                };
                await this.setConfig('storage', defaultConfig);
                return defaultConfig;
            }
            return config;
        } catch (error) {
            console.error('Error al obtener configuración de almacenamiento:', error);
            this.notifications.error(error.message || 'Error al obtener configuración de almacenamiento');
            return null;
        }
    }

    // Guardar configuración de almacenamiento
    async setStorageConfig(config) {
        try {
            return await this.setConfig('storage', config);
        } catch (error) {
            console.error('Error al guardar configuración de almacenamiento:', error);
            this.notifications.error(error.message || 'Error al guardar configuración de almacenamiento');
            return false;
        }
    }

    // Obtener configuración de impresión
    async getPrintConfig() {
        try {
            const config = await this.getConfig('print');
            if (!config) {
                // Configuración por defecto
                const defaultConfig = {
                    orientacion: 'portrait',
                    tamanio: 'a4',
                    margenes: {
                        superior: 20,
                        inferior: 20,
                        izquierdo: 20,
                        derecho: 20
                    },
                    encabezado: {
                        mostrar: true,
                        logo: true,
                        titulo: true,
                        fecha: true
                    },
                    pie: {
                        mostrar: true,
                        pagina: true,
                        fecha: true
                    },
                    fuentes: {
                        titulo: {
                            familia: 'Arial',
                            tamanio: 14,
                            negrita: true
                        },
                        subtitulo: {
                            familia: 'Arial',
                            tamanio: 12,
                            negrita: true
                        },
                        contenido: {
                            familia: 'Arial',
                            tamanio: 10,
                            negrita: false
                        }
                    }
                };
                await this.setConfig('print', defaultConfig);
                return defaultConfig;
            }
            return config;
        } catch (error) {
            console.error('Error al obtener configuración de impresión:', error);
            this.notifications.error(error.message || 'Error al obtener configuración de impresión');
            return null;
        }
    }

    // Guardar configuración de impresión
    async setPrintConfig(config) {
        try {
            return await this.setConfig('print', config);
        } catch (error) {
            console.error('Error al guardar configuración de impresión:', error);
            this.notifications.error(error.message || 'Error al guardar configuración de impresión');
            return false;
        }
    }

    // Obtener configuración de reportes
    async getReportConfig() {
        try {
            const config = await this.getConfig('report');
            if (!config) {
                // Configuración por defecto
                const defaultConfig = {
                    formato: 'pdf',
                    calidad: 'alta',
                    compresion: true,
                    marcasAgua: {
                        activa: false,
                        texto: '',
                        opacidad: 0.3
                    },
                    firmas: {
                        activa: false,
                        digital: false,
                        imagen: null
                    },
                    seguridad: {
                        activa: false,
                        password: '',
                        permisos: {
                            imprimir: true,
                            copiar: true,
                            modificar: false
                        }
                    }
                };
                await this.setConfig('report', defaultConfig);
                return defaultConfig;
            }
            return config;
        } catch (error) {
            console.error('Error al obtener configuración de reportes:', error);
            this.notifications.error(error.message || 'Error al obtener configuración de reportes');
            return null;
        }
    }

    // Guardar configuración de reportes
    async setReportConfig(config) {
        try {
            return await this.setConfig('report', config);
        } catch (error) {
            console.error('Error al guardar configuración de reportes:', error);
            this.notifications.error(error.message || 'Error al guardar configuración de reportes');
            return false;
        }
    }
} 