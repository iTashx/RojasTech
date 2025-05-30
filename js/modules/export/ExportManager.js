/**
 * ExportManager - Módulo para manejar exportaciones en diferentes formatos
 */
export class ExportManager {
    constructor() {
        this.exportBasePath = 'exportaciones';
        this.exportTypes = {
            pdf: 'pdf',
            excel: 'excel',
            imagen: 'imagenes'
        };
        this.initializeLibraries();
    }

    initializeLibraries() {
        // Asegurarse de que las librerías estén cargadas
        if (typeof XLSX === 'undefined') {
            console.error('XLSX no está cargado');
        }
        if (typeof jsPDF === 'undefined') {
            console.error('jsPDF no está cargado');
        }
    }

    /**
     * Exporta los datos en formato PDF
     * @param {Object} data - Datos a exportar
     * @param {string} filename - Nombre del archivo
     */
    async exportToPDF(data, options = {}) {
        try {
            const {
                fileName = 'export',
                title = 'Reporte',
                orientation = 'portrait',
                unit = 'mm',
                format = 'a4'
            } = options;

            const doc = new jsPDF(orientation, unit, format);
            
            // Configurar el documento
            doc.setFont('helvetica');
            doc.setFontSize(16);
            
            // Título
            doc.text(title, 14, 20);
            
            // Agregar fecha
            const fecha = new Date().toLocaleDateString();
            doc.setFontSize(10);
            doc.text(`Generado el: ${fecha}`, 14, 30);
            
            // Agregar datos
            if (Array.isArray(data)) {
                // Si es una tabla
                const tableColumn = Object.keys(data[0]);
                const tableRows = data.map(item => Object.values(item));
                
                doc.autoTable({
                    head: [tableColumn],
                    body: tableRows,
                    startY: 40,
                    theme: 'grid',
                    styles: {
                        fontSize: 8,
                        cellPadding: 2
                    },
                    headStyles: {
                        fillColor: [74, 144, 226],
                        textColor: 255
                    }
                });
            } else {
                // Si es texto plano
                doc.setFontSize(12);
                doc.text(data, 14, 40);
            }
            
            // Guardar el documento
            doc.save(`${fileName}.pdf`);
            
            return true;
        } catch (error) {
            console.error('Error al exportar a PDF:', error);
            throw error;
        }
    }

    /**
     * Exporta los datos en formato Excel
     * @param {Object} data - Datos a exportar
     * @param {string} filename - Nombre del archivo
     */
    async exportToExcel(data, fileName = 'export') {
        try {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
            
            // Generar el archivo
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
            
            return true;
        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            throw error;
        }
    }

    /**
     * Exporta los datos en formato imagen
     * @param {HTMLElement} element - Elemento a exportar
     * @param {string} filename - Nombre del archivo
     */
    async exportToImage(element, filename) {
        try {
            if (!element || !filename) {
                throw new Error('Elemento y nombre de archivo son requeridos');
            }

            // Usar html2canvas si está disponible
            if (typeof html2canvas !== 'undefined') {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    logging: false
                });
                
                // Convertir a imagen
                const imgData = canvas.toDataURL('image/png');
                
                // Crear enlace de descarga
                const link = document.createElement('a');
                link.download = `${filename}.png`;
                link.href = imgData;
                link.click();
            } else {
                // Alternativa usando canvas nativo
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                // Convertir elemento a SVG
                const svgData = new XMLSerializer().serializeToString(element);
                const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
                const url = URL.createObjectURL(svgBlob);
                
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    // Descargar imagen
                    const link = document.createElement('a');
                    link.download = `${filename}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                };
                
                img.src = url;
            }
            
            return true;
        } catch (error) {
            console.error('Error al exportar a imagen:', error);
            throw new Error(`Error al exportar a imagen: ${error.message}`);
        }
    }

    /**
     * Exporta los datos en el formato especificado
     * @param {string} format - Formato de exportación (pdf, excel, image)
     * @param {Object|HTMLElement} data - Datos o elemento a exportar
     * @param {string} filename - Nombre del archivo
     */
    async export(format, data, filename) {
        try {
            if (!format || !data || !filename) {
                throw new Error('Formato, datos y nombre de archivo son requeridos');
            }

            const formatUpper = format.toUpperCase();
            if (!this.formats[formatUpper]) {
                throw new Error(`Formato no soportado: ${format}`);
            }

            switch (formatUpper) {
                case this.formats.PDF:
                    return await this.exportToPDF(data, filename);
                case this.formats.EXCEL:
                    return await this.exportToExcel(data, filename);
                case this.formats.IMAGE:
                    return await this.exportToImage(data, filename);
                default:
                    throw new Error('Formato de exportación no soportado');
            }
        } catch (error) {
            console.error('Error en la exportación:', error);
            throw new Error(`Error en la exportación: ${error.message}`);
        }
    }

    // Exportar gráfico como imagen
    async exportChartAsImage(chartId, fileName = 'chart') {
        try {
            const canvas = document.getElementById(chartId);
            if (!canvas) {
                throw new Error(`No se encontró el canvas con ID: ${chartId}`);
            }

            // Convertir canvas a blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve));
            
            // Crear URL del blob
            const url = URL.createObjectURL(blob);
            
            // Crear enlace de descarga
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.png`;
            
            // Simular clic
            document.body.appendChild(link);
            link.click();
            
            // Limpiar
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error al exportar gráfico:', error);
            throw error;
        }
    }

    // Exportar tabla como imagen
    async exportTableAsImage(tableId, fileName = 'table') {
        try {
            const table = document.getElementById(tableId);
            if (!table) {
                throw new Error(`No se encontró la tabla con ID: ${tableId}`);
            }

            // Usar html2canvas para capturar la tabla
            const canvas = await html2canvas(table, {
                scale: 2,
                useCORS: true,
                logging: false
            });
            
            // Convertir a blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve));
            
            // Crear URL y descargar
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.png`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error al exportar tabla:', error);
            throw error;
        }
    }

    // Método para exportar datos de contrato
    async exportContractData(contractId, format = 'pdf') {
        try {
            // Obtener datos del contrato
            const contract = await db.contratos.get(contractId);
            if (!contract) {
                throw new Error('Contrato no encontrado');
            }

            // Preparar datos para exportación
            const exportData = {
                contrato: contract,
                partidas: await db.partidas.where('contratoId').equals(contractId).toArray(),
                hes: await db.hes.where('contratoId').equals(contractId).toArray()
            };

            // Exportar según el formato
            switch (format.toLowerCase()) {
                case 'excel':
                    return await this.exportToExcel(exportData, `contrato_${contract.numeroProveedor}`);
                case 'pdf':
                    return await this.exportToPDF(exportData, {
                        fileName: `contrato_${contract.numeroProveedor}`,
                        title: `Contrato ${contract.numeroProveedor}`
                    });
                default:
                    throw new Error('Formato no soportado');
            }
        } catch (error) {
            console.error('Error al exportar datos del contrato:', error);
            throw error;
        }
    }

    async exportToExcel(contractData, contractName) {
        try {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(contractData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Contrato');
            
            const fileName = `${this.sanitizeFileName(contractName)}_${new Date().toISOString().split('T')[0]}.xlsx`;
            const filePath = `${this.exportBasePath}/${this.exportTypes.excel}/${fileName}`;
            
            XLSX.writeFile(workbook, filePath);
            return { success: true, filePath };
        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            return { success: false, error };
        }
    }

    async exportToPDF(element, contractName) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const canvas = await html2canvas(element);
            const imgData = canvas.toDataURL('image/png');
            
            const fileName = `${this.sanitizeFileName(contractName)}_${new Date().toISOString().split('T')[0]}.pdf`;
            const filePath = `${this.exportBasePath}/${this.exportTypes.pdf}/${fileName}`;
            
            doc.addImage(imgData, 'PNG', 10, 10, 190, 277);
            doc.save(filePath);
            return { success: true, filePath };
        } catch (error) {
            console.error('Error al exportar a PDF:', error);
            return { success: false, error };
        }
    }

    async exportToImage(element, contractName) {
        try {
            const canvas = await html2canvas(element);
            const imgData = canvas.toDataURL('image/png');
            
            const fileName = `${this.sanitizeFileName(contractName)}_${new Date().toISOString().split('T')[0]}.png`;
            const filePath = `${this.exportBasePath}/${this.exportTypes.imagen}/${fileName}`;
            
            const link = document.createElement('a');
            link.download = fileName;
            link.href = imgData;
            link.click();
            return { success: true, filePath };
        } catch (error) {
            console.error('Error al exportar a imagen:', error);
            return { success: false, error };
        }
    }

    sanitizeFileName(fileName) {
        return fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }
}

// Exportar la clase
export default ExportManager; 