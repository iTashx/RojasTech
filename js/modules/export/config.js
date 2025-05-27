/**
 * Configuración de dependencias para exportación
 */

// Dependencias necesarias
const dependencies = {
    pdf: {
        name: 'jsPDF',
        version: '2.5.1',
        cdn: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    },
    excel: {
        name: 'ExcelJS',
        version: '4.3.0',
        cdn: 'https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js'
    },
    image: {
        name: 'html2canvas',
        version: '1.4.1',
        cdn: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
    }
};

/**
 * Carga una dependencia desde CDN
 * @param {string} type - Tipo de dependencia (pdf, excel, image)
 * @returns {Promise} - Promesa que se resuelve cuando la dependencia está cargada
 */
export async function loadDependency(type) {
    const dep = dependencies[type];
    if (!dep) {
        throw new Error(`Tipo de dependencia no soportado: ${type}`);
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = dep.cdn;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Error al cargar ${dep.name}`));
        document.head.appendChild(script);
    });
}

/**
 * Carga todas las dependencias necesarias
 * @returns {Promise} - Promesa que se resuelve cuando todas las dependencias están cargadas
 */
export async function loadAllDependencies() {
    try {
        await Promise.all([
            loadDependency('pdf'),
            loadDependency('excel'),
            loadDependency('image')
        ]);
        return true;
    } catch (error) {
        console.error('Error al cargar dependencias:', error);
        throw error;
    }
}

export default {
    dependencies,
    loadDependency,
    loadAllDependencies
}; 