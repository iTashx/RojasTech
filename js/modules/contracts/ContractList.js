// Módulo de lista de contratos
import { DateUtils } from '../utils/DateUtils.js';
import { NumberUtils } from '../utils/NumberUtils.js';
import { FormatUtils } from '../utils/FormatUtils.js';

export class ContractList {
    constructor(contractManager) {
        this.contractManager = contractManager;
        this.contracts = [];
        this.filteredContracts = [];
        this.currentSort = { field: null, direction: 'asc' };
    }

    // Renderizar lista de contratos
    renderContracts(contracts) {
        this.contracts = contracts;
        this.filteredContracts = [...contracts];
        this.updateTable();
    }

    // Actualizar tabla
    updateTable() {
        const tbody = document.getElementById('contractTableBody');
        tbody.innerHTML = '';

        this.filteredContracts.forEach(contract => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${contract.codigo}</td>
                <td>${contract.razonSocial}</td>
                <td>${FormatUtils.formatAmount(contract.monto)}</td>
                <td>${FormatUtils.formatFullDate(contract.fechaInicio)}</td>
                <td>${FormatUtils.formatFullDate(contract.fechaFin)}</td>
                <td>${FormatUtils.formatStatus(contract.estado)}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-contract" data-id="${contract.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-info view-contract" data-id="${contract.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-contract" data-id="${contract.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

            // Agregar event listeners a los botones
            tr.querySelector('.edit-contract').addEventListener('click', () => {
                this.contractManager.form.cargarContrato(contract.id);
            });

            tr.querySelector('.view-contract').addEventListener('click', () => {
                this.verContrato(contract.id);
            });

            tr.querySelector('.delete-contract').addEventListener('click', () => {
                this.eliminarContrato(contract.id);
            });

            tbody.appendChild(tr);
        });
    }

    // Filtrar contratos
    filterContracts(searchTerm) {
        if (!searchTerm) {
            this.filteredContracts = [...this.contracts];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredContracts = this.contracts.filter(contract => 
                contract.codigo.toLowerCase().includes(term) ||
                contract.razonSocial.toLowerCase().includes(term) ||
                contract.ruc.includes(term)
            );
        }

        if (this.currentSort.field) {
            this.sortContracts(this.currentSort.field);
        } else {
            this.updateTable();
        }
    }

    // Filtrar por estado
    filterByStatus(status) {
        if (!status) {
            this.filteredContracts = [...this.contracts];
        } else {
            this.filteredContracts = this.contracts.filter(contract => 
                contract.estado === status
            );
        }

        if (this.currentSort.field) {
            this.sortContracts(this.currentSort.field);
        } else {
            this.updateTable();
        }
    }

    // Ordenar contratos
    sortContracts(field) {
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }

        this.filteredContracts.sort((a, b) => {
            let valueA = a[field];
            let valueB = b[field];

            // Manejar diferentes tipos de datos
            if (field === 'monto') {
                valueA = NumberUtils.parseNumber(valueA);
                valueB = NumberUtils.parseNumber(valueB);
            } else if (field.includes('fecha')) {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
            } else {
                valueA = String(valueA).toLowerCase();
                valueB = String(valueB).toLowerCase();
            }

            if (valueA < valueB) return this.currentSort.direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return this.currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        this.updateTable();
    }

    // Ver detalles del contrato
    async verContrato(id) {
        try {
            const { contract, partidas } = await this.contractManager.exportarContrato(id);
            
            // Calcular avances
            const avanceFisico = this.contractManager.calcularAvanceFisico(id);
            const avanceFinanciero = this.contractManager.calcularAvanceFinanciero(id);

            // Mostrar modal con detalles
            const modal = document.getElementById('contractDetailsModal');
            const modalBody = modal.querySelector('.modal-body');
            
            modalBody.innerHTML = `
                <div class="contract-details">
                    <h4>Detalles del Contrato</h4>
                    <p><strong>Código:</strong> ${contract.codigo}</p>
                    <p><strong>Razón Social:</strong> ${contract.razonSocial}</p>
                    <p><strong>RUC:</strong> ${FormatUtils.formatRUC(contract.ruc)}</p>
                    <p><strong>Monto:</strong> ${FormatUtils.formatAmount(contract.monto)}</p>
                    <p><strong>Período:</strong> ${FormatUtils.formatPeriod(contract.fechaInicio, contract.fechaFin)}</p>
                    <p><strong>Estado:</strong> ${FormatUtils.formatStatus(contract.estado)}</p>
                    <p><strong>Avance Físico:</strong> ${FormatUtils.formatProgressStatus(avanceFisico)}</p>
                    <p><strong>Avance Financiero:</strong> ${FormatUtils.formatProgressStatus(avanceFinanciero)}</p>
                </div>
                <div class="partidas-list mt-4">
                    <h4>Partidas</h4>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Monto</th>
                                <th>Avance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${partidas.map(partida => `
                                <tr>
                                    <td>${partida.codigo}</td>
                                    <td>${partida.descripcion}</td>
                                    <td>${FormatUtils.formatAmount(partida.monto)}</td>
                                    <td>${FormatUtils.formatProgressStatus(partida.avance)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            // Mostrar modal
            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();
        } catch (error) {
            console.error('Error al ver contrato:', error);
            this.contractManager.notifications.addNotification(
                'Error',
                'Error al cargar los detalles del contrato',
                'error'
            );
        }
    }

    // Eliminar contrato
    async eliminarContrato(id) {
        if (!confirm('¿Está seguro de eliminar este contrato?')) {
            return;
        }

        try {
            await db.contracts.delete(id);
            await this.contractManager.loadContracts();
            
            this.contractManager.notifications.addNotification(
                'Éxito',
                'Contrato eliminado correctamente',
                'success'
            );
        } catch (error) {
            console.error('Error al eliminar contrato:', error);
            this.contractManager.notifications.addNotification(
                'Error',
                'Error al eliminar el contrato',
                'error'
            );
        }
    }
} 