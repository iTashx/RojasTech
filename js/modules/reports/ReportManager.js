// Módulo de gestión de reportes
import { db } from '../../database.js';
import { Notifications } from '../utils/Notifications.js';
import { FormatUtils } from '../utils/FormatUtils.js';
import { ContractManager } from '../contracts/ContractManager.js';
import { PartidaManager } from '../contracts/PartidaManager.js';
import { PaymentManager } from '../contracts/PaymentManager.js';
import { DocumentManager } from '../contracts/DocumentManager.js';

export class ReportManager {
    constructor() {
        this.notifications = new Notifications();
        this.contractManager = new ContractManager();
        this.partidaManager = new PartidaManager();
        this.paymentManager = new PaymentManager();
        this.documentManager = new DocumentManager();
    }

    // Generar reporte de contratos
    async generateContractsReport(filters = {}) {
        try {
            // Obtener contratos
            const contracts = await this.contractManager.listContracts(filters);
            if (!contracts.length) {
                this.notifications.warning('No hay contratos para generar el reporte');
                return null;
            }

            // Generar reporte
            const report = {
                fecha: new Date(),
                total: contracts.length,
                montoTotal: contracts.reduce((sum, c) => sum + Number(c.monto), 0),
                contratos: contracts.map(contract => ({
                    codigo: contract.codigo,
                    ruc: contract.ruc,
                    razonSocial: contract.razonSocial,
                    monto: contract.monto,
                    fechaInicio: contract.fechaInicio,
                    fechaFin: contract.fechaFin,
                    estado: contract.estado
                }))
            };

            return report;
        } catch (error) {
            console.error('Error al generar reporte de contratos:', error);
            this.notifications.error(error.message || 'Error al generar reporte de contratos');
            return null;
        }
    }

    // Generar reporte de partidas
    async generatePartidasReport(contractId) {
        try {
            // Obtener partidas
            const partidas = await this.partidaManager.listPartidasByContract(contractId);
            if (!partidas.length) {
                this.notifications.warning('No hay partidas para generar el reporte');
                return null;
            }

            // Obtener estadísticas
            const stats = await this.partidaManager.getStatsByContract(contractId);

            // Generar reporte
            const report = {
                fecha: new Date(),
                contractId,
                total: partidas.length,
                montoTotal: stats.montoTotal,
                avancePromedio: stats.avancePromedio,
                partidas: partidas.map(partida => ({
                    codigo: partida.codigo,
                    descripcion: partida.descripcion,
                    monto: partida.monto,
                    avance: partida.avance
                }))
            };

            return report;
        } catch (error) {
            console.error('Error al generar reporte de partidas:', error);
            this.notifications.error(error.message || 'Error al generar reporte de partidas');
            return null;
        }
    }

    // Generar reporte de pagos
    async generatePaymentsReport(contractId) {
        try {
            // Obtener pagos
            const payments = await this.paymentManager.listPaymentsByContract(contractId);
            if (!payments.length) {
                this.notifications.warning('No hay pagos para generar el reporte');
                return null;
            }

            // Obtener estadísticas
            const stats = await this.paymentManager.getStatsByContract(contractId);

            // Generar reporte
            const report = {
                fecha: new Date(),
                contractId,
                total: payments.length,
                montoTotal: stats.montoTotal,
                montoPagado: stats.montoPagado,
                montoPendiente: stats.montoPendiente,
                montoVencido: stats.montoVencido,
                pagos: payments.map(payment => ({
                    monto: payment.monto,
                    fecha: payment.fecha,
                    estado: payment.estado
                }))
            };

            return report;
        } catch (error) {
            console.error('Error al generar reporte de pagos:', error);
            this.notifications.error(error.message || 'Error al generar reporte de pagos');
            return null;
        }
    }

    // Generar reporte de documentos
    async generateDocumentsReport(contractId) {
        try {
            // Obtener documentos
            const documents = await this.documentManager.listDocumentsByContract(contractId);
            if (!documents.length) {
                this.notifications.warning('No hay documentos para generar el reporte');
                return null;
            }

            // Generar reporte
            const report = {
                fecha: new Date(),
                contractId,
                total: documents.length,
                documentos: documents.map(document => ({
                    tipo: document.tipo,
                    nombre: document.nombre,
                    url: document.url,
                    fechaCreacion: document.fechaCreacion
                }))
            };

            return report;
        } catch (error) {
            console.error('Error al generar reporte de documentos:', error);
            this.notifications.error(error.message || 'Error al generar reporte de documentos');
            return null;
        }
    }

    // Generar reporte de estado
    async generateStatusReport(contractId) {
        try {
            // Obtener contrato
            const contract = await this.contractManager.getContractById(contractId);
            if (!contract) {
                this.notifications.error('Contrato no encontrado');
                return null;
            }

            // Obtener partidas
            const partidas = await this.partidaManager.listPartidasByContract(contractId);
            const partidasStats = await this.partidaManager.getStatsByContract(contractId);

            // Obtener pagos
            const payments = await this.paymentManager.listPaymentsByContract(contractId);
            const paymentsStats = await this.paymentManager.getStatsByContract(contractId);

            // Obtener documentos
            const documents = await this.documentManager.listDocumentsByContract(contractId);

            // Generar reporte
            const report = {
                fecha: new Date(),
                contrato: {
                    codigo: contract.codigo,
                    ruc: contract.ruc,
                    razonSocial: contract.razonSocial,
                    monto: contract.monto,
                    fechaInicio: contract.fechaInicio,
                    fechaFin: contract.fechaFin,
                    estado: contract.estado
                },
                partidas: {
                    total: partidas.length,
                    montoTotal: partidasStats.montoTotal,
                    avancePromedio: partidasStats.avancePromedio,
                    completadas: partidasStats.completadas,
                    enProgreso: partidasStats.enProgreso,
                    noIniciadas: partidasStats.noIniciadas
                },
                pagos: {
                    total: payments.length,
                    montoTotal: paymentsStats.montoTotal,
                    montoPagado: paymentsStats.montoPagado,
                    montoPendiente: paymentsStats.montoPendiente,
                    montoVencido: paymentsStats.montoVencido
                },
                documentos: {
                    total: documents.length,
                    tipos: this.documentManager.getDocumentTypes().map(type => ({
                        tipo: type.id,
                        nombre: type.nombre,
                        cantidad: documents.filter(d => d.tipo === type.id).length
                    }))
                }
            };

            return report;
        } catch (error) {
            console.error('Error al generar reporte de estado:', error);
            this.notifications.error(error.message || 'Error al generar reporte de estado');
            return null;
        }
    }

    // Generar reporte de vencimientos
    async generateExpirationReport(days = 30) {
        try {
            // Obtener contratos por vencer
            const expiringContracts = await this.contractManager.getExpiringContracts(days);
            if (!expiringContracts.length) {
                this.notifications.warning('No hay contratos por vencer');
                return null;
            }

            // Generar reporte
            const report = {
                fecha: new Date(),
                dias: days,
                total: expiringContracts.length,
                contratos: expiringContracts.map(contract => ({
                    codigo: contract.codigo,
                    ruc: contract.ruc,
                    razonSocial: contract.razonSocial,
                    monto: contract.monto,
                    fechaFin: contract.fechaFin,
                    diasRestantes: Math.ceil((new Date(contract.fechaFin) - new Date()) / (1000 * 60 * 60 * 24))
                }))
            };

            return report;
        } catch (error) {
            console.error('Error al generar reporte de vencimientos:', error);
            this.notifications.error(error.message || 'Error al generar reporte de vencimientos');
            return null;
        }
    }

    // Generar reporte de pagos vencidos
    async generateOverduePaymentsReport(contractId) {
        try {
            // Obtener pagos vencidos
            const overduePayments = await this.paymentManager.getOverduePayments(contractId);
            if (!overduePayments.length) {
                this.notifications.warning('No hay pagos vencidos');
                return null;
            }

            // Generar reporte
            const report = {
                fecha: new Date(),
                contractId,
                total: overduePayments.length,
                montoTotal: overduePayments.reduce((sum, p) => sum + Number(p.monto), 0),
                pagos: overduePayments.map(payment => ({
                    monto: payment.monto,
                    fecha: payment.fecha,
                    diasVencido: Math.ceil((new Date() - new Date(payment.fecha)) / (1000 * 60 * 60 * 24))
                }))
            };

            return report;
        } catch (error) {
            console.error('Error al generar reporte de pagos vencidos:', error);
            this.notifications.error(error.message || 'Error al generar reporte de pagos vencidos');
            return null;
        }
    }

    // Generar reporte de pagos por vencer
    async generateUpcomingPaymentsReport(contractId, days = 30) {
        try {
            // Obtener pagos por vencer
            const upcomingPayments = await this.paymentManager.getUpcomingPayments(contractId, days);
            if (!upcomingPayments.length) {
                this.notifications.warning('No hay pagos por vencer');
                return null;
            }

            // Generar reporte
            const report = {
                fecha: new Date(),
                contractId,
                dias: days,
                total: upcomingPayments.length,
                montoTotal: upcomingPayments.reduce((sum, p) => sum + Number(p.monto), 0),
                pagos: upcomingPayments.map(payment => ({
                    monto: payment.monto,
                    fecha: payment.fecha,
                    diasRestantes: Math.ceil((new Date(payment.fecha) - new Date()) / (1000 * 60 * 60 * 24))
                }))
            };

            return report;
        } catch (error) {
            console.error('Error al generar reporte de pagos por vencer:', error);
            this.notifications.error(error.message || 'Error al generar reporte de pagos por vencer');
            return null;
        }
    }

    // Exportar reporte a PDF
    async exportToPDF(report, filename) {
        try {
            // TODO: Implementar exportación a PDF
            this.notifications.info('Exportación a PDF no implementada');
            return false;
        } catch (error) {
            console.error('Error al exportar reporte a PDF:', error);
            this.notifications.error(error.message || 'Error al exportar reporte a PDF');
            return false;
        }
    }

    // Exportar reporte a Excel
    async exportToExcel(report, filename) {
        try {
            // TODO: Implementar exportación a Excel
            this.notifications.info('Exportación a Excel no implementada');
            return false;
        } catch (error) {
            console.error('Error al exportar reporte a Excel:', error);
            this.notifications.error(error.message || 'Error al exportar reporte a Excel');
            return false;
        }
    }
} 