// Módulo de UI para manejo de pestañas
class UI {
    constructor() {
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.sections = document.querySelectorAll('.content-section');
        this.firstTab = this.tabButtons[0];
        this.init();
    }

    changeTab(targetId) {
        // Ocultar todas las secciones
        this.sections.forEach(section => {
            section.classList.remove('active', 'show');
            section.style.display = 'none';
        });
        // Quitar activo a todos los botones
        this.tabButtons.forEach(btn => btn.classList.remove('active'));

        // Mostrar la sección objetivo
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active', 'show');
            targetSection.style.display = 'block';
        }
        // Activar el botón correspondiente
        const targetButton = document.querySelector(`[data-target="${targetId}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }
    }

    init() {
        // Delegación de eventos para la barra lateral
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.addEventListener('click', (e) => {
                const button = e.target.closest('.tab-btn');
                if (button) {
                    const targetId = button.getAttribute('data-target');
                    this.changeTab(targetId);
                }
            });
        }
        // Activar la primera pestaña por defecto
        if (this.firstTab) {
            const defaultId = this.firstTab.getAttribute('data-target');
            this.changeTab(defaultId);
        }
    }
}

// Inicializar UI de pestañas
window.addEventListener('DOMContentLoaded', () => {
    window.ui = new UI();
}); 