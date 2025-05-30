// Módulo de gestión de autenticación
import { db } from '../../database.js';
import { Notifications } from '../utils/Notifications.js';
import { ValidationUtils } from '../utils/ValidationUtils.js';
import { ConfigManager } from '../utils/ConfigManager.js';

export class AuthManager {
    constructor() {
        this.notifications = new Notifications();
        this.configManager = new ConfigManager();
        this.currentUser = null;
        this.sessionTimeout = null;
    }

    // Iniciar sesión
    async login(username, password) {
        try {
            // Validar credenciales
            if (!username || !password) {
                this.notifications.error('Usuario y contraseña son requeridos');
                return false;
            }

            // Buscar usuario
            const user = await db.users
                .where('username')
                .equals(username)
                .first();

            if (!user) {
                this.notifications.error('Usuario no encontrado');
                return false;
            }

            // Validar contraseña
            if (user.password !== this.hashPassword(password)) {
                // Incrementar intentos fallidos
                user.intentosFallidos = (user.intentosFallidos || 0) + 1;
                await db.users.put(user);

                // Verificar bloqueo
                const systemConfig = await this.configManager.getSystemConfig();
                if (user.intentosFallidos >= systemConfig.seguridad.intentosMaximosLogin) {
                    user.bloqueado = true;
                    user.fechaBloqueo = new Date();
                    await db.users.put(user);
                    this.notifications.error('Cuenta bloqueada por intentos fallidos');
                    return false;
                }

                this.notifications.error('Contraseña incorrecta');
                return false;
            }

            // Verificar bloqueo
            if (user.bloqueado) {
                const systemConfig = await this.configManager.getSystemConfig();
                const tiempoBloqueo = systemConfig.seguridad.tiempoBloqueo * 60 * 1000; // minutos a milisegundos
                const tiempoTranscurrido = new Date() - new Date(user.fechaBloqueo);

                if (tiempoTranscurrido < tiempoBloqueo) {
                    const minutosRestantes = Math.ceil((tiempoBloqueo - tiempoTranscurrido) / (60 * 1000));
                    this.notifications.error(`Cuenta bloqueada. Intente en ${minutosRestantes} minutos`);
                    return false;
                }

                // Desbloquear cuenta
                user.bloqueado = false;
                user.fechaBloqueo = null;
            }

            // Reiniciar intentos fallidos
            user.intentosFallidos = 0;
            user.ultimoAcceso = new Date();
            await db.users.put(user);

            // Guardar sesión
            this.currentUser = {
                id: user.id,
                username: user.username,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                permisos: user.permisos
            };

            // Configurar timeout de sesión
            this.setSessionTimeout();

            this.notifications.success('Sesión iniciada');
            return true;
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            this.notifications.error(error.message || 'Error al iniciar sesión');
            return false;
        }
    }

    // Cerrar sesión
    async logout() {
        try {
            if (!this.currentUser) {
                return true;
            }

            // Limpiar sesión
            this.currentUser = null;
            this.clearSessionTimeout();

            this.notifications.success('Sesión cerrada');
            return true;
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            this.notifications.error(error.message || 'Error al cerrar sesión');
            return false;
        }
    }

    // Registrar usuario
    async register(userData) {
        try {
            // Validar datos
            if (!userData.username || !userData.password || !userData.email) {
                this.notifications.error('Datos incompletos');
                return false;
            }

            // Validar usuario
            const existingUser = await db.users
                .where('username')
                .equals(userData.username)
                .first();

            if (existingUser) {
                this.notifications.error('El usuario ya existe');
                return false;
            }

            // Validar email
            const existingEmail = await db.users
                .where('email')
                .equals(userData.email)
                .first();

            if (existingEmail) {
                this.notifications.error('El email ya está registrado');
                return false;
            }

            // Validar contraseña
            const systemConfig = await this.configManager.getSystemConfig();
            if (userData.password.length < systemConfig.seguridad.longitudMinimaPassword) {
                this.notifications.error(`La contraseña debe tener al menos ${systemConfig.seguridad.longitudMinimaPassword} caracteres`);
                return false;
            }

            // Crear usuario
            const user = {
                username: userData.username,
                password: this.hashPassword(userData.password),
                email: userData.email,
                nombre: userData.nombre || '',
                rol: userData.rol || 'usuario',
                permisos: userData.permisos || [],
                activo: true,
                fechaCreacion: new Date(),
                ultimoAcceso: null,
                intentosFallidos: 0,
                bloqueado: false,
                fechaBloqueo: null
            };

            await db.users.add(user);

            this.notifications.success('Usuario registrado');
            return true;
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            this.notifications.error(error.message || 'Error al registrar usuario');
            return false;
        }
    }

    // Cambiar contraseña
    async changePassword(userId, currentPassword, newPassword) {
        try {
            // Validar datos
            if (!currentPassword || !newPassword) {
                this.notifications.error('Datos incompletos');
                return false;
            }

            // Buscar usuario
            const user = await db.users.get(userId);
            if (!user) {
                this.notifications.error('Usuario no encontrado');
                return false;
            }

            // Validar contraseña actual
            if (user.password !== this.hashPassword(currentPassword)) {
                this.notifications.error('Contraseña actual incorrecta');
                return false;
            }

            // Validar nueva contraseña
            const systemConfig = await this.configManager.getSystemConfig();
            if (newPassword.length < systemConfig.seguridad.longitudMinimaPassword) {
                this.notifications.error(`La contraseña debe tener al menos ${systemConfig.seguridad.longitudMinimaPassword} caracteres`);
                return false;
            }

            // Actualizar contraseña
            user.password = this.hashPassword(newPassword);
            user.fechaActualizacion = new Date();
            await db.users.put(user);

            this.notifications.success('Contraseña actualizada');
            return true;
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            this.notifications.error(error.message || 'Error al cambiar contraseña');
            return false;
        }
    }

    // Recuperar contraseña
    async recoverPassword(email) {
        try {
            // Validar email
            if (!email) {
                this.notifications.error('Email requerido');
                return false;
            }

            // Buscar usuario
            const user = await db.users
                .where('email')
                .equals(email)
                .first();

            if (!user) {
                this.notifications.error('Email no registrado');
                return false;
            }

            // Generar token
            const token = this.generateToken();
            const expiration = new Date();
            expiration.setHours(expiration.getHours() + 24); // 24 horas

            // Guardar token
            await db.tokens.add({
                userId: user.id,
                token,
                tipo: 'password',
                expiracion: expiration,
                usado: false
            });

            // TODO: Enviar email con token
            this.notifications.info('Se ha enviado un email con instrucciones');
            return true;
        } catch (error) {
            console.error('Error al recuperar contraseña:', error);
            this.notifications.error(error.message || 'Error al recuperar contraseña');
            return false;
        }
    }

    // Restablecer contraseña
    async resetPassword(token, newPassword) {
        try {
            // Validar datos
            if (!token || !newPassword) {
                this.notifications.error('Datos incompletos');
                return false;
            }

            // Buscar token
            const tokenData = await db.tokens
                .where('token')
                .equals(token)
                .first();

            if (!tokenData) {
                this.notifications.error('Token inválido');
                return false;
            }

            // Validar expiración
            if (new Date() > new Date(tokenData.expiracion)) {
                this.notifications.error('Token expirado');
                return false;
            }

            // Validar uso
            if (tokenData.usado) {
                this.notifications.error('Token ya utilizado');
                return false;
            }

            // Validar nueva contraseña
            const systemConfig = await this.configManager.getSystemConfig();
            if (newPassword.length < systemConfig.seguridad.longitudMinimaPassword) {
                this.notifications.error(`La contraseña debe tener al menos ${systemConfig.seguridad.longitudMinimaPassword} caracteres`);
                return false;
            }

            // Buscar usuario
            const user = await db.users.get(tokenData.userId);
            if (!user) {
                this.notifications.error('Usuario no encontrado');
                return false;
            }

            // Actualizar contraseña
            user.password = this.hashPassword(newPassword);
            user.fechaActualizacion = new Date();
            await db.users.put(user);

            // Marcar token como usado
            tokenData.usado = true;
            await db.tokens.put(tokenData);

            this.notifications.success('Contraseña restablecida');
            return true;
        } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            this.notifications.error(error.message || 'Error al restablecer contraseña');
            return false;
        }
    }

    // Verificar sesión
    async checkSession() {
        try {
            if (!this.currentUser) {
                return false;
            }

            // Buscar usuario
            const user = await db.users.get(this.currentUser.id);
            if (!user) {
                this.logout();
                return false;
            }

            // Verificar estado
            if (!user.activo) {
                this.logout();
                this.notifications.error('Usuario inactivo');
                return false;
            }

            // Verificar bloqueo
            if (user.bloqueado) {
                this.logout();
                this.notifications.error('Usuario bloqueado');
                return false;
            }

            // Actualizar último acceso
            user.ultimoAcceso = new Date();
            await db.users.put(user);

            // Reiniciar timeout
            this.setSessionTimeout();

            return true;
        } catch (error) {
            console.error('Error al verificar sesión:', error);
            this.logout();
            return false;
        }
    }

    // Obtener usuario actual
    getCurrentUser() {
        return this.currentUser;
    }

    // Verificar permiso
    hasPermission(permission) {
        try {
            if (!this.currentUser) {
                return false;
            }

            // Verificar rol
            if (this.currentUser.rol === 'admin') {
                return true;
            }

            // Verificar permisos
            return this.currentUser.permisos.includes(permission);
        } catch (error) {
            console.error('Error al verificar permiso:', error);
            return false;
        }
    }

    // Configurar timeout de sesión
    setSessionTimeout() {
        try {
            this.clearSessionTimeout();

            const systemConfig = this.configManager.getSystemConfig();
            const timeout = systemConfig.seguridad.sesionTimeout * 60 * 1000; // minutos a milisegundos

            this.sessionTimeout = setTimeout(() => {
                this.logout();
                this.notifications.warning('Sesión expirada');
            }, timeout);
        } catch (error) {
            console.error('Error al configurar timeout de sesión:', error);
        }
    }

    // Limpiar timeout de sesión
    clearSessionTimeout() {
        try {
            if (this.sessionTimeout) {
                clearTimeout(this.sessionTimeout);
                this.sessionTimeout = null;
            }
        } catch (error) {
            console.error('Error al limpiar timeout de sesión:', error);
        }
    }

    // Generar token
    generateToken() {
        try {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let token = '';
            for (let i = 0; i < 32; i++) {
                token += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return token;
        } catch (error) {
            console.error('Error al generar token:', error);
            return null;
        }
    }

    // Hash de contraseña
    hashPassword(password) {
        try {
            // TODO: Implementar hash seguro
            return password;
        } catch (error) {
            console.error('Error al hashear contraseña:', error);
            return null;
        }
    }
} 