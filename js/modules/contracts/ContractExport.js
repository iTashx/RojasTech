// Módulo de exportación de contratos
import { db } from '../../database.js';
import { DateUtils } from '../utils/DateUtils.js';
import { FormatUtils } from '../utils/FormatUtils.js';
import { formatMonto, formatDate } from '../utils/formatters.js';
import { showToast } from '../utils/ui.js';

export class ContractExport {
    constructor(contractManager) {
        this.contractManager = contractManager;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const exportBtn = document.getElementById('export-contracts-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', this.exportContracts.bind(this));
        }
    }

    async exportContracts() {
        try {
            const contracts = await db.contracts.toArray();
            const data = this.prepareContractData(contracts);
            this.downloadExcel(data);
            showToast('Exportación completada exitosamente', 'success');
        } catch (error) {
            showToast('Error al exportar los contratos: ' + error.message, 'error');
        }
    }

    prepareContractData(contracts) {
        return contracts.map(contract => ({
            'Número de Proveedor': contract.numeroProveedor,
            'Fecha de Firma': formatDate(contract.fechaFirma),
            'Fecha de Inicio': formatDate(contract.fechaInicio),
            'Fecha de Terminación': formatDate(contract.fechaTerminacion),
            'Número SICAC': contract.numeroSicac,
            'División/Área': contract.divisionArea,
            'EEMN': contract.eemn,
            'Región': contract.region,
            'Naturaleza de Contratación': contract.naturalezaContratacion,
            'Línea de Servicio': contract.lineaServicio,
            'No. Petición/Oferta': contract.noPeticionOferta,
            'Modalidad de Contratación': contract.modalidadContratacion,
            'Régimen Laboral': contract.regimenLaboral,
            'Objeto Contractual': contract.objetoContractual,
            'Monto Original': formatMonto(contract.montoOriginal),
            'Monto Modificado': formatMonto(contract.montoModificado),
            'Monto Total': formatMonto(contract.montoTotal),
            'Estatus': contract.estatus,
            'Moneda': contract.moneda
        }));
    }

    downloadExcel(data) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Contratos');
        
        // Ajustar el ancho de las columnas
        const wscols = [
            {wch: 15}, // Número de Proveedor
            {wch: 12}, // Fecha de Firma
            {wch: 12}, // Fecha de Inicio
            {wch: 12}, // Fecha de Terminación
            {wch: 15}, // Número SICAC
            {wch: 20}, // División/Área
            {wch: 10}, // EEMN
            {wch: 15}, // Región
            {wch: 25}, // Naturaleza de Contratación
            {wch: 20}, // Línea de Servicio
            {wch: 20}, // No. Petición/Oferta
            {wch: 25}, // Modalidad de Contratación
            {wch: 20}, // Régimen Laboral
            {wch: 40}, // Objeto Contractual
            {wch: 15}, // Monto Original
            {wch: 15}, // Monto Modificado
            {wch: 15}, // Monto Total
            {wch: 15}, // Estatus
            {wch: 10}  // Moneda
        ];
        worksheet['!cols'] = wscols;

        // Generar el archivo Excel
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Contratos_${formatDate(new Date())}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    async exportContractDetails(contractId) {
        try {
            const contract = await db.contracts.get(contractId);
            if (!contract) {
                throw new Error('Contrato no encontrado');
            }

            const data = this.prepareContractDetailData(contract);
            this.downloadContractDetailExcel(data, contract);
            showToast('Exportación de detalles completada exitosamente', 'success');
        } catch (error) {
            showToast('Error al exportar los detalles del contrato: ' + error.message, 'error');
        }
    }

    prepareContractDetailData(contract) {
        const details = [];
        
        // Información general del contrato
        details.push({
            'Tipo': 'Información General',
            'Campo': 'Número de Proveedor',
            'Valor': contract.numeroProveedor
        });
        details.push({
            'Tipo': 'Información General',
            'Campo': 'Fecha de Firma',
            'Valor': formatDate(contract.fechaFirma)
        });
        // ... Agregar más campos según sea necesario

        // Partidas del contrato
        if (contract.partidas && contract.partidas.length > 0) {
            contract.partidas.forEach((partida, index) => {
                details.push({
                    'Tipo': 'Partida',
                    'Campo': `Partida ${index + 1}`,
                    'Valor': partida.descripcion
                });
                details.push({
                    'Tipo': 'Partida',
                    'Campo': 'Cantidad',
                    'Valor': partida.cantidad
                });
                details.push({
                    'Tipo': 'Partida',
                    'Campo': 'UMD',
                    'Valor': partida.umd
                });
                details.push({
                    'Tipo': 'Partida',
                    'Campo': 'Precio Unitario',
                    'Valor': formatMonto(partida.precioUnitario)
                });
                details.push({
                    'Tipo': 'Partida',
                    'Campo': 'Total',
                    'Valor': formatMonto(partida.total)
                });
            });
        }

        return details;
    }

    downloadContractDetailExcel(data, contract) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Detalles del Contrato');
        
        // Ajustar el ancho de las columnas
        const wscols = [
            {wch: 20}, // Tipo
            {wch: 30}, // Campo
            {wch: 40}  // Valor
        ];
        worksheet['!cols'] = wscols;

        // Generar el archivo Excel
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Detalles_Contrato_${contract.numeroProveedor}_${formatDate(new Date())}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    // Exportar contrato a Excel
    async exportarContratoExcel(id) {
        try {
            const { contract, partidas } = await this.exportarContrato(id);
            
            // Crear libro de Excel
            const wb = XLSX.utils.book_new();
            
            // Hoja de datos del contrato
            const contractData = [
                ['DETALLES DEL CONTRATO'],
                ['Código:', contract.codigo],
                ['Razón Social:', contract.razonSocial],
                ['RUC:', FormatUtils.formatRUC(contract.ruc)],
                ['Monto:', FormatUtils.formatAmount(contract.monto)],
                ['Período:', FormatUtils.formatPeriod(contract.fechaInicio, contract.fechaFin)],
                ['Estado:', FormatUtils.formatStatus(contract.estado)],
                [''],
                ['PARTIDAS DEL CONTRATO'],
                ['Código', 'Descripción', 'Monto', 'Avance']
            ];

            // Agregar partidas
            partidas.forEach(partida => {
                contractData.push([
                    partida.codigo,
                    partida.descripcion,
                    FormatUtils.formatAmount(partida.monto),
                    FormatUtils.formatProgressStatus(partida.avance)
                ]);
            });

            // Crear hoja de cálculo
            const ws = XLSX.utils.aoa_to_sheet(contractData);
            
            // Aplicar estilos
            ws['!cols'] = [
                { wch: 15 }, // Código
                { wch: 40 }, // Descripción
                { wch: 15 }, // Monto
                { wch: 15 }  // Avance
            ];

            // Agregar hoja al libro
            XLSX.utils.book_append_sheet(wb, ws, 'Contrato');

            // Guardar archivo
            XLSX.writeFile(wb, `Contrato_${contract.codigo}.xlsx`);

            this.contractManager.notifications.addNotification(
                'Éxito',
                'Contrato exportado correctamente',
                'success'
            );
        } catch (error) {
            console.error('Error al exportar contrato:', error);
            this.contractManager.notifications.addNotification(
                'Error',
                'Error al exportar el contrato',
                'error'
            );
        }
    }

    // Exportar contrato a PDF
    async exportarContratoPDF(id) {
        try {
            const { contract, partidas } = await this.exportarContrato(id);
            
            // Crear documento PDF
            const doc = new jsPDF();
            
            // Configurar fuentes
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            
            // Título
            doc.text('DETALLES DEL CONTRATO', 105, 20, { align: 'center' });
            
            // Datos del contrato
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            
            let y = 40;
            doc.text(`Código: ${contract.codigo}`, 20, y);
            y += 10;
            doc.text(`Razón Social: ${contract.razonSocial}`, 20, y);
            y += 10;
            doc.text(`RUC: ${FormatUtils.formatRUC(contract.ruc)}`, 20, y);
            y += 10;
            doc.text(`Monto: ${FormatUtils.formatAmount(contract.monto)}`, 20, y);
            y += 10;
            doc.text(`Período: ${FormatUtils.formatPeriod(contract.fechaInicio, contract.fechaFin)}`, 20, y);
            y += 10;
            doc.text(`Estado: ${FormatUtils.formatStatus(contract.estado)}`, 20, y);
            
            // Tabla de partidas
            y += 20;
            doc.setFont('helvetica', 'bold');
            doc.text('PARTIDAS DEL CONTRATO', 20, y);
            
            // Encabezados de la tabla
            y += 10;
            doc.setFontSize(10);
            doc.text('Código', 20, y);
            doc.text('Descripción', 50, y);
            doc.text('Monto', 120, y);
            doc.text('Avance', 160, y);
            
            // Datos de partidas
            doc.setFont('helvetica', 'normal');
            partidas.forEach(partida => {
                y += 10;
                doc.text(partida.codigo, 20, y);
                doc.text(partida.descripcion, 50, y);
                doc.text(FormatUtils.formatAmount(partida.monto), 120, y);
                doc.text(FormatUtils.formatProgressStatus(partida.avance), 160, y);
            });
            
            // Guardar archivo
            doc.save(`Contrato_${contract.codigo}.pdf`);

            this.contractManager.notifications.addNotification(
                'Éxito',
                'Contrato exportado correctamente',
                'success'
            );
        } catch (error) {
            console.error('Error al exportar contrato:', error);
            this.contractManager.notifications.addNotification(
                'Error',
                'Error al exportar el contrato',
                'error'
            );
        }
    }

    // Exportar contrato (obtener datos)
    async exportarContrato(id) {
        try {
            const contract = await db.contracts.get(id);
            if (!contract) throw new Error('Contrato no encontrado');

            const partidas = await db.partidas
                .where('contractId')
                .equals(id)
                .toArray();

            return { contract, partidas };
        } catch (error) {
            console.error('Error al obtener datos del contrato:', error);
            throw error;
        }
    }

    // Exportar todos los contratos a Excel
    async exportarTodosContratosExcel() {
        try {
            const contracts = await db.contracts.toArray();
            
            // Crear libro de Excel
            const wb = XLSX.utils.book_new();
            
            // Hoja de contratos
            const contractsData = [
                ['LISTA DE CONTRATOS'],
                ['Código', 'Razón Social', 'RUC', 'Monto', 'Período', 'Estado']
            ];

            // Agregar contratos
            contracts.forEach(contract => {
                contractsData.push([
                    contract.codigo,
                    contract.razonSocial,
                    FormatUtils.formatRUC(contract.ruc),
                    FormatUtils.formatAmount(contract.monto),
                    FormatUtils.formatPeriod(contract.fechaInicio, contract.fechaFin),
                    FormatUtils.formatStatus(contract.estado)
                ]);
            });

            // Crear hoja de cálculo
            const ws = XLSX.utils.aoa_to_sheet(contractsData);
            
            // Aplicar estilos
            ws['!cols'] = [
                { wch: 15 }, // Código
                { wch: 40 }, // Razón Social
                { wch: 15 }, // RUC
                { wch: 15 }, // Monto
                { wch: 30 }, // Período
                { wch: 15 }  // Estado
            ];

            // Agregar hoja al libro
            XLSX.utils.book_append_sheet(wb, ws, 'Contratos');

            // Guardar archivo
            XLSX.writeFile(wb, 'Lista_Contratos.xlsx');

            this.contractManager.notifications.addNotification(
                'Éxito',
                'Contratos exportados correctamente',
                'success'
            );
        } catch (error) {
            console.error('Error al exportar contratos:', error);
            this.contractManager.notifications.addNotification(
                'Error',
                'Error al exportar los contratos',
                'error'
            );
        }
    }

    // Exportar todos los contratos a PDF
    async exportarTodosContratosPDF() {
        try {
            const contracts = await db.contracts.toArray();
            
            // Crear documento PDF
            const doc = new jsPDF();
            
            // Configurar fuentes
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            
            // Título
            doc.text('LISTA DE CONTRATOS', 105, 20, { align: 'center' });
            
            // Encabezados de la tabla
            doc.setFontSize(10);
            let y = 40;
            doc.text('Código', 20, y);
            doc.text('Razón Social', 50, y);
            doc.text('RUC', 100, y);
            doc.text('Monto', 130, y);
            doc.text('Período', 160, y);
            doc.text('Estado', 190, y);
            
            // Datos de contratos
            doc.setFont('helvetica', 'normal');
            contracts.forEach(contract => {
                y += 10;
                if (y > 280) { // Nueva página si se llega al final
                    doc.addPage();
                    y = 20;
                }
                doc.text(contract.codigo, 20, y);
                doc.text(contract.razonSocial, 50, y);
                doc.text(FormatUtils.formatRUC(contract.ruc), 100, y);
                doc.text(FormatUtils.formatAmount(contract.monto), 130, y);
                doc.text(FormatUtils.formatPeriod(contract.fechaInicio, contract.fechaFin), 160, y);
                doc.text(FormatUtils.formatStatus(contract.estado), 190, y);
            });
            
            // Guardar archivo
            doc.save('Lista_Contratos.pdf');

            this.contractManager.notifications.addNotification(
                'Éxito',
                'Contratos exportados correctamente',
                'success'
            );
        } catch (error) {
            console.error('Error al exportar contratos:', error);
            this.contractManager.notifications.addNotification(
                'Error',
                'Error al exportar los contratos',
                'error'
            );
        }
    }
}

export default new ContractExport(); 