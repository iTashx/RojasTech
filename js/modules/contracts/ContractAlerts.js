import { db } from '../../database.js';
import NotificationManager from '../notifications/NotificationManager.js';
import { DateUtils } from '../utils/DateUtils.js';
import { NumberUtils } from '../utils/NumberUtils.js';

export class ContractAlerts {
    constructor() {
        this.notificationManager = NotificationManager;
        this.checkInterval = 24 * 60 * 60 * 1000; // 24 horas
        this.initializeAlerts();
    }

    async initializeAlerts() {
        // Verificar alertas al iniciar
        await this.checkContractAlerts();
        
        // Configurar verificación periódica
        setInterval(() => this.checkContractAlerts(), this.checkInterval);
    }

    async checkContractAlerts() {
        try {
            const contracts = await db.contracts.toArray();
            const today = new Date();

            for (const contract of contracts) {
                // Verificar vencimiento
                await this.checkContractExpiry(contract, today);
                
                // Verificar montos
                await this.checkContractAmounts(contract);
                
                // Verificar avances
                await this.checkContractProgress(contract);
            }
        } catch (error) {
            console.error('Error al verificar alertas de contratos:', error);
        }
    }

    async checkContractExpiry(contract, today) {
        const endDate = new Date(contract.fechaTerminacion);
        const daysLeft = DateUtils.daysBetween(today, endDate);

        if (daysLeft <= 30 && daysLeft > 0) {
            await this.notificationManager.notifyContractExpiry(
                contract.numeroSicac,
                daysLeft
            );
        }
    }

    async checkContractAmounts(contract) {
        const hesList = await db.hes
            .where('contratoId')
            .equals(contract.id)
            .toArray();

        const totalHESAmount = hesList.reduce((sum, hes) => sum + hes.total, 0);
        const percentageUsed = (totalHESAmount / contract.montoTotal) * 100;

        if (percentageUsed >= 90) {
            await this.notificationManager.createNotification(
                'Alerta de Monto',
                `El contrato ${contract.numeroSicac} ha alcanzado el ${percentageUsed.toFixed(2)}% de su monto total`,
                'warning'
            );
        }
    }

    async checkContractProgress(contract) {
        const hesList = await db.hes
            .where('contratoId')
            .equals(contract.id)
            .toArray();

        // Calcular avance físico
        const physicalProgress = this.calculatePhysicalProgress(contract);
        if (physicalProgress.percentage < 50 && this.isContractHalfway(contract)) {
            await this.notificationManager.createNotification(
                'Alerta de Avance Físico',
                `El contrato ${contract.numeroSicac} tiene un avance físico del ${physicalProgress.percentage.toFixed(2)}%`,
                'warning'
            );
        }

        // Calcular avance financiero
        const financialProgress = this.calculateFinancialProgress(contract);
        if (financialProgress.percentage < 50 && this.isContractHalfway(contract)) {
            await this.notificationManager.createNotification(
                'Alerta de Avance Financiero',
                `El contrato ${contract.numeroSicac} tiene un avance financiero del ${financialProgress.percentage.toFixed(2)}%`,
                'warning'
            );
        }
    }

    calculatePhysicalProgress(contract) {
        if (!contract || !contract.partidas || contract.partidas.length === 0) {
            return {
                percentage: 0,
                executedQuantity: 0,
                totalQuantity: 0
            };
        }

        const totalQuantity = contract.partidas.reduce((sum, partida) => sum + (partida.cantidad || 0), 0);
        const executedQuantity = contract.partidas.reduce((sum, partida) => sum + (partida.avance || 0), 0);
        const percentage = totalQuantity > 0 ? (executedQuantity / totalQuantity) * 100 : 0;

        return {
            percentage: NumberUtils.formatNumber(percentage),
            executedQuantity: NumberUtils.formatNumber(executedQuantity),
            totalQuantity: NumberUtils.formatNumber(totalQuantity)
        };
    }

    calculateFinancialProgress(contract) {
        if (!contract || !contract.hesList || contract.hesList.length === 0) {
            return {
                percentage: 0,
                executedAmount: 0,
                totalAmount: 0
            };
        }

        const totalAmount = contract.montoTotal || 0;
        const executedAmount = contract.hesList.reduce((sum, hes) => sum + (hes.total || 0), 0);
        const percentage = totalAmount > 0 ? (executedAmount / totalAmount) * 100 : 0;

        return {
            percentage: NumberUtils.formatNumber(percentage),
            executedAmount: NumberUtils.formatCurrency(executedAmount, contract.moneda),
            totalAmount: NumberUtils.formatCurrency(totalAmount, contract.moneda)
        };
    }

    isContractHalfway(contract) {
        const startDate = new Date(contract.fechaInicio);
        const endDate = new Date(contract.fechaTerminacion);
        const today = new Date();
        
        const totalDuration = endDate - startDate;
        const elapsedDuration = today - startDate;
        
        return elapsedDuration >= (totalDuration / 2);
    }
}

export default new ContractAlerts(); 