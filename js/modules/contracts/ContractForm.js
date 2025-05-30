// Módulo de formulario de contratos
import { db } from '../../database.js';
import { DateUtils } from '../utils/DateUtils.js';
import { NumberUtils } from '../utils/NumberUtils.js';
import { StringUtils } from '../utils/StringUtils.js';
import { FormatUtils } from '../utils/FormatUtils.js';

export class ContractForm {
    constructor(contractManager) {
        this.contractManager = contractManager;
        this.form = document.getElementById('contract-form');
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

        // Gasto administrativo como partida
        document.addEventListener('DOMContentLoaded', function () {
            let guardado = false;
            const checkboxGastoAdmin = document.getElementById('incluir-gasto-administrativo');
            const modalGastoAdminEl = document.getElementById('modalGastoAdministrativo');
            const modalGastoAdmin = new bootstrap.Modal(modalGastoAdminEl);
            const inputPorcentaje = document.getElementById('gasto-admin-porcentaje');
            const inputMonto = document.getElementById('gasto-admin-monto');

            if (checkboxGastoAdmin) {
                checkboxGastoAdmin.addEventListener('change', function() {
                    guardado = false;
                    if (this.checked) {
                        modalGastoAdmin.show();
                    }
                });
            }

            document.getElementById('guardar-gasto-admin').addEventListener('click', function() {
                const monto = parseFloat(inputMonto.value) || 0;
                const porcentaje = parseFloat(inputPorcentaje.value) || 0;
                if (monto <= 0 && porcentaje <= 0) {
                    alert('Debe ingresar un monto fijo, un porcentaje, o ambos.');
                    return;
                }
                window.gastoAdministrativoDatos = { monto, porcentaje };
                guardado = true;
                modalGastoAdmin.hide();
            });

            modalGastoAdminEl.addEventListener('hide.bs.modal', function () {
                if (!guardado) {
                    checkboxGastoAdmin.checked = false;
                    inputPorcentaje.value = '';
                    inputMonto.value = '';
                }
            });
        });
    }

    // Manejar envío del formulario
    async handleSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = this.getFormData();
            
            // Validaciones específicas
            if (!formData.codigo) {
                this.mostrarError('El código del contrato es requerido');
                return;
            }

            if (!formData.ruc || !this.validarRUC(formData.ruc)) {
                this.mostrarError('El RUC debe ser válido y contener 11 dígitos');
                return;
            }

            if (!formData.razonSocial) {
                this.mostrarError('La razón social es requerida');
                return;
            }

            if (!formData.fechaInicio || !formData.fechaFin) {
                this.mostrarError('Las fechas de inicio y fin son requeridas');
                return;
            }

            if (new Date(formData.fechaInicio) > new Date(formData.fechaFin)) {
                this.mostrarError('La fecha de inicio no puede ser posterior a la fecha de fin');
                return;
            }

            // Validar que los montos sean números válidos
            if (isNaN(formData.monto) || formData.monto <= 0) {
                this.mostrarError('El monto debe ser un número válido mayor a 0');
                return;
            }

            // Formatear montos antes de guardar
            formData.monto = NumberUtils.formatNumber(formData.monto);
            formData.subtotal = NumberUtils.formatNumber(formData.subtotal);
            formData.igv = NumberUtils.formatNumber(formData.igv);
            formData.total = NumberUtils.formatNumber(formData.total);

            // Guardar en la base de datos
            if (formData.id) {
                await db.contracts.update(formData.id, formData);
            } else {
                await db.contracts.add(formData);
            }

            this.limpiarFormulario();
            await this.contractManager.loadContracts();
            
            this.contractManager.notifications.addNotification(
                'Éxito',
                `Contrato ${formData.id ? 'actualizado' : 'creado'} correctamente`,
                'success'
            );

            // Al guardar el contrato, agregar la partida #1 si corresponde
            const formContrato = document.getElementById('contract-form');
            if (checkboxGastoAdmin.checked && window.gastoAdministrativoDatos) {
                let montoFinal = window.gastoAdministrativoDatos.monto;
                if (window.gastoAdministrativoDatos.porcentaje > 0) {
                    const montoContrato = parseFloat(document.getElementById('monto-total-contrato').value) || 0;
                    montoFinal += (montoContrato * window.gastoAdministrativoDatos.porcentaje / 100);
                }
                // Verificar que PartidaManager esté disponible
                if (window.PartidaManager) {
                    window.PartidaManager.createPartida({
                        contractId: formData.id,
                        codigo: 'GA-1',
                        descripcion: 'Gasto Administrativo',
                        monto: montoFinal.toFixed(2)
                    });
                } else {
                    console.warn('PartidaManager no está disponible para crear la partida de gasto administrativo');
                    this.contractManager.notifications.addNotification(
                        'Advertencia',
                        'No se pudo crear la partida de gasto administrativo. Por favor, intente nuevamente.',
                        'warning'
                    );
                }
            }
        } catch (error) {
            console.error('Error al procesar el contrato:', error);
            this.contractManager.notifications.addNotification(
                'Error',
                'Error al procesar el contrato: ' + error.message,
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
        return /^\d{11}$/.test(ruc);
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