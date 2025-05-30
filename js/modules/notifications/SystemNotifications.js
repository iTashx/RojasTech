/**
 * Módulo para manejar notificaciones del sistema
 */
class SystemNotifications {
    constructor(notificationManager) {
        this.notificationManager = notificationManager;
        this.notifications = [];
        this.container = null;
        this.initialized = false;
        this.initializeSystemNotifications();
    }

    /**
     * Inicializa el sistema de notificaciones
     * @param {string} containerId - ID del contenedor de notificaciones
     */
    init(containerId) {
        if (this.initialized) {
            console.warn('SystemNotifications ya está inicializado');
            return;
        }

        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Contenedor ${containerId} no encontrado`);
            return;
        }

        // Crear estructura HTML
        this.container.innerHTML = `
            <div class="notifications-header">
                <h3>Notificaciones del Sistema</h3>
                <div class="notifications-filters">
                    <button class="filter-btn active" data-filter="all">Todas</button>
                    <button class="filter-btn" data-filter="error">Errores</button>
                    <button class="filter-btn" data-filter="warning">Advertencias</button>
                    <button class="filter-btn" data-filter="info">Información</button>
                </div>
            </div>
            <div class="notifications-list"></div>
        `;

        // Inicializar event listeners
        this.initEventListeners();
        this.initialized = true;
    }

    /**
     * Inicializa los event listeners
     */
    initEventListeners() {
        // Filtros
        const filterButtons = this.container.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterNotifications(btn.dataset.filter);
            });
        });
    }

    /**
     * Agrega una nueva notificación
     * @param {Object} notification - Datos de la notificación
     */
    addNotification(notification) {
        const {
            type = 'info',
            title,
            message,
            details = '',
            timestamp = new Date(),
            module = 'Sistema',
            solution = '',
            read = false
        } = notification;

        const notificationObj = {
            id: Date.now(),
            type,
            title,
            message,
            details,
            timestamp,
            module,
            solution,
            read
        };

        this.notifications.unshift(notificationObj);
        this.renderNotification(notificationObj);
        this.updateCounter();
    }

    /**
     * Renderiza una notificación en el DOM
     * @param {Object} notification - Datos de la notificación
     */
    renderNotification(notification) {
        const list = this.container.querySelector('.notifications-list');
        const element = document.createElement('div');
        element.className = `notification-item ${notification.type} ${notification.read ? 'read' : ''}`;
        element.dataset.id = notification.id;

        element.innerHTML = `
            <div class="notification-header">
                <span class="notification-type">${this.getTypeIcon(notification.type)}</span>
                <span class="notification-title">${notification.title}</span>
                <span class="notification-time">${this.formatTime(notification.timestamp)}</span>
            </div>
            <div class="notification-content">
                <p class="notification-message">${notification.message}</p>
                <div class="notification-details" style="display: none;">
                    <p><strong>Módulo:</strong> ${notification.module}</p>
                    ${notification.details ? `<p><strong>Detalles:</strong> ${notification.details}</p>` : ''}
                    ${notification.solution ? `<p><strong>Solución:</strong> ${notification.solution}</p>` : ''}
                </div>
            </div>
            <div class="notification-actions">
                <button class="btn-details">Ver detalles</button>
                <button class="btn-mark-read" ${notification.read ? 'disabled' : ''}>
                    ${notification.read ? 'Leído' : 'Marcar como leído'}
                </button>
            </div>
        `;

        // Event listeners
        element.querySelector('.btn-details').addEventListener('click', () => {
            const details = element.querySelector('.notification-details');
            details.style.display = details.style.display === 'none' ? 'block' : 'none';
        });

        element.querySelector('.btn-mark-read').addEventListener('click', () => {
            this.markAsRead(notification.id);
        });

        list.insertBefore(element, list.firstChild);
    }

    /**
     * Marca una notificación como leída
     * @param {number} id - ID de la notificación
     */
    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            const element = this.container.querySelector(`[data-id="${id}"]`);
            if (element) {
                element.classList.add('read');
                element.querySelector('.btn-mark-read').disabled = true;
                element.querySelector('.btn-mark-read').textContent = 'Leído';
            }
            this.updateCounter();
        }
    }

    /**
     * Filtra las notificaciones
     * @param {string} filter - Tipo de filtro
     */
    filterNotifications(filter) {
        const list = this.container.querySelector('.notifications-list');
        const items = list.querySelectorAll('.notification-item');

        items.forEach(item => {
            if (filter === 'all' || item.classList.contains(filter)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    /**
     * Actualiza el contador de notificaciones
     */
    updateCounter() {
        const unread = this.notifications.filter(n => !n.read).length;
        const counter = document.querySelector('.notifications-counter');
        if (counter) {
            counter.textContent = unread;
            counter.style.display = unread > 0 ? 'block' : 'none';
        }
    }

    /**
     * Obtiene el icono según el tipo de notificación
     * @param {string} type - Tipo de notificación
     * @returns {string} HTML del icono
     */
    getTypeIcon(type) {
        const icons = {
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    /**
     * Formatea la fecha y hora
     * @param {Date} date - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    formatTime(date) {
        return new Intl.DateTimeFormat('es', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    }

    /**
     * Limpia todas las notificaciones
     */
    clearAll() {
        this.notifications = [];
        const list = this.container.querySelector('.notifications-list');
        list.innerHTML = '';
        this.updateCounter();
    }

    initializeSystemNotifications() {
        // Notificar errores del sistema
        window.addEventListener('error', (event) => {
            this.notificationManager.notifyError(
                'Error del Sistema',
                `Se ha producido un error: ${event.message}`
            );
        });

        // Notificar errores de red
        window.addEventListener('offline', () => {
            this.notificationManager.notifyError(
                'Conexión Perdida',
                'Se ha perdido la conexión a internet. Algunas funciones pueden no estar disponibles.'
            );
        });

        window.addEventListener('online', () => {
            this.notificationManager.notifySuccess(
                'Conexión Restaurada',
                'La conexión a internet ha sido restaurada.'
            );
        });

        // Capturar errores de la consola
        const originalConsoleError = console.error;
        console.error = (...args) => {
            // Mantener la funcionalidad original
            originalConsoleError.apply(console, args);
            
            // Obtener el mensaje de error
            const errorMessage = args.map(arg => {
                if (arg instanceof Error) {
                    return arg.message;
                }
                return String(arg);
            }).join(' ');

            // Notificar el error
            this.notificationManager.notifyError(
                'Error de Consola',
                errorMessage
            );
        };

        // Capturar advertencias de la consola
        const originalConsoleWarn = console.warn;
        console.warn = (...args) => {
            // Mantener la funcionalidad original
            originalConsoleWarn.apply(console, args);
            
            // Obtener el mensaje de advertencia
            const warningMessage = args.map(arg => {
                if (arg instanceof Error) {
                    return arg.message;
                }
                return String(arg);
            }).join(' ');

            // Notificar la advertencia
            this.notificationManager.notifyWarning(
                'Advertencia',
                warningMessage
            );
        };

        // Capturar errores de red (fetch, XMLHttpRequest, etc.)
        window.addEventListener('unhandledrejection', (event) => {
            const error = event.reason;
            let errorMessage = 'Error en la operación';
            
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error && error.status) {
                errorMessage = `Error ${error.status}: ${error.statusText || 'Error en la solicitud'}`;
            }

            this.notificationManager.notifyError(
                'Error de Red',
                errorMessage
            );
        });

        // Notificar cambios en el almacenamiento
        window.addEventListener('storage', (event) => {
            if (event.key === 'contracts') {
                this.notificationManager.notifyInfo(
                    'Cambios en Contratos',
                    'Se han realizado cambios en los contratos.'
                );
            }
        });
    }

    // Notificar errores de validación
    notifyValidationError(field, message) {
        this.notificationManager.notifyError(
            'Error de Validación',
            `${field}: ${message}`
        );
    }

    // Notificar errores de guardado
    notifySaveError(entity, error) {
        this.notificationManager.notifyError(
            'Error al Guardar',
            `No se pudo guardar ${entity}: ${error}`
        );
    }

    // Notificar éxito en operaciones
    notifySuccess(entity, action) {
        this.notificationManager.notifySuccess(
            'Operación Exitosa',
            `${entity} ${action} correctamente.`
        );
    }

    // Notificar advertencias del sistema
    notifySystemWarning(message) {
        this.notificationManager.notifyWarning(
            'Advertencia del Sistema',
            message
        );
    }

    // Notificar información del sistema
    notifySystemInfo(message) {
        this.notificationManager.notifyInfo(
            'Información del Sistema',
            message
        );
    }

    // Notificar vencimiento de contratos
    notifyContractExpiration(contract) {
        const daysUntilExpiration = this.calculateDaysUntilExpiration(contract.fechaTerminacion);
        
        if (daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
            this.notificationManager.notifyWarning(
                'Contrato por Vencer',
                `El contrato ${contract.numeroSicac} vencerá en ${daysUntilExpiration} días.`
            );
        }
    }

    // Notificar cambios en el estado de contratos
    notifyContractStatusChange(contract, newStatus) {
        this.notificationManager.notifyInfo(
            'Cambio de Estado',
            `El contrato ${contract.numeroSicac} ha cambiado su estado a ${newStatus}.`
        );
    }

    // Notificar creación de HES
    notifyHESCreation(hes, contract) {
        this.notificationManager.notifySuccess(
            'Nueva HES Creada',
            `Se ha creado una nueva HES (${hes.numeroHES}) para el contrato ${contract.numeroSicac}.`
        );
    }

    // Notificar errores en cálculos
    notifyCalculationError(operation, error) {
        this.notificationManager.notifyError(
            'Error en Cálculo',
            `Error al realizar ${operation}: ${error}`
        );
    }

    // Método auxiliar para calcular días hasta vencimiento
    calculateDaysUntilExpiration(endDate) {
        const today = new Date();
        const end = new Date(endDate);
        return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    }
}

// Crear instancia global
const systemNotifications = new SystemNotifications(notificationManager);
export default systemNotifications; 