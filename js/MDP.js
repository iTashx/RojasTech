// Manual de Desarrollo Privado (MDP) - Lógica JavaScript

// Configuración inicial
const MDP = {
    // Estado de la aplicación (ya no necesitamos estado de autenticación)
    state: {
        currentSection: null,
        searchQuery: '',
        // isAuthenticated: false, // Eliminado
        // lastAccess: null // Eliminado
    },

    // Inicialización
    init() {
        // Ya no necesitamos event listeners de login o admin
        // this.setupEventListeners(); 
        // Ya no necesitamos checkAuthentication
        // this.checkAuthentication();
        // Ya no necesitamos updateLastAccess
        // this.updateLastAccess();
        // setupNavigation() es opcional si no tienes navegación interna en el MDP. Si sí, descomentar.
        // this.setupNavigation(); 

        // Mostrar el contenido principal y la documentación directamente
        this.showContent(); 
        this.showDocumentation(); 
        
        // Cargar el contenido inicial si usas navegación interna (basado en hash)
        // this.loadContent(); 
    },

    // Configuración de eventos (vacío o con solo navegación interna si aplica)
    setupEventListeners() {
        // Si tienes navegación interna en el MDP (ej: enlaces ancla dentro de MDP.md), configúrala aquí.
        // document.querySelectorAll('.mdp-nav a').forEach(link => {
        //     link.addEventListener('click', (e) => {
        //         e.preventDefault();
        //         this.navigateToSection(e.target.getAttribute('href').substring(1));
        //     });
        // });

        // Búsqueda (si quieres mantener la funcionalidad de búsqueda)
        const searchInput = document.getElementById('mdp-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
    },

    // Autenticación (eliminada)
    // checkAuthentication() {},
    // validateToken(token) {},
    // handleLogin(form) {},
    // generateToken() {},

    // Navegación (solo si tienes navegación interna)
    setupNavigation() {
        // Implementación si hay navegación interna dentro del MDP
    },

    navigateToSection(sectionId) {
         // Implementación si hay navegación interna dentro del MDP
    },

    updateNavigation() {
         // Implementación si hay navegación interna dentro del MDP
    },

    // Búsqueda
    handleSearch(query) {
         // Implementación si quieres mantener la funcionalidad de búsqueda
         this.state.searchQuery = query.toLowerCase();
         const docContent = document.querySelector('.mdp-documentation');
         if (docContent) {
            // Esto es una búsqueda básica en el texto visible.
            // Para una búsqueda más robusta, necesitarías cargar el contenido original de MDP.md
            // y buscar dentro de él, o usar un parser de markdown.
            const content = docContent.textContent.toLowerCase();
            // Lógica para resaltar o filtrar (puede ser compleja sin un parser de markdown)
            console.log("Buscando en MDP:", this.state.searchQuery);
         }
    },

    // Gestión de contenido
    showContent() {
        const contentDiv = document.getElementById('mdp-content');
        if (contentDiv) {
            contentDiv.style.display = 'block';
        }
    },

    hideContent() {
         // Ya no debería ser necesario ocultar el contenido principal
        // const contentDiv = document.getElementById('mdp-content');
        // if (contentDiv) {
        //     contentDiv.style.display = 'none';
        // }
    },

    showDocumentation() {
        const docSection = document.querySelector('.mdp-documentation');
        if (docSection) {
             // Asumiendo que el contenido de MDP.md ya está insertado en el HTML (como hicimos antes)
             // simplemente asegúrate de que la sección esté visible.
             docSection.style.display = 'block';

            // Si decides cargar el contenido de MDP.md dinámicamente (como intentamos antes con fetch),
            // la lógica de fetch iría aquí. Por ahora, asumimos que el HTML ya tiene el contenido.
        }
    },

    hideDocumentation() {
        const docSection = document.querySelector('.mdp-documentation');
        if (docSection) {
            docSection.style.display = 'none'; // Ocultar si es necesario en el futuro (ej: para búsqueda con resaltado)
        }
    },

    showAdminSection() {},
    hideAdminSection() {},

    // Exportación de documentación (mantener si son útiles)
    exportDocumentation(format = 'pdf') {
        const content = document.querySelector('.mdp-documentation').innerHTML; // Exportar el contenido de la documentación
        
        switch (format) {
            case 'pdf':
                this.exportToPDF(content);
                break;
            case 'html':
                this.exportToHTML(content);
                break;
            case 'markdown':
                this.exportToMarkdown(content);
                break;
        }
    },

    exportToPDF(content) {
        console.log('Exportando contenido de documentación a PDF...');
        // Implementar exportación a PDF (requiere librería como jsPDF, ya incluida en index.html pero no en MDP.html)
        // Necesitarías incluir jsPDF en MDP.html también o encontrar otra forma.
    },

    exportToHTML(content) {
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'documentacion_mdp.html'; // Nombre de archivo
        a.click();
        URL.revokeObjectURL(url);
        console.log('Contenido de documentación exportado a HTML.');
    },

    exportToMarkdown(content) {
        console.log('Exportando contenido de documentación a Markdown...');
        // Esto es complejo sin un parser. Necesitarías convertir el HTML de vuelta a Markdown.
        // Podrías considerar mantener MDP.md como fuente y exportar ese archivo directamente (si es accesible) o usar una librería.
    }
};

// Configuración inicial del MDP (Ya no necesitamos credenciales o lógica de guardado/carga de config)
const MDPConfig = {}; // Objeto vacío o con otra info si es necesaria

// Funciones de autenticación y administración (eliminadas o vacías)
// function checkCredentials(username, password) { return false; }
// function updateCredentials(newUsername, newPassword) { return false; }
// function saveConfig() {}
// function loadConfig() {}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // loadConfig(); // Ya no es necesario cargar config de credenciales
    MDP.init();

    // El formulario de administración y login ya no existen, por lo que no necesitamos listeners aquí.
    // const adminForm = document.getElementById('mdp-admin-form');
    // if (adminForm) { /* ... */ }
});

// Eliminar la función escapeHTML si no se usa para mostrar markdown crudo
// function escapeHTML(str) { /* ... */ } 