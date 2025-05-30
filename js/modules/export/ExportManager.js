/**
 * ExportManager - Módulo para manejar exportaciones en diferentes formatos
 */
class ExportManager {
    constructor() {
        this.formats = {
            PDF: 'pdf',
            EXCEL: 'excel',
            IMAGE: 'image'
        };
    }

    /**
     * Exporta los datos en formato PDF
     * @param {Object} data - Datos a exportar
     * @param {string} filename - Nombre del archivo
     */
    async exportToPDF(data, filename) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Configurar el documento
            doc.setFont("helvetica");
            doc.setFontSize(12);
            
            // Agregar título
            doc.text("Reporte de Contrato", 20, 20);
            
            // Agregar datos
            let y = 40;
            Object.entries(data).forEach(([key, value]) => {
                doc.text(`${key}: ${value}`, 20, y);
                y += 10;
            });
            
            // Guardar el documento
            doc.save(`${filename}.pdf`);
            
            return true;
        } catch (error) {
            console.error('Error al exportar a PDF:', error);
            throw new Error('No se pudo exportar a PDF');
        }
    }

    /**
     * Exporta los datos en formato Excel
     * @param {Object} data - Datos a exportar
     * @param {string} filename - Nombre del archivo
     */
    async exportToExcel(data, filename) {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Datos');
            
            // Agregar encabezados
            const headers = Object.keys(data);
            worksheet.addRow(headers);
            
            // Agregar datos
            const values = Object.values(data);
            worksheet.addRow(values);
            
            // Estilizar
            worksheet.getRow(1).font = { bold: true };
            
            // Guardar el archivo
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.xlsx`;
            a.click();
            
            return true;
        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            throw new Error('No se pudo exportar a Excel');
        }
    }

    /**
     * Exporta los datos en formato imagen
     * @param {HTMLElement} element - Elemento a exportar
     * @param {string} filename - Nombre del archivo
     */
    async exportToImage(element, filename) {
        try {
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
            
            return true;
        } catch (error) {
            console.error('Error al exportar a imagen:', error);
            throw new Error('No se pudo exportar a imagen');
        }
    }

    /**
     * Exporta los datos en el formato especificado
     * @param {string} format - Formato de exportación (pdf, excel, image)
     * @param {Object|HTMLElement} data - Datos o elemento a exportar
     * @param {string} filename - Nombre del archivo
     */
    async export(format, data, filename) {
        switch (format.toLowerCase()) {
            case this.formats.PDF:
                return await this.exportToPDF(data, filename);
            case this.formats.EXCEL:
                return await this.exportToExcel(data, filename);
            case this.formats.IMAGE:
                return await this.exportToImage(data, filename);
            default:
                throw new Error('Formato de exportación no soportado');
        }
    }
}

// Exportar la clase
export default ExportManager; 