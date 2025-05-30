import { NotificationManager } from './NotificationManager.js';
import { DatabaseManager } from '../../database.js';

class NotificationButton {
    constructor() {
        this.db = new DatabaseManager();
        this.notificationManager = new NotificationManager();
        this.initializeElements();
    }

    initializeElements() {
        // Esperar a que el DOM esté completamente cargado
        document.addEventListener('DOMContentLoaded', async () => {
            this.notificationBell = document.getElementById('notificationBell');
            this.notificationDropdown = document.getElementById('notificationDropdown');
            this.notificationList = document.getElementById('notificationList');
            this.notificationCount = document.getElementById('notificationCount');
            this.clearNotificationsBtn = document.getElementById('clearNotifications');

            if (this.notificationBell && this.notificationDropdown && 
                this.notificationList && this.notificationCount) {
                await this.init();
            } else {
                console.error('No se encontraron los elementos necesarios para el sistema de notificaciones');
            }
        });
    }

    async init() {
        try {
            // Inicializar la base de datos
            await this.db.init();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Cargar notificaciones existentes
            await this.loadNotifications();
            
            // Agregar notificaciones de prueba solo si no hay notificaciones
            const notifications = await this.db.getNotifications();
            if (notifications.length === 0) {
                await this.addTestNotifications();
            }
            
            // Actualizar el contador inicial
            await this.updateNotificationCount();
        } catch (error) {
            console.error('Error al inicializar el sistema de notificaciones:', error);
        }
    }

    setupEventListeners() {
        // Toggle del dropdown al hacer clic en el botón
        this.notificationBell.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!this.notificationDropdown.contains(e.target) && 
                !this.notificationBell.contains(e.target)) {
                this.notificationDropdown.classList.remove('show');
            }
        });

        // Limpiar todas las notificaciones
        this.clearNotificationsBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('¿Está seguro de que desea eliminar todas las notificaciones?')) {
                await this.clearAllNotifications();
            }
        });

        // Marcar como leída al hacer clic en una notificación
        this.notificationList.addEventListener('click', async (e) => {
            const notificationItem = e.target.closest('.notification-item');
            if (notificationItem) {
                const notificationId = notificationItem.dataset.id;
                await this.markAsRead(notificationId);
                this.showNotificationDetails(notificationId);
            }
        });
    }

    async loadNotifications() {
        try {
            const notifications = await this.db.getNotifications();
            this.renderNotifications(notifications);
            this.updateNotificationCount();
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
        }
    }

    toggleDropdown() {
        this.notificationDropdown.classList.toggle('show');
        if (this.notificationDropdown.classList.contains('show')) {
            this.renderNotifications();
        }
    }

    async renderNotifications() {
        try {
            const notifications = await this.db.getNotifications();
            this.notificationList.innerHTML = '';

            if (notifications.length === 0) {
                this.notificationList.innerHTML = `
                    <div class="no-notifications">
                        No hay notificaciones pendientes
                    </div>
                `;
                return;
            }

            notifications.forEach(notification => {
                const notificationElement = this.createNotificationElement(notification);
                this.notificationList.appendChild(notificationElement);
            });

            // Agregar botón "Marcar todas como leídas"
            const markAllReadBtn = document.createElement('button');
            markAllReadBtn.className = 'btn btn-link w-100 text-center mt-2';
            markAllReadBtn.innerHTML = '<i class="fas fa-check-double"></i> Marcar todas como leídas';
            markAllReadBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.markAllAsRead();
            });
            this.notificationList.appendChild(markAllReadBtn);
        } catch (error) {
            console.error('Error al renderizar notificaciones:', error);
        }
    }

    createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification-item ${notification.read ? '' : 'unread'}`;
        div.dataset.id = notification.id;
        
        const timeAgo = this.getTimeAgo(notification.timestamp);
        
        div.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <h6 class="notification-title">${notification.title}</h6>
                    <span class="notification-time">${timeAgo}</span>
                </div>
                <p class="notification-preview">${notification.message}</p>
            </div>
        `;
        
        return div;
    }

    async addTestNotifications() {
        const testNotifications = [
            {
                title: 'Prueba',
                message: 'Esta es una notificación de prueba del sistema',
                details: 'Esta notificación se ha creado para probar el funcionamiento del sistema de notificaciones.',
                solution: 'Puedes hacer clic en la notificación para ver más detalles.',
                type: 'info',
                timestamp: new Date().toISOString(),
                read: false
            }
        ];

        for (const notification of testNotifications) {
            await this.db.saveNotification(notification);
        }
    }

    getTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Ahora mismo';
        if (diff < 3600000) return `Hace ${Math.floor(diff/60000)} minutos`;
        if (diff < 86400000) return `Hace ${Math.floor(diff/3600000)} horas`;
        return date.toLocaleDateString('es-ES');
    }

    async updateNotificationCount() {
        try {
            const notifications = await this.db.getNotifications();
            const unreadCount = notifications.filter(n => !n.read).length;
            
            if (unreadCount > 0) {
                this.notificationCount.textContent = unreadCount;
                this.notificationCount.style.display = 'block';
            } else {
                this.notificationCount.style.display = 'none';
            }
        } catch (error) {
            console.error('Error al actualizar contador de notificaciones:', error);
        }
    }

    async showNotificationDetails(notificationId) {
        try {
            const notification = await this.db.getNotification(notificationId);
            if (!notification) return;

            const modal = document.createElement('div');
            modal.className = 'notification-modal';
            modal.innerHTML = `
                <div class="notification-modal-content">
                    <div class="notification-modal-header">
                        <h3>${notification.title}</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="notification-modal-body">
                        <p class="notification-message">${notification.message}</p>
                        ${notification.details ? `
                            <div class="notification-details">
                                <h4>Detalles</h4>
                                <p>${notification.details}</p>
                            </div>
                        ` : ''}
                        ${notification.solution ? `
                            <div class="notification-solution">
                                <h4>Solución</h4>
                                <p>${notification.solution}</p>
                            </div>
                        ` : ''}
                        ${notification.errors ? `
                            <div class="notification-errors">
                                <h4>Errores</h4>
                                <pre>${notification.errors}</pre>
                            </div>
                        ` : ''}
                        <div class="notification-meta">
                            <span>${this.formatDate(notification.timestamp)}</span>
                            <span>Tipo: ${notification.type}</span>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Cerrar modal al hacer clic en el botón de cerrar o fuera del contenido
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.remove();
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        } catch (error) {
            console.error('Error al mostrar detalles de la notificación:', error);
        }
    }

    async markAsRead(notificationId) {
        try {
            await this.db.updateNotification(notificationId, { read: true });
            this.updateNotificationCount();
            this.renderNotifications();
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
        }
    }

    async markAllAsRead() {
        try {
            const notifications = await this.db.getNotifications();
            const unreadNotifications = notifications.filter(n => !n.read);
            
            for (const notification of unreadNotifications) {
                await this.db.updateNotification(notification.id, { read: true });
            }
            
            this.updateNotificationCount();
            this.renderNotifications();
        } catch (error) {
            console.error('Error al marcar todas las notificaciones como leídas:', error);
        }
    }

    async clearAllNotifications() {
        try {
            await this.db.clearNotifications();
            this.renderNotifications();
            this.updateNotificationCount();
        } catch (error) {
            console.error('Error al limpiar notificaciones:', error);
        }
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Inicializar el sistema de notificaciones
const notificationButton = new NotificationButton(); 