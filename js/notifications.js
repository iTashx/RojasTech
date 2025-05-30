// Sistema centralizado de notificaciones
class NotificationCenter {
    constructor() {
        this.maxMessages = 15;
        this.notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.dropdown = document.getElementById('notificationDropdown');
        this.bell = document.getElementById('notificationBell');
        this.countSpan = document.getElementById('notificationCount');
        this.list = document.getElementById('notificationList');
        this.clearBtn = document.getElementById('clearNotifications');
        this.init();
    }
    init() {
        this.render();
        this.bell.addEventListener('click', () => this.openDropdown());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        document.addEventListener('click', (e) => {
            if (!this.dropdown.contains(e.target) && e.target !== this.bell) {
                this.dropdown.style.display = 'none';
            }
        });
    }
    add(type, message, details = null) {
        const notif = {
            id: Date.now(),
            type,
            message,
            date: new Date().toLocaleString(),
            read: false,
            details
        };
        this.notifications.unshift(notif);
        if (this.notifications.length > this.maxMessages) this.notifications.pop();
        this.save();
        this.render();
    }
    render() {
        this.list.innerHTML = '';
        let unread = 0;
        this.notifications.forEach(n => {
            if (!n.read) unread++;
            const li = document.createElement('li');
            li.className = 'notification-item' + (n.read ? '' : ' unread');
            li.innerHTML = `<span class="notif-type notif-${n.type}"></span> <span>${n.message}</span><br><small>${n.date}</small>`;
            li.onclick = () => { 
                n.read = true; this.save(); this.render(); 
                window.showNotificationDetail && window.showNotificationDetail(n);
            };
            this.list.appendChild(li);
        });
        this.unreadCount = unread;
        this.countSpan.textContent = unread;
        this.countSpan.style.display = unread > 0 ? 'inline-block' : 'none';
    }
    openDropdown() {
        this.dropdown.style.display = 'block';
        this.notifications.forEach(n => n.read = true);
        this.save();
        this.render();
        if (this.notifications.length === 0) {
            this.list.innerHTML = '<li class="notification-item">No hay notificaciones</li>';
        }
    }
    clearAll() {
        this.notifications = [];
        this.save();
        this.render();
    }
    save() {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }
}

window.notificationCenter = new NotificationCenter();

// Ejemplo de integración: notificar acciones del sistema
window.notifyAction = function(type, message, details = null) {
    window.notificationCenter.add(type, message, details);
}
// Uso: window.notifyAction('success', 'Contrato guardado correctamente'); 

window.showNotificationDetail = function(n) {
    const modal = new bootstrap.Modal(document.getElementById('notificationDetailModal'));
    const iconMap = {
        success: '<i class="fas fa-check-circle text-success"></i>',
        error: '<i class="fas fa-times-circle text-danger"></i>',
        warning: '<i class="fas fa-exclamation-triangle text-warning"></i>',
        info: '<i class="fas fa-info-circle text-info"></i>'
    };
    document.getElementById('notif-detail-icon').innerHTML = iconMap[n.type] || '';
    document.getElementById('notif-detail-title').textContent = n.type.charAt(0).toUpperCase() + n.type.slice(1);
    document.getElementById('notif-detail-date').textContent = n.date;
    document.getElementById('notif-detail-message').textContent = n.message;
    const extra = document.getElementById('notif-detail-extra');
    if (n.type === 'error' && n.details) {
        extra.textContent = n.details;
        extra.classList.remove('d-none');
    } else {
        extra.textContent = '';
        extra.classList.add('d-none');
    }
    modal.show();
} 