// Módulo de utilidades de notificaciones
export class Notifications {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.init();
    }

    // Inicializar
    init() {
        try {
            // Crear contenedor
            this.container = document.createElement('div');
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);

            // Estilos
            const style = document.createElement('style');
            style.textContent = `
                .notifications-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .notification {
                    min-width: 300px;
                    max-width: 400px;
                    padding: 15px;
                    border-radius: 4px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    animation: slideIn 0.3s ease-out;
                    position: relative;
                    overflow: hidden;
                }

                .notification.success {
                    background-color: #4caf50;
                    color: white;
                }

                .notification.error {
                    background-color: #f44336;
                    color: white;
                }

                .notification.warning {
                    background-color: #ff9800;
                    color: white;
                }

                .notification.info {
                    background-color: #2196f3;
                    color: white;
                }

                .notification .icon {
                    font-size: 20px;
                }

                .notification .content {
                    flex: 1;
                }

                .notification .title {
                    font-weight: bold;
                    margin-bottom: 5px;
                }

                .notification .message {
                    font-size: 14px;
                }

                .notification .close {
                    cursor: pointer;
                    padding: 5px;
                    font-size: 16px;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }

                .notification .close:hover {
                    opacity: 1;
                }

                .notification .progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background-color: rgba(255, 255, 255, 0.3);
                    animation: progress 5s linear;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }

                @keyframes progress {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
            `;
            document.head.appendChild(style);
        } catch (error) {
            console.error('Error al inicializar notificaciones:', error);
        }
    }

    // Mostrar notificación
    show(type, title, message, duration = 5000) {
        try {
            // Crear notificación
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;

            // Icono
            const icon = document.createElement('span');
            icon.className = 'icon';
            icon.innerHTML = this.getIcon(type);
            notification.appendChild(icon);

            // Contenido
            const content = document.createElement('div');
            content.className = 'content';

            const titleElement = document.createElement('div');
            titleElement.className = 'title';
            titleElement.textContent = title;
            content.appendChild(titleElement);

            if (message) {
                const messageElement = document.createElement('div');
                messageElement.className = 'message';
                messageElement.textContent = message;
                content.appendChild(messageElement);
            }

            notification.appendChild(content);

            // Cerrar
            const close = document.createElement('span');
            close.className = 'close';
            close.innerHTML = '×';
            close.onclick = () => this.close(notification);
            notification.appendChild(close);

            // Progreso
            const progress = document.createElement('div');
            progress.className = 'progress';
            notification.appendChild(progress);

            // Agregar al contenedor
            this.container.appendChild(notification);
            this.notifications.push(notification);

            // Auto cerrar
            if (duration > 0) {
                setTimeout(() => {
                    this.close(notification);
                }, duration);
            }

            return notification;
        } catch (error) {
            console.error('Error al mostrar notificación:', error);
            return null;
        }
    }

    // Cerrar notificación
    close(notification) {
        try {
            if (!notification) {
                return;
            }

            // Animación de salida
            notification.style.animation = 'slideOut 0.3s ease-out forwards';

            // Eliminar después de la animación
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications = this.notifications.filter(n => n !== notification);
            }, 300);
        } catch (error) {
            console.error('Error al cerrar notificación:', error);
        }
    }

    // Cerrar todas las notificaciones
    closeAll() {
        try {
            this.notifications.forEach(notification => {
                this.close(notification);
            });
        } catch (error) {
            console.error('Error al cerrar todas las notificaciones:', error);
        }
    }

    // Obtener icono
    getIcon(type) {
        try {
            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ'
            };
            return icons[type] || icons.info;
        } catch (error) {
            console.error('Error al obtener icono:', error);
            return 'ℹ';
        }
    }

    // Notificación de éxito
    success(message, title = 'Éxito') {
        return this.show('success', title, message);
    }

    // Notificación de error
    error(message, title = 'Error') {
        return this.show('error', title, message);
    }

    // Notificación de advertencia
    warning(message, title = 'Advertencia') {
        return this.show('warning', title, message);
    }

    // Notificación de información
    info(message, title = 'Información') {
        return this.show('info', title, message);
    }

    // Notificación de confirmación
    confirm(message, onConfirm, onCancel) {
        try {
            const notification = document.createElement('div');
            notification.className = 'notification confirm';
            notification.style.backgroundColor = '#fff';
            notification.style.color = '#333';

            // Contenido
            const content = document.createElement('div');
            content.className = 'content';

            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.textContent = message;
            content.appendChild(messageElement);

            // Botones
            const buttons = document.createElement('div');
            buttons.className = 'buttons';
            buttons.style.display = 'flex';
            buttons.style.gap = '10px';
            buttons.style.marginTop = '10px';

            const confirmButton = document.createElement('button');
            confirmButton.textContent = 'Confirmar';
            confirmButton.style.padding = '5px 10px';
            confirmButton.style.backgroundColor = '#4caf50';
            confirmButton.style.color = 'white';
            confirmButton.style.border = 'none';
            confirmButton.style.borderRadius = '4px';
            confirmButton.style.cursor = 'pointer';
            confirmButton.onclick = () => {
                this.close(notification);
                if (onConfirm) onConfirm();
            };
            buttons.appendChild(confirmButton);

            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancelar';
            cancelButton.style.padding = '5px 10px';
            cancelButton.style.backgroundColor = '#f44336';
            cancelButton.style.color = 'white';
            cancelButton.style.border = 'none';
            cancelButton.style.borderRadius = '4px';
            cancelButton.style.cursor = 'pointer';
            cancelButton.onclick = () => {
                this.close(notification);
                if (onCancel) onCancel();
            };
            buttons.appendChild(cancelButton);

            content.appendChild(buttons);
            notification.appendChild(content);

            // Agregar al contenedor
            this.container.appendChild(notification);
            this.notifications.push(notification);

            return notification;
        } catch (error) {
            console.error('Error al mostrar confirmación:', error);
            return null;
        }
    }

    // Notificación de carga
    loading(message = 'Cargando...') {
        try {
            const notification = document.createElement('div');
            notification.className = 'notification loading';
            notification.style.backgroundColor = '#fff';
            notification.style.color = '#333';

            // Spinner
            const spinner = document.createElement('div');
            spinner.className = 'spinner';
            spinner.style.width = '20px';
            spinner.style.height = '20px';
            spinner.style.border = '3px solid #f3f3f3';
            spinner.style.borderTop = '3px solid #3498db';
            spinner.style.borderRadius = '50%';
            spinner.style.animation = 'spin 1s linear infinite';
            notification.appendChild(spinner);

            // Contenido
            const content = document.createElement('div');
            content.className = 'content';

            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.textContent = message;
            content.appendChild(messageElement);

            notification.appendChild(content);

            // Estilos adicionales
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);

            // Agregar al contenedor
            this.container.appendChild(notification);
            this.notifications.push(notification);

            return notification;
        } catch (error) {
            console.error('Error al mostrar carga:', error);
            return null;
        }
    }

    // Notificación de progreso
    progress(message, value = 0) {
        try {
            const notification = document.createElement('div');
            notification.className = 'notification progress';
            notification.style.backgroundColor = '#fff';
            notification.style.color = '#333';

            // Contenido
            const content = document.createElement('div');
            content.className = 'content';

            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.textContent = message;
            content.appendChild(messageElement);

            // Barra de progreso
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            progressBar.style.width = '100%';
            progressBar.style.height = '5px';
            progressBar.style.backgroundColor = '#f3f3f3';
            progressBar.style.borderRadius = '2px';
            progressBar.style.marginTop = '10px';
            progressBar.style.overflow = 'hidden';

            const progressFill = document.createElement('div');
            progressFill.className = 'progress-fill';
            progressFill.style.width = `${value}%`;
            progressFill.style.height = '100%';
            progressFill.style.backgroundColor = '#3498db';
            progressFill.style.transition = 'width 0.3s ease-out';

            progressBar.appendChild(progressFill);
            content.appendChild(progressBar);

            notification.appendChild(content);

            // Agregar al contenedor
            this.container.appendChild(notification);
            this.notifications.push(notification);

            // Método para actualizar progreso
            notification.updateProgress = (newValue) => {
                progressFill.style.width = `${newValue}%`;
            };

            return notification;
        } catch (error) {
            console.error('Error al mostrar progreso:', error);
            return null;
        }
    }

    // Notificación de toast
    toast(message, type = 'info', duration = 3000) {
        try {
            const toast = document.createElement('div');
            toast.className = `notification toast ${type}`;
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.minWidth = 'auto';
            toast.style.maxWidth = 'none';
            toast.style.padding = '10px 20px';
            toast.style.borderRadius = '20px';
            toast.style.textAlign = 'center';
            toast.style.zIndex = '10000';

            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.textContent = message;
            toast.appendChild(messageElement);

            // Agregar al contenedor
            this.container.appendChild(toast);
            this.notifications.push(toast);

            // Auto cerrar
            if (duration > 0) {
                setTimeout(() => {
                    this.close(toast);
                }, duration);
            }

            return toast;
        } catch (error) {
            console.error('Error al mostrar toast:', error);
            return null;
        }
    }

    // Notificación de alerta
    alert(message, type = 'info', onClose) {
        try {
            const alert = document.createElement('div');
            alert.className = `notification alert ${type}`;
            alert.style.position = 'fixed';
            alert.style.top = '50%';
            alert.style.left = '50%';
            alert.style.transform = 'translate(-50%, -50%)';
            alert.style.minWidth = '300px';
            alert.style.maxWidth = '500px';
            alert.style.padding = '20px';
            alert.style.borderRadius = '8px';
            alert.style.textAlign = 'center';
            alert.style.zIndex = '10000';
            alert.style.backgroundColor = '#fff';
            alert.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

            // Icono
            const icon = document.createElement('div');
            icon.className = 'icon';
            icon.innerHTML = this.getIcon(type);
            icon.style.fontSize = '32px';
            icon.style.marginBottom = '10px';
            alert.appendChild(icon);

            // Mensaje
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.textContent = message;
            messageElement.style.marginBottom = '20px';
            alert.appendChild(messageElement);

            // Botón
            const button = document.createElement('button');
            button.textContent = 'Aceptar';
            button.style.padding = '8px 20px';
            button.style.backgroundColor = '#3498db';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '4px';
            button.style.cursor = 'pointer';
            button.onclick = () => {
                this.close(alert);
                if (onClose) onClose();
            };
            alert.appendChild(button);

            // Agregar al contenedor
            this.container.appendChild(alert);
            this.notifications.push(alert);

            return alert;
        } catch (error) {
            console.error('Error al mostrar alerta:', error);
            return null;
        }
    }

    // Notificación de modal
    modal(options) {
        try {
            const {
                title,
                content,
                buttons = [],
                width = '500px',
                height = 'auto',
                onClose
            } = options;

            const modal = document.createElement('div');
            modal.className = 'notification modal';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.zIndex = '10000';

            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            modalContent.style.backgroundColor = '#fff';
            modalContent.style.borderRadius = '8px';
            modalContent.style.width = width;
            modalContent.style.height = height;
            modalContent.style.padding = '20px';
            modalContent.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

            // Título
            if (title) {
                const titleElement = document.createElement('div');
                titleElement.className = 'modal-title';
                titleElement.textContent = title;
                titleElement.style.fontSize = '20px';
                titleElement.style.fontWeight = 'bold';
                titleElement.style.marginBottom = '20px';
                modalContent.appendChild(titleElement);
            }

            // Contenido
            if (content) {
                const contentElement = document.createElement('div');
                contentElement.className = 'modal-content';
                contentElement.innerHTML = content;
                contentElement.style.marginBottom = '20px';
                modalContent.appendChild(contentElement);
            }

            // Botones
            if (buttons.length > 0) {
                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'modal-buttons';
                buttonsContainer.style.display = 'flex';
                buttonsContainer.style.justifyContent = 'flex-end';
                buttonsContainer.style.gap = '10px';

                buttons.forEach(button => {
                    const buttonElement = document.createElement('button');
                    buttonElement.textContent = button.text;
                    buttonElement.style.padding = '8px 20px';
                    buttonElement.style.backgroundColor = button.color || '#3498db';
                    buttonElement.style.color = 'white';
                    buttonElement.style.border = 'none';
                    buttonElement.style.borderRadius = '4px';
                    buttonElement.style.cursor = 'pointer';
                    buttonElement.onclick = () => {
                        this.close(modal);
                        if (button.onClick) button.onClick();
                    };
                    buttonsContainer.appendChild(buttonElement);
                });

                modalContent.appendChild(buttonsContainer);
            }

            modal.appendChild(modalContent);
            this.container.appendChild(modal);
            this.notifications.push(modal);

            // Cerrar al hacer clic fuera
            modal.onclick = (event) => {
                if (event.target === modal) {
                    this.close(modal);
                    if (onClose) onClose();
                }
            };

            return modal;
        } catch (error) {
            console.error('Error al mostrar modal:', error);
            return null;
        }
    }
} 