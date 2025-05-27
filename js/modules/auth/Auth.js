// Módulo de autenticación
import { db } from '../../database.js';
import { Notifications } from '../utils/Notifications.js';

export class Auth {
    constructor() {
        this.notifications = new Notifications();
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    // Iniciar sesión
    async login(username, password) {
        try {
            // Validar credenciales
            const user = await db.users.where('username').equals(username).first();
            
            if (!user) {
                this.notifications.error('Usuario no encontrado');
                return false;
            }

            if (user.password !== password) {
                this.notifications.error('Contraseña incorrecta');
                return false;
            }

            if (user.estado !== 'active') {
                this.notifications.error('Usuario inactivo');
                return false;
            }

            // Establecer usuario actual
            this.currentUser = user;
            this.isAuthenticated = true;

            // Guardar en localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));

            this.notifications.success('Bienvenido ' + user.nombre);
            return true;
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            this.notifications.error('Error al iniciar sesión');
            return false;
        }
    }

    // Cerrar sesión
    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('currentUser');
        this.notifications.info('Sesión cerrada');
    }

    // Verificar sesión
    checkAuth() {
        try {
            const user = localStorage.getItem('currentUser');
            if (user) {
                this.currentUser = JSON.parse(user);
                this.isAuthenticated = true;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al verificar sesión:', error);
            return false;
        }
    }

    // Obtener usuario actual
    getCurrentUser() {
        return this.currentUser;
    }

    // Verificar si está autenticado
    isLoggedIn() {
        return this.isAuthenticated;
    }

    // Verificar si es administrador
    isAdmin() {
        return this.currentUser && this.currentUser.rol === 'admin';
    }

    // Cambiar contraseña
    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.currentUser) {
                this.notifications.error('No hay sesión activa');
                return false;
            }

            if (this.currentUser.password !== currentPassword) {
                this.notifications.error('Contraseña actual incorrecta');
                return false;
            }

            await db.users.update(this.currentUser.id, {
                password: newPassword
            });

            this.currentUser.password = newPassword;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            this.notifications.success('Contraseña actualizada');
            return true;
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            this.notifications.error('Error al cambiar contraseña');
            return false;
        }
    }

    // Actualizar perfil
    async updateProfile(data) {
        try {
            if (!this.currentUser) {
                this.notifications.error('No hay sesión activa');
                return false;
            }

            await db.users.update(this.currentUser.id, {
                nombre: data.nombre,
                email: data.email
            });

            this.currentUser.nombre = data.nombre;
            this.currentUser.email = data.email;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            this.notifications.success('Perfil actualizado');
            return true;
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            this.notifications.error('Error al actualizar perfil');
            return false;
        }
    }

    // Crear usuario
    async createUser(data) {
        try {
            if (!this.isAdmin()) {
                this.notifications.error('No tiene permisos para crear usuarios');
                return false;
            }

            const exists = await db.users.where('username').equals(data.username).first();
            if (exists) {
                this.notifications.error('El nombre de usuario ya existe');
                return false;
            }

            const userId = await db.users.add({
                username: data.username,
                password: data.password,
                nombre: data.nombre,
                email: data.email,
                rol: data.rol || 'user',
                estado: 'active',
                fechaCreacion: new Date()
            });

            this.notifications.success('Usuario creado');
            return userId;
        } catch (error) {
            console.error('Error al crear usuario:', error);
            this.notifications.error('Error al crear usuario');
            return false;
        }
    }

    // Actualizar usuario
    async updateUser(id, data) {
        try {
            if (!this.isAdmin()) {
                this.notifications.error('No tiene permisos para actualizar usuarios');
                return false;
            }

            const user = await db.users.get(id);
            if (!user) {
                this.notifications.error('Usuario no encontrado');
                return false;
            }

            await db.users.update(id, {
                nombre: data.nombre,
                email: data.email,
                rol: data.rol,
                estado: data.estado
            });

            this.notifications.success('Usuario actualizado');
            return true;
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            this.notifications.error('Error al actualizar usuario');
            return false;
        }
    }

    // Eliminar usuario
    async deleteUser(id) {
        try {
            if (!this.isAdmin()) {
                this.notifications.error('No tiene permisos para eliminar usuarios');
                return false;
            }

            const user = await db.users.get(id);
            if (!user) {
                this.notifications.error('Usuario no encontrado');
                return false;
            }

            if (user.username === 'admin') {
                this.notifications.error('No se puede eliminar el usuario administrador');
                return false;
            }

            await db.users.delete(id);

            this.notifications.success('Usuario eliminado');
            return true;
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            this.notifications.error('Error al eliminar usuario');
            return false;
        }
    }

    // Listar usuarios
    async listUsers() {
        try {
            if (!this.isAdmin()) {
                this.notifications.error('No tiene permisos para listar usuarios');
                return [];
            }

            return await db.users.toArray();
        } catch (error) {
            console.error('Error al listar usuarios:', error);
            this.notifications.error('Error al listar usuarios');
            return [];
        }
    }

    // Obtener usuario por ID
    async getUserById(id) {
        try {
            if (!this.isAdmin()) {
                this.notifications.error('No tiene permisos para ver usuarios');
                return null;
            }

            return await db.users.get(id);
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            this.notifications.error('Error al obtener usuario');
            return null;
        }
    }
} 