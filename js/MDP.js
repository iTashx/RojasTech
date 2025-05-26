// Manual de Desarrollo Privado (MDP) - Lógica JavaScript

// Configuración inicial
const MDP = {
    // Estado de la aplicación
    state: {
        currentSection: null,
        searchQuery: '',
        isAuthenticated: false,
        lastAccess: null
    },

    // Inicialización
    init() {
        this.setupEventListeners();
        this.setupAddUserButton();
        this.checkAuthentication();
        this.updateLastAccess();
        this.setupNavigation();
    },

    // Configuración de eventos
    setupEventListeners() {
        // Navegación
        document.querySelectorAll('.mdp-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(e.target.getAttribute('href').substring(1));
            });
        });

        // Búsqueda
        const searchInput = document.getElementById('mdp-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Autenticación
        const loginForm = document.getElementById('mdp-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e.target);
            });
        }
    },

    // Autenticación
    checkAuthentication() {
        // Temporalmente saltar autenticación para desarrollo
        this.state.isAuthenticated = true;
        this.hideLoginForm(); // Asegurarse de que el formulario de login esté oculto
        this.loadContent(); // Cargar el contenido directamente
    },

    validateToken(token) {
        // Aquí iría la lógica de validación del token
        // Por ahora, solo verificamos que exista
        if (token) {
            this.state.isAuthenticated = true;
            this.hideLoginForm();
            this.loadContent();
        }
    },

    handleLogin(form) {
        const username = form.querySelector('[name="username"]').value;
        const password = form.querySelector('[name="password"]').value;

        // Aquí iría la lógica de autenticación real
        // Por ahora, solo verificamos credenciales básicas
        if (username === 'itash' && password === 'angel1008') {
            const token = this.generateToken();
            localStorage.setItem('mdp_token', token);
            this.state.isAuthenticated = true;
            this.showSuccess('Inicio de sesión correcto');
            this.hideLoginForm();
            this.loadContent();
        } else {
            this.showError('Credenciales inválidas');
        }
    },

    generateToken() {
        return 'mdp_' + Math.random().toString(36).substr(2);
    },

    // Navegación
    setupNavigation() {
        const sections = document.querySelectorAll('.mdp-section');
        sections.forEach(section => {
            const id = section.id;
            const navItem = document.querySelector(`.mdp-nav a[href="#${id}"]`);
            if (navItem) {
                navItem.addEventListener('click', () => {
                    this.navigateToSection(id);
                });
            }
        });
    },

    navigateToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            // Ocultar todas las secciones
            document.querySelectorAll('.mdp-section').forEach(s => {
                s.style.display = 'none';
            });

            // Mostrar la sección seleccionada
            section.style.display = 'block';

            // Actualizar estado
            this.state.currentSection = sectionId;

            // Actualizar URL
            history.pushState(null, '', `#${sectionId}`);

            // Actualizar navegación
            this.updateNavigation();
        }
    },

    updateNavigation() {
        document.querySelectorAll('.mdp-nav a').forEach(link => {
            const href = link.getAttribute('href').substring(1);
            if (href === this.state.currentSection) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    // Búsqueda
    handleSearch(query) {
        this.state.searchQuery = query.toLowerCase();
        const sections = document.querySelectorAll('.mdp-section');
        
        sections.forEach(section => {
            const content = section.textContent.toLowerCase();
            const isVisible = content.includes(this.state.searchQuery);
            section.style.display = isVisible ? 'block' : 'none';
        });
    },

    // Gestión de contenido
    loadContent() {
        // Cargar el contenido inicial
        const hash = window.location.hash.substring(1);
        if (hash) {
            this.navigateToSection(hash);
        } else {
            this.navigateToSection('introduccion');
        }
    },

    // Utilidades
    updateLastAccess() {
        this.state.lastAccess = new Date();
        localStorage.setItem('mdp_last_access', this.state.lastAccess.toISOString());
    },

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mdp-status mdp-status-error';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    },

    showLoginForm() {
        const loginContainer = document.getElementById('mdp-login-container');
        if (loginContainer) {
            loginContainer.style.display = 'block';
        }
    },

    hideLoginForm() {
        const loginContainer = document.getElementById('mdp-login-container');
        if (loginContainer) {
            loginContainer.style.display = 'none';
        }
    },

    // Exportación de documentación
    exportDocumentation(format = 'pdf') {
        const content = document.querySelector('.mdp-content').innerHTML;
        
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
        // Implementar exportación a PDF
        console.log('Exportando a PDF...');
    },

    exportToHTML(content) {
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'documentacion.html';
        a.click();
        URL.revokeObjectURL(url);
    },

    exportToMarkdown(content) {
        // Implementar conversión a Markdown
        console.log('Exportando a Markdown...');
    },

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'mdp-status mdp-status-success';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    },

    // Event listener para el botón Añadir Usuario
    setupAddUserButton() {
        const addButton = document.getElementById('add-user-btn');
        const adminSection = document.getElementById('mdp-admin-section');
        if (addButton && adminSection) {
            addButton.addEventListener('click', () => {
                adminSection.style.display = 'block'; // Mostrar la sección
                addButton.style.display = 'none'; // Ocultar el botón después de clic (opcional)
            });
        }
    }
};

// Configuración inicial del MDP
const MDPConfig = {
    credentials: {
        username: 'itash',
        password: 'angel1008'
    },
    lastUpdate: new Date().toISOString()
};

// Función para verificar credenciales
function checkCredentials(username, password) {
    return username === MDPConfig.credentials.username && 
           password === MDPConfig.credentials.password;
}

// Función para actualizar credenciales
function updateCredentials(newUsername, newPassword) {
    MDPConfig.credentials.username = newUsername;
    MDPConfig.credentials.password = newPassword;
    MDPConfig.lastUpdate = new Date().toISOString();
    saveConfig();
    return true;
}

// Función para guardar la configuración
function saveConfig() {
    localStorage.setItem('MDPConfig', JSON.stringify(MDPConfig));
}

// Función para cargar la configuración
function loadConfig() {
    const savedConfig = localStorage.getItem('MDPConfig');
    if (savedConfig) {
        Object.assign(MDPConfig, JSON.parse(savedConfig));
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    MDP.init();
}); 