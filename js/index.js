// Función para actualizar el carrusel de contratos
function updateContractsSlider() {
    const contracts = db.getContracts();
    const carousel = document.getElementById('contracts-slider');
    const carouselInner = carousel.querySelector('.carousel-inner');
    
    // Limpiar el carrusel
    carouselInner.innerHTML = '';
    
    if (contracts.length === 0) {
        // Mostrar mensaje cuando no hay contratos
        carouselInner.innerHTML = `
            <div class="no-contracts-message">
                <i class="fas fa-file-contract"></i>
                <p>No hay contratos registrados</p>
            </div>
        `;
        return;
    }
    
    // Crear slides para cada contrato
    contracts.forEach((contract, index) => {
        const slide = document.createElement('div');
        slide.className = `carousel-item ${index === 0 ? 'active' : ''}`;
        
        // Calcular días restantes
        const endDate = new Date(contract.endDate);
        const today = new Date();
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        
        // Calcular progreso
        const startDate = new Date(contract.startDate);
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const progress = Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100));
        
        slide.innerHTML = `
            <div class="card">
                <h3>${contract.name}</h3>
                <p>${daysLeft} días restantes</p>
                <div class="progress mt-3" style="height: 10px;">
                    <div class="progress-bar bg-success" role="progressbar" 
                         style="width: ${progress}%" 
                         aria-valuenow="${progress}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                    </div>
                </div>
                <small class="text-white mt-2 d-block">
                    ${contract.startDate} - ${contract.endDate}
                </small>
            </div>
        `;
        
        carouselInner.appendChild(slide);
    });
    
    // Actualizar los indicadores
    const indicators = carousel.querySelector('.carousel-indicators');
    indicators.innerHTML = contracts.map((_, index) => `
        <button type="button" 
                data-bs-target="#contracts-slider" 
                data-bs-slide-to="${index}" 
                class="${index === 0 ? 'active' : ''}"
                aria-current="${index === 0 ? 'true' : 'false'}"
                aria-label="Slide ${index + 1}">
        </button>
    `).join('');
}

// Función para actualizar los valores del dashboard
function updateDashboardValues() {
    const contracts = db.getContracts();
    const today = new Date();
    
    // Calcular total de contratos
    document.getElementById('total-contracts').textContent = contracts.length;
    
    // Calcular contratos activos
    const activeContracts = contracts.filter(contract => {
        const endDate = new Date(contract.endDate);
        return endDate >= today;
    });
    document.getElementById('active-contracts').textContent = activeContracts.length;
    
    // Calcular contratos por vencer
    const expiringContracts = contracts.filter(contract => {
        const endDate = new Date(contract.endDate);
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        return daysLeft <= 30 && daysLeft > 0;
    });
    document.getElementById('expiring-contracts').textContent = expiringContracts.length;
    
    // Calcular valor total
    const totalValue = contracts.reduce((sum, contract) => sum + (contract.value || 0), 0);
    document.getElementById('total-value').textContent = formatCurrency(totalValue);
}

// Función para formatear moneda
function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Inicializar el sistema de notificaciones
const notificationManager = new NotificationManager();

// Ejemplo de cómo agregar una notificación
function addExampleNotification() {
    notificationManager.addNotification({
        type: 'info',
        title: 'Bienvenido al Sistema',
        message: 'El sistema de notificaciones está activo y funcionando correctamente.',
        details: 'Puedes recibir notificaciones sobre eventos importantes del sistema.',
        solution: 'Las notificaciones se mostrarán automáticamente cuando ocurran eventos relevantes.'
    });
}

// Actualizar el dashboard cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    updateContractsSlider();
    updateDashboardValues();
    
    // Actualizar cuando cambia el carrusel
    const carousel = document.getElementById('contracts-slider');
    carousel.addEventListener('slid.bs.carousel', () => {
        updateDashboardValues();
    });
    
    // Agregar una notificación de ejemplo al cargar la página
    addExampleNotification();
});

// Función para crear o actualizar contrato
function saveContract(contract) {
    db.saveContract(contract);
    updateContractsSlider();
    updateDashboardValues();
    window.notifyAction && window.notifyAction('success', 'Contrato guardado o actualizado correctamente.');
} 