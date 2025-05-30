// Módulo principal de contratos
import { db } from '../../database.js';
import { DateUtils } from '../utils/DateUtils.js';
import { NumberUtils } from '../utils/NumberUtils.js';
import { StringUtils } from '../utils/StringUtils.js';
import { FormatUtils } from '../utils/FormatUtils.js';
import { ContractForm } from './ContractForm.js';
import { ContractList } from './ContractList.js';
import { ContractPartidas } from './ContractPartidas.js';
import { ContractValidation } from './ContractValidation.js';
import { ContractExport } from './ContractExport.js';
import { Notifications } from '../utils/Notifications.js';
import { showToast } from '../utils/ui.js';
import { formatMonto } from '../utils/formatters.js';

export class ContractManager {
    constructor() {
        this.notifications = new Notifications();
        this.form = new ContractForm(this);
        this.list = new ContractList(this);
        this.partidas = new ContractPartidas(this);
        this.validation = new ContractValidation();
        this.export = new ContractExport(this);
        
        this.setupEventListeners();
        this.loadContracts();
        this.currentContractId = null;
        this.initializeEventListeners();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Eventos de búsqueda y filtrado
        document.getElementById('searchContract').addEventListener('input', (e) => {
            this.list.filterContracts(e.target.value);
        });

        document.getElementById('filterStatus').addEventListener('change', (e) => {
            this.list.filterByStatus(e.target.value);
        });

        // Eventos de ordenamiento
        document.querySelectorAll('.sort-contract').forEach(header => {
            header.addEventListener('click', () => {
                const field = header.dataset.field;
                this.list.sortContracts(field);
            });
        });

        // Eventos de exportación
        document.getElementById('exportExcelBtn').addEventListener('click', () => {
            this.export.exportarTodosContratosExcel();
        });

        document.getElementById('exportPDFBtn').addEventListener('click', () => {
            this.export.exportarTodosContratosPDF();
        });

        // Eventos de partidas
        document.getElementById('showPartidasBtn').addEventListener('click', () => {
            const contractId = document.getElementById('contractId').value;
            if (contractId) {
                this.partidas.cargarPartidas(contractId);
            }
        });
    }

    initializeEventListeners() {
        const contractForm = document.getElementById('contract-form');
        if (contractForm) {
            contractForm.addEventListener('submit', this.handleContractSubmit.bind(this));
        }

        const addPartidaBtn = document.getElementById('add-partida-btn');
        if (addPartidaBtn) {
            addPartidaBtn.addEventListener('click', this.addPartida.bind(this));
        }

        // Inicializar otros event listeners
        this.initializeDateListeners();
        this.initializeAmountListeners();
    }

    async handleContractSubmit(event) {
        event.preventDefault();
        try {
            const formData = this.getFormData();
            if (this.currentContractId) {
                await this.updateContract(formData);
            } else {
                await this.createContract(formData);
            }
            showToast('Contrato guardado exitosamente', 'success');
        } catch (error) {
            showToast('Error al guardar el contrato: ' + error.message, 'error');
        }
    }

    getFormData() {
        return {
            numeroProveedor: document.getElementById('numero-proveedor').value,
            fechaFirma: document.getElementById('fecha-firma-contrato').value,
            fechaInicio: document.getElementById('fecha-inicio').value,
            fechaTerminacion: document.getElementById('fecha-terminacion').value,
            numeroSicac: document.getElementById('numero-sicac').value,
            divisionArea: document.getElementById('division-area').value,
            eemn: document.getElementById('eemn').value,
            region: document.getElementById('region').value,
            naturalezaContratacion: document.getElementById('naturaleza-contratacion').value,
            lineaServicio: document.getElementById('linea-servicio').value,
            noPeticionOferta: document.getElementById('no-peticion-oferta').value,
            modalidadContratacion: document.getElementById('modalidad-contratacion').value,
            regimenLaboral: document.getElementById('regimen-laboral').value,
            objetoContractual: document.getElementById('objeto-contractual').value,
            montoOriginal: parseFloat(document.getElementById('monto-original').value),
            montoModificado: parseFloat(document.getElementById('monto-modificado').value),
            montoTotal: parseFloat(document.getElementById('monto-total-contrato').value),
            estatus: document.getElementById('estatus-contrato').value,
            moneda: document.getElementById('moneda').value
        };
    }

    // Cargar contratos
    async loadContracts() {
        try {
            const contracts = await db.contracts.toArray();
            this.list.renderContracts(contracts);
            this.updateContractStats(contracts);
        } catch (error) {
            console.error('Error al cargar contratos:', error);
            this.notifications.addNotification(
                'Error',
                'Error al cargar los contratos',
                'error'
            );
        }
    }

    // Actualizar estadísticas de contratos
    updateContractStats(contracts) {
        const totalAmount = contracts.reduce((sum, contract) => sum + contract.monto, 0);
        const activeContracts = contracts.filter(c => c.estado === 'active').length;
        const completedContracts = contracts.filter(c => c.estado === 'completed').length;

        document.getElementById('totalContracts').textContent = contracts.length;
        document.getElementById('totalAmount').textContent = FormatUtils.formatAmount(totalAmount);
        document.getElementById('activeContracts').textContent = activeContracts;
        document.getElementById('completedContracts').textContent = completedContracts;
    }

    // Verificar vencimientos de contratos
    async verificarVencimientos() {
        try {
            const contracts = await db.contracts.toArray();
            const today = new Date();
            const diasAlerta = await this.getDiasAlerta();

            contracts.forEach(contract => {
                if (contract.estado === 'active') {
                    const fechaFin = new Date(contract.fechaFin);
                    const diasRestantes = DateUtils.daysBetween(today, fechaFin);

                    if (diasRestantes <= diasAlerta) {
                        this.notifications.addNotification(
                            'Contrato por Vencer',
                            `El contrato ${contract.codigo} vence en ${diasRestantes} días`,
                            'warning'
                        );
                    }
                }
            });
        } catch (error) {
            console.error('Error al verificar vencimientos:', error);
        }
    }

    // Obtener días de alerta desde la configuración
    async getDiasAlerta() {
        try {
            const config = await db.config.get('diasAlerta');
            return config ? config.valor : 30; // Valor por defecto: 30 días
        } catch (error) {
            console.error('Error al obtener días de alerta:', error);
            return 30;
        }
    }

    // Calcular avance físico
    async calcularAvanceFisico(contractId) {
        return await this.partidas.calcularAvanceFisico(contractId);
    }

    // Calcular avance financiero
    async calcularAvanceFinanciero(contractId) {
        return await this.partidas.calcularAvanceFinanciero(contractId);
    }

    // Exportar contrato
    async exportarContrato(id) {
        return await this.export.exportarContrato(id);
    }

    // Exportar contrato a Excel
    async exportarContratoExcel(id) {
        await this.export.exportarContratoExcel(id);
    }

    // Exportar contrato a PDF
    async exportarContratoPDF(id) {
        await this.export.exportarContratoPDF(id);
    }

    // Exportar todos los contratos a Excel
    async exportarTodosContratosExcel() {
        await this.export.exportarTodosContratosExcel();
    }

    // Exportar todos los contratos a PDF
    async exportarTodosContratosPDF() {
        await this.export.exportarTodosContratosPDF();
    }

    // Crear contrato
    async createContract(formData) {
        try {
            // Validar datos
            if (!formData.codigo) throw new Error('El código es requerido');
            if (!formData.ruc) throw new Error('El RUC es requerido');
            if (!formData.razonSocial) throw new Error('La razón social es requerida');
            if (!formData.monto) throw new Error('El monto es requerido');
            if (!formData.fechaInicio) throw new Error('La fecha de inicio es requerida');
            if (!formData.fechaFin) throw new Error('La fecha de fin es requerida');

            // Verificar si existe el código
            const exists = await db.contracts.where('codigo').equals(formData.codigo).first();
            if (exists) {
                this.notifications.error('El código ya existe');
                return false;
            }

            // Crear contrato
            const contractId = await db.contracts.add({
                ...formData,
                estado: 'active',
                fechaCreacion: new Date(),
                partidas: this.getPartidasData()
            });

            this.notifications.success('Contrato creado');
            return contractId;
        } catch (error) {
            console.error('Error al crear contrato:', error);
            this.notifications.error(error.message || 'Error al crear contrato');
            return false;
        }
    }

    // Actualizar contrato
    async updateContract(formData) {
        try {
            // Validar contrato
            const contract = await db.contracts.get(this.currentContractId);
            if (!contract) {
                this.notifications.error('Contrato no encontrado');
                return false;
            }

            // Verificar código duplicado
            if (formData.codigo && formData.codigo !== contract.codigo) {
                const exists = await db.contracts.where('codigo').equals(formData.codigo).first();
                if (exists) {
                    this.notifications.error('El código ya existe');
                    return false;
                }
            }

            // Actualizar contrato
            await db.contracts.update(this.currentContractId, {
                ...formData,
                fechaActualizacion: new Date(),
                partidas: this.getPartidasData()
            });

            this.notifications.success('Contrato actualizado');
            return true;
        } catch (error) {
            console.error('Error al actualizar contrato:', error);
            this.notifications.error(error.message || 'Error al actualizar contrato');
            return false;
        }
    }

    // Eliminar contrato
    async deleteContract(id) {
        try {
            // Validar contrato
            const contract = await db.contracts.get(id);
            if (!contract) {
                this.notifications.error('Contrato no encontrado');
                return false;
            }

            // Verificar si tiene partidas
            const partidas = await db.partidas.where('contractId').equals(id).toArray();
            if (partidas.length > 0) {
                this.notifications.error('No se puede eliminar el contrato porque tiene partidas asociadas');
                return false;
            }

            // Verificar si tiene pagos
            const pagos = await db.payments.where('contractId').equals(id).toArray();
            if (pagos.length > 0) {
                this.notifications.error('No se puede eliminar el contrato porque tiene pagos asociados');
                return false;
            }

            // Verificar si tiene documentos
            const documentos = await db.documents.where('contractId').equals(id).toArray();
            if (documentos.length > 0) {
                this.notifications.error('No se puede eliminar el contrato porque tiene documentos asociados');
                return false;
            }

            // Eliminar contrato
            await db.contracts.delete(id);

            this.notifications.success('Contrato eliminado');
            return true;
        } catch (error) {
            console.error('Error al eliminar contrato:', error);
            this.notifications.error(error.message || 'Error al eliminar contrato');
            return false;
        }
    }

    // Obtener contrato por ID
    async getContractById(id) {
        try {
            const contract = await db.contracts.get(id);
            if (!contract) {
                this.notifications.error('Contrato no encontrado');
                return null;
            }
            return contract;
        } catch (error) {
            console.error('Error al obtener contrato:', error);
            this.notifications.error(error.message || 'Error al obtener contrato');
            return null;
        }
    }

    // Listar contratos
    async listContracts(filters = {}) {
        try {
            let query = db.contracts.toCollection();

            // Aplicar filtros
            if (filters.estado) {
                query = query.filter(contract => contract.estado === filters.estado);
            }

            if (filters.ruc) {
                query = query.filter(contract => contract.ruc.includes(filters.ruc));
            }

            if (filters.razonSocial) {
                query = query.filter(contract => 
                    contract.razonSocial.toLowerCase().includes(filters.razonSocial.toLowerCase())
                );
            }

            if (filters.fechaInicio) {
                const fechaInicio = new Date(filters.fechaInicio);
                query = query.filter(contract => new Date(contract.fechaInicio) >= fechaInicio);
            }

            if (filters.fechaFin) {
                const fechaFin = new Date(filters.fechaFin);
                query = query.filter(contract => new Date(contract.fechaFin) <= fechaFin);
            }

            // Ordenar por fecha de creación
            query = query.sortBy('fechaCreacion');

            return await query.toArray();
        } catch (error) {
            console.error('Error al listar contratos:', error);
            this.notifications.error(error.message || 'Error al listar contratos');
            return [];
        }
    }

    // Obtener estadísticas
    async getStats() {
        try {
            const contracts = await db.contracts.toArray();
            
            const stats = {
                total: contracts.length,
                activos: contracts.filter(c => c.estado === 'active').length,
                vencidos: contracts.filter(c => c.estado === 'expired').length,
                completados: contracts.filter(c => c.estado === 'completed').length,
                montoTotal: contracts.reduce((sum, c) => sum + Number(c.monto), 0),
                montoActivos: contracts
                    .filter(c => c.estado === 'active')
                    .reduce((sum, c) => sum + Number(c.monto), 0),
                montoVencidos: contracts
                    .filter(c => c.estado === 'expired')
                    .reduce((sum, c) => sum + Number(c.monto), 0),
                montoCompletados: contracts
                    .filter(c => c.estado === 'completed')
                    .reduce((sum, c) => sum + Number(c.monto), 0)
            };

            return stats;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            this.notifications.error(error.message || 'Error al obtener estadísticas');
            return null;
        }
    }

    // Obtener contratos por vencer
    async getExpiringContracts(days = 30) {
        try {
            const today = new Date();
            const limitDate = new Date();
            limitDate.setDate(today.getDate() + days);

            const contracts = await db.contracts
                .where('estado')
                .equals('active')
                .and(contract => {
                    const fechaFin = new Date(contract.fechaFin);
                    return fechaFin >= today && fechaFin <= limitDate;
                })
                .toArray();

            return contracts;
        } catch (error) {
            console.error('Error al obtener contratos por vencer:', error);
            this.notifications.error(error.message || 'Error al obtener contratos por vencer');
            return [];
        }
    }

    // Obtener contratos vencidos
    async getExpiredContracts() {
        try {
            const today = new Date();

            const contracts = await db.contracts
                .where('estado')
                .equals('active')
                .and(contract => new Date(contract.fechaFin) < today)
                .toArray();

            // Actualizar estado
            for (const contract of contracts) {
                await db.contracts.update(contract.id, { estado: 'expired' });
            }

            return contracts;
        } catch (error) {
            console.error('Error al obtener contratos vencidos:', error);
            this.notifications.error(error.message || 'Error al obtener contratos vencidos');
            return [];
        }
    }

    // Obtener contratos por proveedor
    async getContractsByProvider(ruc) {
        try {
            const contracts = await db.contracts
                .where('ruc')
                .equals(ruc)
                .toArray();

            return contracts;
        } catch (error) {
            console.error('Error al obtener contratos por proveedor:', error);
            this.notifications.error(error.message || 'Error al obtener contratos por proveedor');
            return [];
        }
    }

    // Obtener contratos por período
    async getContractsByPeriod(startDate, endDate) {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            const contracts = await db.contracts
                .where('fechaInicio')
                .between(start, end)
                .toArray();

            return contracts;
        } catch (error) {
            console.error('Error al obtener contratos por período:', error);
            this.notifications.error(error.message || 'Error al obtener contratos por período');
            return [];
        }
    }

    // Obtener contratos por monto
    async getContractsByAmount(minAmount, maxAmount) {
        try {
            const contracts = await db.contracts
                .where('monto')
                .between(minAmount, maxAmount)
                .toArray();

            return contracts;
        } catch (error) {
            console.error('Error al obtener contratos por monto:', error);
            this.notifications.error(error.message || 'Error al obtener contratos por monto');
            return [];
        }
    }

    // Obtener contratos por estado
    async getContractsByStatus(status) {
        try {
            const contracts = await db.contracts
                .where('estado')
                .equals(status)
                .toArray();

            return contracts;
        } catch (error) {
            console.error('Error al obtener contratos por estado:', error);
            this.notifications.error(error.message || 'Error al obtener contratos por estado');
            return [];
        }
    }

    // Obtener contratos por búsqueda
    async searchContracts(query) {
        try {
            const contracts = await db.contracts.toArray();
            
            return contracts.filter(contract => {
                const searchStr = `
                    ${contract.codigo}
                    ${contract.ruc}
                    ${contract.razonSocial}
                    ${contract.descripcion || ''}
                `.toLowerCase();

                return searchStr.includes(query.toLowerCase());
            });
        } catch (error) {
            console.error('Error al buscar contratos:', error);
            this.notifications.error(error.message || 'Error al buscar contratos');
            return [];
        }
    }

    getPartidasData() {
        const partidas = [];
        const rows = document.querySelectorAll('#partidas-table tbody tr');
        rows.forEach(row => {
            partidas.push({
                descripcion: row.querySelector('.descripcion').value,
                cantidad: parseFloat(row.querySelector('.cantidad').value),
                umd: row.querySelector('.umd').value,
                precioUnitario: parseFloat(row.querySelector('.precio-unitario').value),
                total: parseFloat(row.querySelector('.total').value)
            });
        });
        return partidas;
    }

    addPartida() {
        const tbody = document.querySelector('#partidas-table tbody');
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><input type="text" class="form-control descripcion" required></td>
            <td><input type="number" class="form-control cantidad" min="0" step="0.01" required></td>
            <td><input type="text" class="form-control umd" required></td>
            <td><input type="number" class="form-control precio-unitario" min="0" step="0.01" required></td>
            <td><input type="number" class="form-control total" readonly></td>
            <td>
                <button type="button" class="btn btn-danger btn-sm delete-partida">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(newRow);
        this.initializePartidaListeners(newRow);
    }

    initializePartidaListeners(row) {
        const cantidadInput = row.querySelector('.cantidad');
        const precioInput = row.querySelector('.precio-unitario');
        const totalInput = row.querySelector('.total');
        const deleteBtn = row.querySelector('.delete-partida');

        const updateTotal = () => {
            const cantidad = parseFloat(cantidadInput.value) || 0;
            const precio = parseFloat(precioInput.value) || 0;
            totalInput.value = (cantidad * precio).toFixed(2);
            this.updateContractPartidaTotals();
        };

        cantidadInput.addEventListener('input', updateTotal);
        precioInput.addEventListener('input', updateTotal);
        deleteBtn.addEventListener('click', () => {
            row.remove();
            this.updateContractPartidaTotals();
        });
    }

    updateContractPartidaTotals() {
        let subtotal = 0;
        const rows = document.querySelectorAll('#partidas-table tbody tr');
        rows.forEach(row => {
            subtotal += parseFloat(row.querySelector('.total').value) || 0;
        });

        const montoOriginalInput = document.getElementById('monto-original');
        const montoModificadoInput = document.getElementById('monto-modificado');
        const montoTotalInput = document.getElementById('monto-total-contrato');

        montoOriginalInput.value = subtotal.toFixed(2);
        montoModificadoInput.value = subtotal.toFixed(2);
        montoTotalInput.value = subtotal.toFixed(2);
    }

    initializeDateListeners() {
        const fechaInicioInput = document.getElementById('fecha-inicio');
        const fechaTerminacionInput = document.getElementById('fecha-terminacion');
        const periodoCulminacionInput = document.getElementById('periodo-culminacion');

        const updatePeriodo = () => {
            const inicio = new Date(fechaInicioInput.value);
            const fin = new Date(fechaTerminacionInput.value);
            if (inicio && fin && !isNaN(inicio) && !isNaN(fin)) {
                const diffTime = Math.abs(fin - inicio);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                periodoCulminacionInput.value = diffDays;
            }
        };

        fechaInicioInput.addEventListener('change', updatePeriodo);
        fechaTerminacionInput.addEventListener('change', updatePeriodo);
    }

    initializeAmountListeners() {
        const montoOriginalInput = document.getElementById('monto-original');
        const montoModificadoInput = document.getElementById('monto-modificado');
        const montoTotalInput = document.getElementById('monto-total-contrato');

        montoModificadoInput.addEventListener('input', () => {
            montoTotalInput.value = montoModificadoInput.value;
        });
    }
}

export default new ContractManager(); 