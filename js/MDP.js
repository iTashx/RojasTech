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
        const token = localStorage.getItem('mdp_token');
        if (token) {
            this.validateToken(token);
        } else {
            this.showLoginForm();
        }
    },

    validateToken(token) {
        // Aquí iría la lógica de validación del token (si fuera un token real)
        // Por ahora, solo verificamos si el token existe
        if (token) {
            this.state.isAuthenticated = true;
            this.hideLoginForm();
            this.showContent(); // Mostrar contenedor principal del contenido
            this.showDocumentation(); // Mostrar la sección de documentación
            this.hideAdminSection(); // Ocultar la sección de administración por defecto
            // this.loadContent(); // Cargar contenido específico si es necesario
        } else {
             this.state.isAuthenticated = false;
             this.showLoginForm();
             this.hideContent(); // Ocultar contenido si el token no es válido
        }
    },

    handleLogin(form) {
        const username = form.querySelector('[name="mdp-username"]').value;
        const password = form.querySelector('[name="mdp-password"]').value;

        // Verificar credenciales
        console.log("Intentando iniciar sesión con usuario:", username, "y contraseña:", password);
        console.log("Credenciales esperadas:", MDPConfig.credentials);
        if (username === MDPConfig.credentials.username && password === MDPConfig.credentials.password) {
            const token = this.generateToken();
            localStorage.setItem('mdp_token', token);
            this.state.isAuthenticated = true;
            this.hideLoginForm();
            this.showContent(); // Mostrar contenedor principal del contenido
            this.showDocumentation(); // Mostrar la sección de documentación
            this.hideAdminSection(); // Ocultar la sección de administración por defecto
            // this.loadContent(); // Cargar contenido específico si es necesario
            this.showSuccess('Inicio de sesión exitoso.'); // Mostrar mensaje de éxito
        } else {
            this.showError('Credenciales inválidas.');
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
        const errorDiv = document.getElementById('mdp-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
                errorDiv.textContent = '';
            }, 3000);
        }
    },

    showSuccess(message) {
        const successDiv = document.getElementById('mdp-success');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
                successDiv.textContent = '';
            }, 3000);
        }
    },

    showLoginForm() {
        const loginDiv = document.getElementById('mdp-login');
        if (loginDiv) {
            loginDiv.style.display = 'block';
        }
    },

    hideLoginForm() {
        const loginDiv = document.getElementById('mdp-login');
        if (loginDiv) {
            loginDiv.style.display = 'none';
        }
    },

    // Nuevas funciones para mostrar/ocultar contenido principal
    showContent() {
        const contentDiv = document.getElementById('mdp-content');
        if (contentDiv) {
            contentDiv.style.display = 'block';
        }
    },

    hideContent() {
        const contentDiv = document.getElementById('mdp-content');
        if (contentDiv) {
            contentDiv.style.display = 'none';
        }
    },

    // Nuevas funciones para mostrar/ocultar secciones específicas del MDP
    showDocumentation() {
        const docSection = document.querySelector('.mdp-documentation');
        if (docSection) {
            docSection.style.display = 'block';
        }
    },

    hideDocumentation() {
        const docSection = document.querySelector('.mdp-documentation');
        if (docSection) {
            docSection.style.display = 'none';
        }
    },

    showAdminSection() {
        const adminSection = document.querySelector('.mdp-admin-section');
        if (adminSection) {
            adminSection.style.display = 'block';
        }
    },

    hideAdminSection() {
        const adminSection = document.querySelector('.mdp-admin-section');
        if (adminSection) {
            adminSection.style.display = 'none';
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

    // Asegurarse de que la sección de administración esté oculta al cargar la página
    MDP.hideAdminSection();
    // Asegurarse de que la sección de documentación esté oculta al cargar la página
    MDP.hideDocumentation();
    // Asegurarse de que el contenido principal esté oculto al cargar la página
    MDP.hideContent();

    // Configurar listeners para el formulario de administración (dentro del contenido del MDP)
    const adminForm = document.getElementById('mdp-admin-form');
    if (adminForm) {
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newUsernameInput = document.getElementById('new-username');
            const newPasswordInput = document.getElementById('new-password');
            const confirmPasswordInput = document.getElementById('confirm-password');

            const newUsername = newUsernameInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (newPassword !== confirmPassword) {
                MDP.showError('Las contraseñas no coinciden.');
                return;
            }

            if (updateCredentials(newUsername, newPassword)) {
                MDP.showSuccess('Credenciales actualizadas exitosamente.');
                // Limpiar formulario de administración
                adminForm.reset();
            } else {
                // Esto no debería ocurrir con la lógica actual, pero es un fallback
                MDP.showError('Error al actualizar credenciales.');
            }
        });
    }
}); 