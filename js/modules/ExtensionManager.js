// Módulo para gestión de extensiones de contrato
export class ExtensionManager {
    constructor({
        fechaTerminacionOriginalId = 'fecha-terminacion',
        nuevaFechaTerminacionId = 'nueva-fecha-terminacion',
        diasExtensionSpanId = 'dias-extension',
        nuevaFechaVencimientoSpanId = 'nueva-fecha-vencimiento'
    } = {}) {
        this.fechaTerminacionOriginal = document.getElementById(fechaTerminacionOriginalId);
        this.nuevaFechaTerminacion = document.getElementById(nuevaFechaTerminacionId);
        this.diasExtensionSpan = document.getElementById(diasExtensionSpanId);
        this.nuevaFechaVencimientoSpan = document.getElementById(nuevaFechaVencimientoSpanId);
        this.initEvents();
    }

    static calcularDiasExtension(original, nueva) {
        if (!original || !nueva) return 0;
        const d1 = new Date(original);
        const d2 = new Date(nueva);
        const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    }

    static formatearFecha(fecha) {
        if (!fecha) return '-';
        return new Date(fecha).toISOString().split('T')[0];
    }

    actualizarExtension() {
        const original = this.fechaTerminacionOriginal?.value;
        const nueva = this.nuevaFechaTerminacion?.value;
        const dias = ExtensionManager.calcularDiasExtension(original, nueva);
        if (this.diasExtensionSpan) this.diasExtensionSpan.textContent = dias;
        if (this.nuevaFechaVencimientoSpan) this.nuevaFechaVencimientoSpan.textContent = nueva ? ExtensionManager.formatearFecha(nueva) : '-';
    }

    initEvents() {
        if (this.fechaTerminacionOriginal) {
            this.fechaTerminacionOriginal.addEventListener('change', () => this.actualizarExtension());
        }
        if (this.nuevaFechaTerminacion) {
            this.nuevaFechaTerminacion.addEventListener('change', () => this.actualizarExtension());
        }
    }
} 