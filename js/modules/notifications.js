// Módulo de notificaciones
export class Notifications {
    constructor() {
        this.notifications = [];
        this.notificationBell = document.getElementById('notificationBell');
        this.notificationDropdown = document.getElementById('notificationDropdown');
        this.notificationList = document.getElementById('notificationList');
        this.notificationCount = document.getElementById('notificationCount');
        this.clearNotificationsBtn = document.getElementById('clearNotifications');
    }

    // Agregar notificación
    addNotification(title, message, type = 'info') {
        const notification = {
            id: Date.now(),
            title,
            message,
            type,
            timestamp: new Date(),
            read: false
        };

        this.notifications.unshift(notification);
        this.updateNotificationBadge();
        this.renderNotifications();
        this.saveNotifications();
    }

    // Actualizar contador de notificaciones
    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        this.notificationCount.textContent = unreadCount;
        this.notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    // Renderizar notificaciones
    renderNotifications() {
        this.notificationList.innerHTML = '';
        this.notifications.forEach(notification => {
            const li = document.createElement('li');
            li.className = `notification-item ${notification.read ? 'read' : ''}`;
            li.innerHTML = `
                <div class="notification-icon">
                    <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatNotificationTime(notification.timestamp)}</div>
                </div>
            `;
            li.addEventListener('click', () => this.markNotificationAsRead(notification.id));
            this.notificationList.appendChild(li);
        });
    }

    // Obtener icono de notificación
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // Formatear tiempo de notificación
    formatNotificationTime(timestamp) {
        const now = new Date();
        const diff = now - new Date(timestamp);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        return 'ahora mismo';
    }

    // Marcar notificación como leída
    markNotificationAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.updateNotificationBadge();
            this.renderNotifications();
            this.saveNotifications();
        }
    }

    // Limpiar notificaciones
    clearNotifications() {
        this.notifications = [];
        this.updateNotificationBadge();
        this.renderNotifications();
        this.saveNotifications();
    }

    // Guardar notificaciones
    saveNotifications() {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }

    // Cargar notificaciones
    loadNotifications() {
        const saved = localStorage.getItem('notifications');
        if (saved) {
            this.notifications = JSON.parse(saved);
            this.updateNotificationBadge();
            this.renderNotifications();
        }
    }

    // Inicialización
    init() {
        this.loadNotifications();

        this.notificationBell.addEventListener('click', () => {
            this.notificationDropdown.classList.toggle('show');
        });

        this.clearNotificationsBtn.addEventListener('click', () => {
            this.clearNotifications();
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!this.notificationBell.contains(e.target) && 
                !this.notificationDropdown.contains(e.target)) {
                this.notificationDropdown.classList.remove('show');
            }
        });
    }
} 