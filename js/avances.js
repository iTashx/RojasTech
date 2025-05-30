// js/avances.js
// Lógica de avance físico y financiero

// Módulo de avances
class AvancesManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Event listeners para los selectores de contratos
        const physicalContractSelect = document.getElementById('physical-advance-contract-select');
        const financialContractSelect = document.getElementById('financial-advance-contract-select');

        if (physicalContractSelect) {
            physicalContractSelect.addEventListener('change', (e) => this.handlePhysicalAdvanceChange(e.target.value));
        }

        if (financialContractSelect) {
            financialContractSelect.addEventListener('change', (e) => this.handleFinancialAdvanceChange(e.target.value));
        }
    }

    mostrarAvancesContrato(contrato) {
        // Calcular avance físico y financiero
        const avanceFisico = this.calcularAvanceFisico(contrato);
        const avanceFinanciero = this.calcularAvanceFinanciero(contrato);

        // Actualizar barras y textos
        document.getElementById('physical-progress-bar').style.width = avanceFisico + '%';
        document.getElementById('physical-progress-label').textContent = avanceFisico + '%';
        document.getElementById('financial-progress-bar').style.width = avanceFinanciero + '%';
        document.getElementById('financial-progress-label').textContent = avanceFinanciero + '%';

        // Fecha de vencimiento (considerando extensiones)
        document.getElementById('nueva-fecha-vencimiento').textContent = contrato.nuevaFechaVencimiento || contrato.fechaTerminacion;
    }

    calcularAvanceFisico(contrato) {
        if (!contrato || !contrato.partidas || contrato.partidas.length === 0) return 0;
        let total = 0, ejecutado = 0;
        contrato.partidas.forEach(p => {
            total += Number(p.cantidad) || 0;
            ejecutado += (Number(p.cantidadEjecutada) || 0);
        });
        return total > 0 ? Math.round((ejecutado / total) * 100) : 0;
    }

    calcularAvanceFinanciero(contrato) {
        if (!contrato || !contrato.partidas || contrato.partidas.length === 0) return 0;
        let total = 0, ejecutado = 0;
        contrato.partidas.forEach(p => {
            total += Number(p.total) || 0;
            ejecutado += (Number(p.montoEjecutado) || 0);
        });
        return total > 0 ? Math.round((ejecutado / total) * 100) : 0;
    }

    handlePhysicalAdvanceChange(contractId) {
        // Implementar lógica para manejar cambios en el avance físico
    }

    handleFinancialAdvanceChange(contractId) {
        // Implementar lógica para manejar cambios en el avance financiero
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.avancesManager = new AvancesManager();
}); 