// Módulo de partidas de contratos
import { db } from '../../database.js';
import { NumberUtils } from '../utils/NumberUtils.js';
import { FormatUtils } from '../utils/FormatUtils.js';

export class ContractPartidas {
    constructor(contractManager) {
        this.contractManager = contractManager;
        this.setupEventListeners();
    }

    // Configurar event listeners
    setupEventListeners() {
        document.getElementById('addPartidaBtn').addEventListener('click', () => {
            this.mostrarFormularioPartida();
        });

        document.getElementById('partidaForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarPartida();
        });
    }

    // Mostrar formulario de partida
    mostrarFormularioPartida(partida = null) {
        const modal = document.getElementById('partidaModal');
        const form = document.getElementById('partidaForm');
        
        if (partida) {
            form.id.value = partida.id;
            form.codigo.value = partida.codigo;
            form.descripcion.value = partida.descripcion;
            form.monto.value = partida.monto;
            form.avance.value = partida.avance;
        } else {
            form.reset();
            form.id.value = '';
        }

        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }

    // Guardar partida
    async guardarPartida() {
        try {
            const formData = this.getFormData();
            
            if (!this.validarPartida(formData)) {
                return;
            }

            if (formData.id) {
                await this.actualizarPartida(formData);
            } else {
                await this.crearPartida(formData);
            }

            this.cerrarModal();
            await this.cargarPartidas(formData.contractId);
            
            this.contractManager.notifications.addNotification(
                'Éxito',
                `Partida ${formData.id ? 'actualizada' : 'creada'} correctamente`,
                'success'
            );
        } catch (error) {
            console.error('Error al guardar partida:', error);
            this.contractManager.notifications.addNotification(
                'Error',
                'Error al guardar la partida',
                'error'
            );
        }
    }

    // Obtener datos del formulario
    getFormData() {
        const form = document.getElementById('partidaForm');
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Convertir tipos de datos
        data.monto = NumberUtils.parseNumber(data.monto);
        data.avance = NumberUtils.parseNumber(data.avance);
        
        return data;
    }

    // Validar partida
    validarPartida(data) {
        if (!data.codigo) {
            this.mostrarError('El código es requerido');
            return false;
        }

        if (!data.descripcion) {
            this.mostrarError('La descripción es requerida');
            return false;
        }

        if (!data.monto || data.monto <= 0) {
            this.mostrarError('El monto debe ser mayor a 0');
            return false;
        }

        if (data.avance < 0 || data.avance > 100) {
            this.mostrarError('El avance debe estar entre 0 y 100');
            return false;
        }

        return true;
    }

    // Crear nueva partida
    async crearPartida(data) {
        data.id = StringUtils.generateUniqueCode('PT');
        data.fechaCreacion = new Date();
        
        await db.partidas.add(data);
    }

    // Actualizar partida existente
    async actualizarPartida(data) {
        await db.partidas.update(data.id, data);
    }

    // Cargar partidas de un contrato
    async cargarPartidas(contractId) {
        try {
            const partidas = await db.partidas
                .where('contractId')
                .equals(contractId)
                .toArray();

            this.renderPartidas(partidas);
        } catch (error) {
            console.error('Error al cargar partidas:', error);
            this.contractManager.notifications.addNotification(
                'Error',
                'Error al cargar las partidas',
                'error'
            );
        }
    }

    // Renderizar partidas
    renderPartidas(partidas) {
        const tbody = document.getElementById('partidasTableBody');
        tbody.innerHTML = '';

        partidas.forEach(partida => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${partida.codigo}</td>
                <td>${partida.descripcion}</td>
                <td>${FormatUtils.formatAmount(partida.monto)}</td>
                <td>${FormatUtils.formatProgressStatus(partida.avance)}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-partida" data-id="${partida.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-partida" data-id="${partida.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

            // Agregar event listeners a los botones
            tr.querySelector('.edit-partida').addEventListener('click', () => {
                this.mostrarFormularioPartida(partida);
            });

            tr.querySelector('.delete-partida').addEventListener('click', () => {
                this.eliminarPartida(partida.id);
            });

            tbody.appendChild(tr);
        });
    }

    // Eliminar partida
    async eliminarPartida(id) {
        if (!confirm('¿Está seguro de eliminar esta partida?')) {
            return;
        }

        try {
            await db.partidas.delete(id);
            await this.cargarPartidas(document.getElementById('contractId').value);
            
            this.contractManager.notifications.addNotification(
                'Éxito',
                'Partida eliminada correctamente',
                'success'
            );
        } catch (error) {
            console.error('Error al eliminar partida:', error);
            this.contractManager.notifications.addNotification(
                'Error',
                'Error al eliminar la partida',
                'error'
            );
        }
    }

    // Calcular avance físico
    async calcularAvanceFisico(contractId) {
        try {
            const partidas = await db.partidas
                .where('contractId')
                .equals(contractId)
                .toArray();

            if (!partidas.length) return 0;

            const totalMonto = partidas.reduce((sum, p) => sum + p.monto, 0);
            const avancePonderado = partidas.reduce((sum, p) => {
                return sum + (p.monto * p.avance / 100);
            }, 0);

            return NumberUtils.round((avancePonderado / totalMonto) * 100, 2);
        } catch (error) {
            console.error('Error al calcular avance físico:', error);
            return 0;
        }
    }

    // Calcular avance financiero
    async calcularAvanceFinanciero(contractId) {
        try {
            const partidas = await db.partidas
                .where('contractId')
                .equals(contractId)
                .toArray();

            if (!partidas.length) return 0;

            const totalMonto = partidas.reduce((sum, p) => sum + p.monto, 0);
            const montoEjecutado = partidas.reduce((sum, p) => {
                return sum + (p.monto * p.avance / 100);
            }, 0);

            return NumberUtils.round((montoEjecutado / totalMonto) * 100, 2);
        } catch (error) {
            console.error('Error al calcular avance financiero:', error);
            return 0;
        }
    }

    // Cerrar modal
    cerrarModal() {
        const modal = document.getElementById('partidaModal');
        const modalInstance = bootstrap.Modal.getInstance(modal);
        modalInstance.hide();
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