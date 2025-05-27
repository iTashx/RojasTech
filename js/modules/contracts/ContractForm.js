// Módulo de formulario de contratos
import { db } from '../../database.js';
import { DateUtils } from '../utils/DateUtils.js';
import { NumberUtils } from '../utils/NumberUtils.js';
import { StringUtils } from '../utils/StringUtils.js';
import { FormatUtils } from '../utils/FormatUtils.js';

export class ContractForm {
    constructor(contractManager) {
        this.contractManager = contractManager;
        this.form = document.getElementById('contractForm');
        this.setupEventListeners();
    }

    // Configurar event listeners
    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Eventos de cálculo automático
        document.getElementById('monto').addEventListener('input', (e) => {
            this.calcularMontos(e.target.value);
        });

        // Eventos de validación
        document.getElementById('ruc').addEventListener('blur', (e) => {
            this.validarRUC(e.target.value);
        });

        document.getElementById('fechaInicio').addEventListener('change', (e) => {
            this.validarFechas();
        });

        document.getElementById('fechaFin').addEventListener('change', (e) => {
            this.validarFechas();
        });
    }

    // Manejar envío del formulario
    async handleSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = this.getFormData();
            
            if (!this.validarFormulario(formData)) {
                return;
            }

            if (formData.id) {
                await this.actualizarContrato(formData);
            } else {
                await this.crearContrato(formData);
            }

            this.limpiarFormulario();
            await this.contractManager.loadContracts();
            
            this.contractManager.notifications.addNotification(
                'Éxito',
                `Contrato ${formData.id ? 'actualizado' : 'creado'} correctamente`,
                'success'
            );
        } catch (error) {
            console.error('Error al procesar el contrato:', error);
            this.contractManager.notifications.addNotification(
                'Error',
                'Error al procesar el contrato',
                'error'
            );
        }
    }

    // Obtener datos del formulario
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Convertir tipos de datos
        data.monto = NumberUtils.parseNumber(data.monto);
        data.fechaInicio = DateUtils.parseDate(data.fechaInicio);
        data.fechaFin = DateUtils.parseDate(data.fechaFin);
        
        return data;
    }

    // Validar formulario
    validarFormulario(data) {
        if (!data.codigo) {
            this.mostrarError('El código es requerido');
            return false;
        }

        if (!data.ruc || !StringUtils.isValidRUC(data.ruc)) {
            this.mostrarError('RUC inválido');
            return false;
        }

        if (!data.monto || data.monto <= 0) {
            this.mostrarError('El monto debe ser mayor a 0');
            return false;
        }

        if (!data.fechaInicio || !data.fechaFin) {
            this.mostrarError('Las fechas son requeridas');
            return false;
        }

        if (data.fechaInicio > data.fechaFin) {
            this.mostrarError('La fecha de inicio debe ser anterior a la fecha de fin');
            return false;
        }

        return true;
    }

    // Crear nuevo contrato
    async crearContrato(data) {
        data.id = StringUtils.generateUniqueCode('CT');
        data.estado = 'active';
        data.fechaCreacion = new Date();
        
        await db.contracts.add(data);
    }

    // Actualizar contrato existente
    async actualizarContrato(data) {
        await db.contracts.update(data.id, data);
    }

    // Cargar contrato para edición
    async cargarContrato(id) {
        try {
            const contract = await db.contracts.get(id);
            if (!contract) throw new Error('Contrato no encontrado');

            this.form.id.value = contract.id;
            this.form.codigo.value = contract.codigo;
            this.form.ruc.value = contract.ruc;
            this.form.razonSocial.value = contract.razonSocial;
            this.form.monto.value = contract.monto;
            this.form.fechaInicio.value = DateUtils.formatDate(contract.fechaInicio);
            this.form.fechaFin.value = DateUtils.formatDate(contract.fechaFin);
            this.form.estado.value = contract.estado;
            this.form.descripcion.value = contract.descripcion;

            this.calcularMontos(contract.monto);
        } catch (error) {
            console.error('Error al cargar contrato:', error);
            this.contractManager.notifications.addNotification(
                'Error',
                'Error al cargar el contrato',
                'error'
            );
        }
    }

    // Limpiar formulario
    limpiarFormulario() {
        this.form.reset();
        this.form.id.value = '';
        document.getElementById('montoIGV').textContent = '0.00';
        document.getElementById('montoTotal').textContent = '0.00';
    }

    // Calcular montos (IGV y total)
    calcularMontos(monto) {
        const montoNum = NumberUtils.parseNumber(monto);
        const igv = NumberUtils.calculateIGV(montoNum);
        const total = NumberUtils.calculateWithIGV(montoNum);

        document.getElementById('montoIGV').textContent = FormatUtils.formatAmount(igv);
        document.getElementById('montoTotal').textContent = FormatUtils.formatAmount(total);
    }

    // Validar RUC
    validarRUC(ruc) {
        if (!StringUtils.isValidRUC(ruc)) {
            this.mostrarError('RUC inválido');
            return false;
        }
        return true;
    }

    // Validar fechas
    validarFechas() {
        const fechaInicio = DateUtils.parseDate(document.getElementById('fechaInicio').value);
        const fechaFin = DateUtils.parseDate(document.getElementById('fechaFin').value);

        if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
            this.mostrarError('La fecha de inicio debe ser anterior a la fecha de fin');
            return false;
        }
        return true;
    }

    // Mostrar error
    mostrarError(mensaje) {
        this.contractManager.notifications.addNotification(
            'Error de Validación',
            mensaje,
            'error'
        );
    }
} 