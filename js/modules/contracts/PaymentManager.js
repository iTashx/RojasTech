// Módulo de gestión de pagos
import { db } from '../../database.js';
import { Notifications } from '../utils/Notifications.js';
import { FormatUtils } from '../utils/FormatUtils.js';

export class PaymentManager {
    constructor() {
        this.notifications = new Notifications();
    }

    // Crear pago
    async createPayment(data) {
        try {
            // Validar datos
            if (!data.contractId) throw new Error('El ID del contrato es requerido');
            if (!data.monto) throw new Error('El monto es requerido');
            if (!data.fecha) throw new Error('La fecha es requerida');

            // Validar contrato
            const contract = await db.contracts.get(data.contractId);
            if (!contract) {
                this.notifications.error('Contrato no encontrado');
                return false;
            }

            // Crear pago
            const paymentId = await db.payments.add({
                ...data,
                estado: 'pending',
                fechaCreacion: new Date()
            });

            this.notifications.success('Pago creado');
            return paymentId;
        } catch (error) {
            console.error('Error al crear pago:', error);
            this.notifications.error(error.message || 'Error al crear pago');
            return false;
        }
    }

    // Actualizar pago
    async updatePayment(id, data) {
        try {
            // Validar pago
            const payment = await db.payments.get(id);
            if (!payment) {
                this.notifications.error('Pago no encontrado');
                return false;
            }

            // Actualizar pago
            await db.payments.update(id, data);

            this.notifications.success('Pago actualizado');
            return true;
        } catch (error) {
            console.error('Error al actualizar pago:', error);
            this.notifications.error(error.message || 'Error al actualizar pago');
            return false;
        }
    }

    // Eliminar pago
    async deletePayment(id) {
        try {
            // Validar pago
            const payment = await db.payments.get(id);
            if (!payment) {
                this.notifications.error('Pago no encontrado');
                return false;
            }

            // Eliminar pago
            await db.payments.delete(id);

            this.notifications.success('Pago eliminado');
            return true;
        } catch (error) {
            console.error('Error al eliminar pago:', error);
            this.notifications.error(error.message || 'Error al eliminar pago');
            return false;
        }
    }

    // Obtener pago por ID
    async getPaymentById(id) {
        try {
            const payment = await db.payments.get(id);
            if (!payment) {
                this.notifications.error('Pago no encontrado');
                return null;
            }
            return payment;
        } catch (error) {
            console.error('Error al obtener pago:', error);
            this.notifications.error(error.message || 'Error al obtener pago');
            return null;
        }
    }

    // Listar pagos por contrato
    async listPaymentsByContract(contractId) {
        try {
            const payments = await db.payments
                .where('contractId')
                .equals(contractId)
                .sortBy('fecha');

            return payments;
        } catch (error) {
            console.error('Error al listar pagos:', error);
            this.notifications.error(error.message || 'Error al listar pagos');
            return [];
        }
    }

    // Actualizar estado
    async updateStatus(id, status) {
        try {
            // Validar pago
            const payment = await db.payments.get(id);
            if (!payment) {
                this.notifications.error('Pago no encontrado');
                return false;
            }

            // Validar estado
            const validStatus = ['pending', 'paid', 'overdue', 'cancelled'];
            if (!validStatus.includes(status)) {
                this.notifications.error('Estado no válido');
                return false;
            }

            // Actualizar estado
            await db.payments.update(id, { estado: status });

            this.notifications.success('Estado actualizado');
            return true;
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            this.notifications.error(error.message || 'Error al actualizar estado');
            return false;
        }
    }

    // Obtener estadísticas por contrato
    async getStatsByContract(contractId) {
        try {
            const payments = await db.payments
                .where('contractId')
                .equals(contractId)
                .toArray();

            const stats = {
                total: payments.length,
                montoTotal: payments.reduce((sum, p) => sum + Number(p.monto), 0),
                montoPagado: payments
                    .filter(p => p.estado === 'paid')
                    .reduce((sum, p) => sum + Number(p.monto), 0),
                montoPendiente: payments
                    .filter(p => p.estado === 'pending')
                    .reduce((sum, p) => sum + Number(p.monto), 0),
                montoVencido: payments
                    .filter(p => p.estado === 'overdue')
                    .reduce((sum, p) => sum + Number(p.monto), 0),
                montoCancelado: payments
                    .filter(p => p.estado === 'cancelled')
                    .reduce((sum, p) => sum + Number(p.monto), 0)
            };

            return stats;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            this.notifications.error(error.message || 'Error al obtener estadísticas');
            return null;
        }
    }

    // Obtener pagos por estado
    async getPaymentsByStatus(contractId, status) {
        try {
            const payments = await db.payments
                .where('contractId')
                .equals(contractId)
                .and(payment => payment.estado === status)
                .toArray();

            return payments;
        } catch (error) {
            console.error('Error al obtener pagos por estado:', error);
            this.notifications.error(error.message || 'Error al obtener pagos por estado');
            return [];
        }
    }

    // Obtener pagos por monto
    async getPaymentsByAmount(contractId, minAmount, maxAmount) {
        try {
            const payments = await db.payments
                .where('contractId')
                .equals(contractId)
                .and(payment => {
                    const monto = Number(payment.monto);
                    return monto >= minAmount && monto <= maxAmount;
                })
                .toArray();

            return payments;
        } catch (error) {
            console.error('Error al obtener pagos por monto:', error);
            this.notifications.error(error.message || 'Error al obtener pagos por monto');
            return [];
        }
    }

    // Obtener pagos por fecha
    async getPaymentsByDate(contractId, startDate, endDate) {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            const payments = await db.payments
                .where('contractId')
                .equals(contractId)
                .and(payment => {
                    const fecha = new Date(payment.fecha);
                    return fecha >= start && fecha <= end;
                })
                .toArray();

            return payments;
        } catch (error) {
            console.error('Error al obtener pagos por fecha:', error);
            this.notifications.error(error.message || 'Error al obtener pagos por fecha');
            return [];
        }
    }

    // Obtener pagos vencidos
    async getOverduePayments(contractId) {
        try {
            const today = new Date();

            const payments = await db.payments
                .where('contractId')
                .equals(contractId)
                .and(payment => {
                    const fecha = new Date(payment.fecha);
                    return fecha < today && payment.estado === 'pending';
                })
                .toArray();

            // Actualizar estado
            for (const payment of payments) {
                await db.payments.update(payment.id, { estado: 'overdue' });
            }

            return payments;
        } catch (error) {
            console.error('Error al obtener pagos vencidos:', error);
            this.notifications.error(error.message || 'Error al obtener pagos vencidos');
            return [];
        }
    }

    // Obtener pagos por vencer
    async getUpcomingPayments(contractId, days = 30) {
        try {
            const today = new Date();
            const limitDate = new Date();
            limitDate.setDate(today.getDate() + days);

            const payments = await db.payments
                .where('contractId')
                .equals(contractId)
                .and(payment => {
                    const fecha = new Date(payment.fecha);
                    return fecha >= today && fecha <= limitDate && payment.estado === 'pending';
                })
                .toArray();

            return payments;
        } catch (error) {
            console.error('Error al obtener pagos por vencer:', error);
            this.notifications.error(error.message || 'Error al obtener pagos por vencer');
            return [];
        }
    }

    // Obtener pagos por búsqueda
    async searchPayments(contractId, query) {
        try {
            const payments = await db.payments
                .where('contractId')
                .equals(contractId)
                .toArray();

            return payments.filter(payment => {
                const searchStr = `
                    ${payment.monto}
                    ${payment.fecha}
                    ${payment.estado}
                    ${payment.observaciones || ''}
                `.toLowerCase();

                return searchStr.includes(query.toLowerCase());
            });
        } catch (error) {
            console.error('Error al buscar pagos:', error);
            this.notifications.error(error.message || 'Error al buscar pagos');
            return [];
        }
    }
} 