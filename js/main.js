// Importar módulos
import { db, addSampleData } from './database.js';
import { UI } from './modules/ui.js';
import { Utils } from './modules/utils.js';
import { Notifications } from './modules/notifications.js';
import { Contracts } from './modules/contracts.js';
import { HES } from './modules/hes.js';
import { Reports } from './modules/reports.js';
import { Charts } from './modules/charts.js';
import ContractManager from './modules/contracts/contractManager.js';
import ContractExport from './modules/contracts/ContractExport.js';
import NotificationManager from './modules/notifications/NotificationManager.js';
import { showToast } from './modules/utils/ui.js';

// Clase principal de la aplicación
class App {
    constructor() {
        this.ui = new UI();
        this.notifications = new Notifications();
        this.contracts = new Contracts(db, this.ui, this.notifications);
        this.hes = new HES(db, this.ui, this.notifications);
        this.reports = new Reports(db, this.ui, this.notifications);
        this.charts = new Charts(db, this.ui);
    }

    async init() {
        try {
            // Inicializar base de datos
            await db.open();

            // Inicializar componentes
            this.ui.init();
            this.notifications.init();
            this.contracts.init();
            this.hes.init();
            this.reports.init();
            this.charts.init();

            // Verificar vencimientos de contratos
            await this.contracts.verificarVencimientos();

            // Cargar configuración
            await this.reports.cargarConfiguracionDiasAlerta();

            // Inicializar gestores
            ContractManager;
            ContractExport;
            NotificationManager;

            // Configurar event listeners globales
            setupGlobalEventListeners();

            console.log('Aplicación inicializada correctamente');
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
            this.ui.showToast('Error al inicializar la aplicación', 'error');
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});

// Inicializar la base de datos y cargar datos de muestra
async function initializeDatabase() {
    try {
        await db.open();
        const contractsCount = await db.contracts.count();
        if (contractsCount === 0) {
            await addSampleData();
            showToast('Datos de muestra cargados exitosamente', 'success');
        }
    } catch (error) {
        showToast('Error al inicializar la base de datos: ' + error.message, 'error');
    }
}

// Configurar event listeners globales
function setupGlobalEventListeners() {
    // Event listener para el menú de navegación
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            showSection(targetId);
        });
    });

    // Event listener para el botón de cerrar sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Mostrar una sección específica
function showSection(sectionId) {
    const sections = document.querySelectorAll('.main-content > section');
    sections.forEach(section => {
        section.style.display = section.id === sectionId ? 'block' : 'none';
    });

    // Actualizar el enlace activo en la navegación
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Manejar el cierre de sesión
function handleLogout() {
    // Aquí iría la lógica de cierre de sesión
    showToast('Sesión cerrada exitosamente', 'success');
    // Redirigir a la página de inicio de sesión
    window.location.href = 'login.html';
} 