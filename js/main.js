import { PartidaManager } from './modules/contracts/PartidaManager.js';
import { ContractManager } from './modules/contracts/ContractManager.js';

// Inicializar PartidaManager globalmente
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.PartidaManager = new PartidaManager();
        console.log('PartidaManager inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar PartidaManager:', error);
    }
});

// Función para crear o actualizar contrato
function saveContract(contract) {
    db.saveContract(contract);
    updateContractsSlider();
    updateDashboardValues();
    if (window.PartidaManager && window.PartidaManager.refreshAll) {
        window.PartidaManager.refreshAll();
    }
    if (window.refreshAvances) {
        window.refreshAvances();
    }
    window.notifyAction && window.notifyAction('success', 'Contrato guardado o actualizado correctamente.');
} 