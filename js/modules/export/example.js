/**
 * Ejemplo de uso del ExportManager
 */
import ExportManager from './ExportManager.js';
import { loadAllDependencies } from './config.js';

// Ejemplo de uso
async function exportarDatos() {
    try {
        // Cargar dependencias
        await loadAllDependencies();
        
        // Crear instancia del ExportManager
        const exportManager = new ExportManager();
        
        // Datos de ejemplo
        const datos = {
            'Número de Contrato': 'CON-2024-001',
            'Cliente': 'Empresa ABC',
            'Monto Total': 'S/ 150,000.00',
            'Fecha de Inicio': '01/01/2024',
            'Fecha de Fin': '31/12/2024'
        };
        
        // Exportar a PDF
        await exportManager.export('pdf', datos, 'contrato-2024-001');
        
        // Exportar a Excel
        await exportManager.export('excel', datos, 'contrato-2024-001');
        
        // Exportar a imagen (elemento HTML)
        const elemento = document.querySelector('.contenido-contrato');
        await exportManager.export('image', elemento, 'contrato-2024-001');
        
    } catch (error) {
        console.error('Error en la exportación:', error);
        // Mostrar mensaje de error al usuario
        alert('Error al exportar los datos. Por favor, intente nuevamente.');
    }
}

// Ejemplo de uso con botones
document.addEventListener('DOMContentLoaded', () => {
    // Botón para exportar a PDF
    const btnPDF = document.getElementById('exportar-pdf');
    if (btnPDF) {
        btnPDF.addEventListener('click', async () => {
            try {
                await loadAllDependencies();
                const exportManager = new ExportManager();
                const datos = obtenerDatosContrato();
                await exportManager.export('pdf', datos, 'contrato-exportado');
            } catch (error) {
                console.error('Error al exportar a PDF:', error);
                alert('Error al exportar a PDF');
            }
        });
    }
    
    // Botón para exportar a Excel
    const btnExcel = document.getElementById('exportar-excel');
    if (btnExcel) {
        btnExcel.addEventListener('click', async () => {
            try {
                await loadAllDependencies();
                const exportManager = new ExportManager();
                const datos = obtenerDatosContrato();
                await exportManager.export('excel', datos, 'contrato-exportado');
            } catch (error) {
                console.error('Error al exportar a Excel:', error);
                alert('Error al exportar a Excel');
            }
        });
    }
    
    // Botón para exportar a imagen
    const btnImagen = document.getElementById('exportar-imagen');
    if (btnImagen) {
        btnImagen.addEventListener('click', async () => {
            try {
                await loadAllDependencies();
                const exportManager = new ExportManager();
                const elemento = document.querySelector('.contenido-contrato');
                await exportManager.export('image', elemento, 'contrato-exportado');
            } catch (error) {
                console.error('Error al exportar a imagen:', error);
                alert('Error al exportar a imagen');
            }
        });
    }
});

// Función auxiliar para obtener datos del contrato
function obtenerDatosContrato() {
    // Aquí se implementaría la lógica para obtener los datos del contrato
    // Por ahora retornamos datos de ejemplo
    return {
        'Número de Contrato': 'CON-2024-001',
        'Cliente': 'Empresa ABC',
        'Monto Total': 'S/ 150,000.00',
        'Fecha de Inicio': '01/01/2024',
        'Fecha de Fin': '31/12/2024'
    };
} 