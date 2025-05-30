import { db } from '../../database.js';
import { showToast } from '../utils/ui.js';
import { formatDate, formatRelativeTime } from '../utils/formatters.js';

export class NotificationManager {
    constructor() {
        this.initializeEventListeners();
        this.checkNotifications();
    }

    initializeEventListeners() {
        const notificationBell = document.getElementById('notification-bell');
        if (notificationBell) {
            notificationBell.addEventListener('click', this.toggleNotificationPanel.bind(this));
        }

        document.addEventListener('click', (event) => {
            const notificationPanel = document.getElementById('notification-panel');
            const notificationBell = document.getElementById('notification-bell');
            if (notificationPanel && 
                !notificationPanel.contains(event.target) && 
                !notificationBell.contains(event.target)) {
                notificationPanel.style.display = 'none';
            }
        });
    }

    async checkNotifications() {
        try {
            const notifications = await db.notifications
                .where('read')
                .equals(false)
                .toArray();

            this.updateNotificationBadge(notifications.length);
            this.updateNotificationPanel(notifications);
        } catch (error) {
            console.error('Error al verificar notificaciones:', error);
        }
    }

    updateNotificationBadge(count) {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    updateNotificationPanel(notifications) {
        const panel = document.getElementById('notification-panel');
        if (!panel) return;

        const content = document.getElementById('notification-content');
        if (!content) return;

        if (notifications.length === 0) {
            content.innerHTML = '<div class="no-notifications">No hay notificaciones nuevas</div>';
            return;
        }

        content.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" 
                 data-id="${notification.id}">
                <div class="notification-icon">
                    <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${formatRelativeTime(notification.timestamp)}</div>
                </div>
                <div class="notification-actions">
                    <button class="btn-mark-read" title="Marcar como leída">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-delete" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.initializeNotificationActions();
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'fa-info-circle',
            'warning': 'fa-exclamation-triangle',
            'error': 'fa-times-circle',
            'success': 'fa-check-circle',
            'contract': 'fa-file-contract',
            'payment': 'fa-money-bill-wave',
            'document': 'fa-file-alt',
            'system': 'fa-cog'
        };
        return icons[type] || 'fa-bell';
    }

    initializeNotificationActions() {
        const content = document.getElementById('notification-content');
        if (!content) return;

        content.querySelectorAll('.btn-mark-read').forEach(button => {
            button.addEventListener('click', async (event) => {
                const notificationItem = event.target.closest('.notification-item');
                const notificationId = parseInt(notificationItem.dataset.id);
                await this.markAsRead(notificationId);
            });
        });

        content.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', async (event) => {
                const notificationItem = event.target.closest('.notification-item');
                const notificationId = parseInt(notificationItem.dataset.id);
                await this.deleteNotification(notificationId);
            });
        });
    }

    async markAsRead(notificationId) {
        try {
            await db.notifications.update(notificationId, { read: true });
            await this.checkNotifications();
            showToast('Notificación marcada como leída', 'success');
        } catch (error) {
            showToast('Error al marcar la notificación como leída', 'error');
        }
    }

    async deleteNotification(notificationId) {
        try {
            await db.notifications.delete(notificationId);
            await this.checkNotifications();
            showToast('Notificación eliminada', 'success');
        } catch (error) {
            showToast('Error al eliminar la notificación', 'error');
        }
    }

    toggleNotificationPanel() {
        const panel = document.getElementById('notification-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    async createNotification(title, message, type = 'info') {
        try {
            const notification = {
                title,
                message,
                type,
                read: false,
                timestamp: new Date()
            };

            await db.notifications.add(notification);
            await this.checkNotifications();
        } catch (error) {
            console.error('Error al crear notificación:', error);
        }
    }

    async markAllAsRead() {
        try {
            await db.notifications
                .where('read')
                .equals(false)
                .modify({ read: true });
            
            await this.checkNotifications();
            showToast('Todas las notificaciones marcadas como leídas', 'success');
        } catch (error) {
            showToast('Error al marcar todas las notificaciones como leídas', 'error');
        }
    }

    async deleteAllNotifications() {
        try {
            await db.notifications.clear();
            await this.checkNotifications();
            showToast('Todas las notificaciones eliminadas', 'success');
        } catch (error) {
            showToast('Error al eliminar todas las notificaciones', 'error');
        }
    }
}

export default new NotificationManager(); 