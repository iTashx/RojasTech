// Módulo de utilidades
export class Utils {
    // Formateo de montos
    static formatMonto(amount) {
        return new Intl.NumberFormat('es-VE', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    // Formateo de fechas
    static formatDate(date) {
        return new Date(date).toLocaleDateString('es-VE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    // Cálculo de período de culminación
    static calculatePeriodoCulminacion(fechaInicio, fechaTerminacion) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaTerminacion);
        const diffTime = Math.abs(fin - inicio);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Cálculo de fecha de vencimiento
    static calcularFechaVencimiento(fechaTerminacion) {
        const fecha = new Date(fechaTerminacion);
        return fecha.toISOString().split('T')[0];
    }

    // Cálculo de fecha extendida
    static calcularFechaExtendida(fechaTerminacion, diasExtension) {
        const fecha = new Date(fechaTerminacion);
        fecha.setDate(fecha.getDate() + parseInt(diasExtension));
        return fecha.toISOString().split('T')[0];
    }

    // Manejo de archivos
    static async handleFileUpload(fileInput, infoSpan, entidadId, entidadTipo) {
        const files = Array.from(fileInput.files);
        if (files.length === 0) return;

        try {
            const archivosGuardados = await this.guardarArchivos(entidadId, entidadTipo, files);
            infoSpan.textContent = `${files.length} archivo(s) seleccionado(s)`;
            return archivosGuardados;
        } catch (error) {
            console.error('Error al guardar archivos:', error);
            throw error;
        }
    }

    // Guardar archivos
    static async guardarArchivos(entidadId, entidadTipo, files) {
        const archivos = [];
        for (const file of files) {
            const reader = new FileReader();
            const fileData = await new Promise((resolve) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });

            archivos.push({
                nombre: file.name,
                tipo: file.type,
                tamaño: file.size,
                datos: fileData
            });
        }
        return archivos;
    }

    // Recuperar archivos
    static async recuperarArchivos(entidadId, entidadTipo) {
        // Implementar lógica de recuperación de archivos
        return [];
    }

    // Mostrar archivos adjuntos
    static mostrarArchivosAdjuntos(archivos, contenedorId) {
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return;

        contenedor.innerHTML = '';
        archivos.forEach(archivo => {
            const archivoElement = document.createElement('div');
            archivoElement.className = 'archivo-adjunto';
            archivoElement.innerHTML = `
                <i class="fas fa-file"></i>
                <span>${archivo.nombre}</span>
                <button class="btn btn-sm btn-primary descargar-archivo" data-archivo='${JSON.stringify(archivo)}'>
                    <i class="fas fa-download"></i>
                </button>
            `;
            contenedor.appendChild(archivoElement);
        });
    }

    // Descargar archivo
    static async descargarArchivo(archivo) {
        const link = document.createElement('a');
        link.href = archivo.datos;
        link.download = archivo.nombre;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
} 