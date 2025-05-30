import { db } from '../../database.js';
import { showToast } from '../utils/ui.js';
import { formatDate, formatRelativeTime } from '../utils/formatters.js';

export class NotificationManager {
    constructor() {
        this.notifications = JSON.parse(localStorage.getItem('notifications')) || [];
        this.notificationBell = document.getElementById('notificationBell');
        this.notificationDropdown = document.getElementById('notificationDropdown');
        this.notificationList = document.getElementById('notificationList');
        this.notificationCount = document.getElementById('notificationCount');
        this.clearNotificationsBtn = document.getElementById('clearNotifications');
        
        this.initializeEventListeners();
        this.updateNotificationCount();
        this.renderNotifications();
        this.checkContractExpirations();
        this.notificationTypes = {
            CONTRACT_EXPIRY: 'expiry',
            AMOUNT_CHANGE: 'warning',
            HES_MODIFICATION: 'info',
            EXTENSION_ALERT: 'warning',
            EREGATION_ALERT: 'error'
        };
    }

    initializeEventListeners() {
        // Toggle del dropdown de notificaciones
        this.notificationBell.addEventListener('click', () => {
            this.notificationDropdown.classList.toggle('show');
        });

        // Cerrar el dropdown al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!this.notificationBell.contains(e.target) && 
                !this.notificationDropdown.contains(e.target)) {
                this.notificationDropdown.classList.remove('show');
            }
        });

        // Limpiar todas las notificaciones
        this.clearNotificationsBtn.addEventListener('click', () => {
            this.clearAllNotifications();
        });
    }

    addNotification(notification) {
        const newNotification = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };

        this.notifications.unshift(newNotification);
        this.saveNotifications();
        this.updateNotificationCount();
        this.renderNotifications();
        this.showToast(notification);
    }

    removeNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.saveNotifications();
        this.updateNotificationCount();
        this.renderNotifications();
    }

    clearAllNotifications() {
        this.notifications = [];
        this.saveNotifications();
        this.updateNotificationCount();
        this.renderNotifications();
        this.showToast({
            type: 'info',
            title: 'Notificaciones Limpiadas',
            message: 'Todas las notificaciones han sido eliminadas.'
        });
    }

    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.updateNotificationCount();
            this.renderNotifications();
        }
    }

    updateNotificationCount() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            this.notificationCount.textContent = unreadCount;
            this.notificationCount.style.display = 'block';
        } else {
            this.notificationCount.style.display = 'none';
        }
    }

    renderNotifications() {
        if (this.notifications.length === 0) {
            this.notificationList.innerHTML = `
                <li class="empty-notifications">
                    <i class="fas fa-bell-slash me-2"></i>
                    No hay notificaciones
                </li>
            `;
            return;
        }

        this.notificationList.innerHTML = this.notifications.map(notification => `
            <li data-type="${notification.type}" ${notification.read ? 'class="read"' : ''}>
                <div class="notification-icon">
                    <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    ${notification.details ? `
                        <div class="notification-details">
                            <p>${notification.details}</p>
                            ${notification.solution ? `
                                <div class="solution">
                                    <h6>Solución:</h6>
                                    <p>${notification.solution}</p>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
                </div>
            </li>
        `).join('');

        // Agregar event listeners para expandir/colapsar detalles
        this.notificationList.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                const details = li.querySelector('.notification-details');
                if (details) {
                    details.classList.toggle('show');
                }
                if (!li.classList.contains('read')) {
                    this.markAsRead(parseInt(li.dataset.id));
                }
            });
        });
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        return icons[type] || 'fa-bell';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // menos de 1 minuto
            return 'Ahora mismo';
        } else if (diff < 3600000) { // menos de 1 hora
            const minutes = Math.floor(diff / 60000);
            return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
        } else if (diff < 86400000) { // menos de 1 día
            const hours = Math.floor(diff / 3600000);
            return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
        } else {
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    showToast(notification) {
        const toast = document.createElement('div');
        toast.className = `toast ${notification.type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                <div class="toast-message">
                    <strong>${notification.title}</strong>
                    <p>${notification.message}</p>
                </div>
            </div>
        `;

        const container = document.getElementById('toast-container');
        container.appendChild(toast);

        // Mostrar el toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Ocultar y eliminar el toast después de 5 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    saveNotifications() {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }

    checkContractExpirations() {
        // Verificar contratos que están por vencer
        const contracts = JSON.parse(localStorage.getItem('contracts') || '[]');
        const today = new Date();
        
        contracts.forEach(contract => {
            const endDate = new Date(contract.fechaTerminacion);
            const daysUntilExpiration = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
                this.addNotification({
                    type: 'warning',
                    title: 'Contrato por Vencer',
                    message: `El contrato ${contract.numeroSicac} vencerá en ${daysUntilExpiration} días.`
                });
            }
        });
    }

    // Métodos para diferentes tipos de notificaciones
    notifyError(title, message) {
        this.addNotification({
            type: 'error',
            title,
            message
        });
    }

    notifyWarning(title, message) {
        this.addNotification({
            type: 'warning',
            title,
            message
        });
    }

    notifySuccess(title, message) {
        this.addNotification({
            type: 'success',
            title,
            message
        });
    }

    notifyInfo(title, message) {
        this.addNotification({
            type: 'info',
            title,
            message
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
        const badge = document.getElementById('notificationCount');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    updateNotificationPanel(notifications) {
        const list = document.getElementById('notificationList');
        if (!list) return;

        if (notifications.length === 0) {
            list.innerHTML = `
                <li class="notification-item notification-info">
                    <div class="notification-content">
                        <div class="notification-message">No hay notificaciones nuevas</div>
                    </div>
                </li>`;
            return;
        }

        list.innerHTML = notifications.map(notification => `
            <li class="notification-item notification-${notification.type}" data-id="${notification.id}">
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
            </li>
        `).join('');

        this.initializeNotificationActions();
    }

    initializeNotificationActions() {
        const list = document.getElementById('notificationList');
        if (!list) return;

        list.querySelectorAll('.btn-mark-read').forEach(button => {
            button.addEventListener('click', async (event) => {
                const notificationItem = event.target.closest('.notification-item');
                const notificationId = parseInt(notificationItem.dataset.id);
                await this.markAsRead(notificationId);
            });
        });

        list.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', async (event) => {
                const notificationItem = event.target.closest('.notification-item');
                const notificationId = parseInt(notificationItem.dataset.id);
                await this.deleteNotification(notificationId);
            });
        });
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
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            const isVisible = dropdown.classList.contains('show');
            if (!isVisible) {
                // Cerrar otros dropdowns si existen
                document.querySelectorAll('.dropdown.show').forEach(d => {
                    if (d !== dropdown) d.classList.remove('show');
                });
            }
            dropdown.classList.toggle('show');
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
            
            // Mostrar toast para notificaciones importantes
            if (type === 'error' || type === 'warning' || type === 'expiry') {
                showToast(notification);
            }
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

    // Nuevos métodos para tipos específicos de notificaciones
    async notifyContractExpiry(contractId, daysLeft) {
        await this.createNotification(
            'Vencimiento de Contrato',
            `El contrato ${contractId} vencerá en ${daysLeft} días`,
            this.notificationTypes.CONTRACT_EXPIRY
        );
    }

    async notifyAmountChange(contractId, oldAmount, newAmount) {
        await this.createNotification(
            'Cambio en Monto de Contrato',
            `El monto del contrato ${contractId} ha cambiado de ${oldAmount} a ${newAmount}`,
            this.notificationTypes.AMOUNT_CHANGE
        );
    }

    async notifyHESModification(hesId, contractId) {
        await this.createNotification(
            'Modificación de HES',
            `Se ha modificado la HES ${hesId} del contrato ${contractId}`,
            this.notificationTypes.HES_MODIFICATION
        );
    }

    async notifyExtensionAlert(contractId, extensionDays) {
        await this.createNotification(
            'Extensión de Contrato',
            `El contrato ${contractId} ha sido extendido por ${extensionDays} días`,
            this.notificationTypes.EXTENSION_ALERT
        );
    }

    async notifyEregationAlert(contractId, amount) {
        await this.createNotification(
            'Eregación de Contrato',
            `Se ha realizado una eregación de ${amount} en el contrato ${contractId}`,
            this.notificationTypes.EREGATION_ALERT
        );
    }
}

export default new NotificationManager(); 