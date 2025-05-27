/**
 * Módulo para manejar las pestañas de manera robusta
 */
class TabManager {
    constructor() {
        this.tabs = new Map();
        this.activeTab = null;
        this.initialized = false;
    }

    /**
     * Inicializa el sistema de pestañas
     * @param {string} containerId - ID del contenedor de pestañas
     */
    init(containerId) {
        if (this.initialized) {
            console.warn('TabManager ya está inicializado');
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Contenedor ${containerId} no encontrado`);
            return;
        }

        // Limpiar event listeners existentes
        this.cleanup();

        // Obtener todas las pestañas y contenidos
        const tabButtons = container.querySelectorAll('[data-tab]');
        const tabContents = container.querySelectorAll('[data-tab-content]');

        // Registrar pestañas
        tabButtons.forEach(button => {
            const tabId = button.dataset.tab;
            const content = container.querySelector(`[data-tab-content="${tabId}"]`);
            
            if (content) {
                this.tabs.set(tabId, {
                    button,
                    content,
                    isActive: false
                });

                // Agregar event listener
                button.addEventListener('click', () => this.switchTab(tabId));
            }
        });

        // Activar primera pestaña por defecto
        if (tabButtons.length > 0) {
            const firstTabId = tabButtons[0].dataset.tab;
            this.switchTab(firstTabId);
        }

        this.initialized = true;
    }

    /**
     * Cambia a una pestaña específica
     * @param {string} tabId - ID de la pestaña a activar
     */
    switchTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) {
            console.error(`Pestaña ${tabId} no encontrada`);
            return;
        }

        // Desactivar pestaña actual
        if (this.activeTab) {
            const currentTab = this.tabs.get(this.activeTab);
            if (currentTab) {
                currentTab.button.classList.remove('active');
                currentTab.content.classList.remove('active');
                currentTab.isActive = false;
            }
        }

        // Activar nueva pestaña
        tab.button.classList.add('active');
        tab.content.classList.add('active');
        tab.isActive = true;
        this.activeTab = tabId;

        // Disparar evento personalizado
        const event = new CustomEvent('tabChanged', {
            detail: { tabId, previousTab: this.activeTab }
        });
        document.dispatchEvent(event);
    }

    /**
     * Limpia los event listeners
     */
    cleanup() {
        this.tabs.forEach(tab => {
            const newButton = tab.button.cloneNode(true);
            tab.button.parentNode.replaceChild(newButton, tab.button);
        });
        this.tabs.clear();
        this.activeTab = null;
        this.initialized = false;
    }

    /**
     * Obtiene el ID de la pestaña activa
     * @returns {string|null} ID de la pestaña activa
     */
    getActiveTab() {
        return this.activeTab;
    }

    /**
     * Verifica si una pestaña está activa
     * @param {string} tabId - ID de la pestaña a verificar
     * @returns {boolean} true si la pestaña está activa
     */
    isTabActive(tabId) {
        const tab = this.tabs.get(tabId);
        return tab ? tab.isActive : false;
    }
}

// Exportar instancia única
const tabManager = new TabManager();
export default tabManager; 