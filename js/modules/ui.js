// Módulo de UI
export class UI {
    constructor() {
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.sections = document.querySelectorAll('.content-section');
        this.documentationBtn = document.getElementById('documentationBtn');
        this.helpBtn = document.getElementById('helpBtn');
        this.toastContainer = document.getElementById('toast-container');
    }

    // Manejo de pestañas
    async changeTab(targetId) {
        this.sections.forEach(section => {
            section.classList.remove('active', 'show');
            section.style.display = 'none';
        });
        this.tabButtons.forEach(btn => btn.classList.remove('active'));

        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active', 'show');
            targetSection.style.display = 'block';
            document.querySelector(`[data-target="${targetId}"]`).classList.add('active');
        }
    }

    // Sistema de notificaciones toast
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;

        this.toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // Inicialización
    init() {
        // Event listeners para pestañas
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');
                this.changeTab(targetId);
            });
        });

        // Event listeners para botones de documentación y ayuda
        if (this.documentationBtn) {
            this.documentationBtn.addEventListener('click', () => {
                window.open('docs/documentacion.html', '_blank');
            });
        }

        if (this.helpBtn) {
            this.helpBtn.addEventListener('click', () => {
                window.open('ayuda.html', '_blank');
            });
        }

        // Activar primera pestaña por defecto
        const firstTab = document.querySelector('.tab-btn');
        if (firstTab) {
            firstTab.click();
        }
    }
} 