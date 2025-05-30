// Configuración global del sistema
const CONFIG = {
    // Límites de archivos
    FILE_LIMITS: {
        MAX_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_TYPES: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
    },
    
    // Configuración de validación
    VALIDATION: {
        PATTERNS: {
            NUMERO_PROVEEDOR: /^[A-Za-z0-9-]+$/,
            MONTO: /^\d+(\.\d{1,2})?$/
        },
        MESSAGES: {
            NUMERO_PROVEEDOR: 'Solo se permiten letras, números y guiones',
            MONTO: 'El monto debe ser un número válido con máximo 2 decimales'
        }
    }
};

// Clase para manejar la configuración del sistema
class SystemConfig {
    constructor() {
        this.initializeTooltips();
        this.initializeFormValidation();
        this.initializeFileValidation();
        this.initializeGastoAdmin();
    }

    // Inicializar tooltips de Bootstrap
    initializeTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }

    // Inicializar validación de formularios
    initializeFormValidation() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (event) => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                    window.notifyAction && window.notifyAction('error', 'Formulario con errores de validación.');
                }
                form.classList.add('was-validated');
            });
        });
    }

    // Inicializar validación de archivos
    initializeFileValidation() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => this.validateFiles(e));
        });
    }

    // Validar archivos
    validateFiles(event) {
        const files = event.target.files;
        for (let file of files) {
            if (file.size > CONFIG.FILE_LIMITS.MAX_SIZE) {
                this.showError(`El archivo ${file.name} excede el tamaño máximo permitido de 10MB.`);
                event.target.value = '';
                return;
            }
            if (!CONFIG.FILE_LIMITS.ALLOWED_TYPES.includes(file.type)) {
                this.showError(`El archivo ${file.name} no es de un tipo permitido.`);
                event.target.value = '';
                return;
            }
        }
    }

    // Inicializar configuración de gasto administrativo
    initializeGastoAdmin() {
        const checkboxGastoAdmin = document.getElementById('incluir-gasto-administrativo');
        const modalGastoAdminEl = document.getElementById('modalGastoAdministrativo');
        const modalGastoAdmin = new bootstrap.Modal(modalGastoAdminEl);
        const inputPorcentaje = document.getElementById('gasto-admin-porcentaje');
        const inputMonto = document.getElementById('gasto-admin-monto');
        let guardadoGastoAdmin = false;

        if (checkboxGastoAdmin) {
            checkboxGastoAdmin.addEventListener('change', () => {
                guardadoGastoAdmin = false;
                if (checkboxGastoAdmin.checked) {
                    inputPorcentaje.value = '';
                    inputMonto.value = '';
                    modalGastoAdmin.show();
                }
            });
        }

        document.getElementById('guardar-gasto-admin').addEventListener('click', () => {
            const monto = parseFloat(inputMonto.value) || 0;
            const porcentaje = parseFloat(inputPorcentaje.value) || 0;

            if (porcentaje < 0 || porcentaje > 100) {
                this.showError('El porcentaje debe estar entre 0 y 100.');
                return;
            }

            if (monto <= 0 && porcentaje <= 0) {
                this.showError('Debe ingresar un monto fijo mayor a 0, un porcentaje mayor a 0, o ambos.');
                return;
            }

            window.gastoAdministrativoDatos = { monto, porcentaje };
            guardadoGastoAdmin = true;
            modalGastoAdmin.hide();
        });

        modalGastoAdminEl.addEventListener('hidden.bs.modal', () => {
            if (!guardadoGastoAdmin) {
                checkboxGastoAdmin.checked = false;
                inputPorcentaje.value = '';
                inputMonto.value = '';
            }
            guardadoGastoAdmin = false;
        });
    }

    // Mostrar mensaje de error
    showError(message) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-white bg-danger border-0';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}

// Exportar la configuración y la clase
export { CONFIG, SystemConfig };

document.addEventListener('DOMContentLoaded', function() {
    const fechaCreado = document.getElementById('fecha-creado');
    const fechaFirma = document.getElementById('fecha-firma-contrato');
    const fechaInicio = document.getElementById('fecha-inicio');
    const fechaFin = document.getElementById('fecha-terminacion');
    const periodo = document.getElementById('periodo-culminacion');
    if (fechaInicio && fechaFin && periodo && fechaFirma) {
        function calcularDias() {
            const inicio = fechaInicio.value;
            const fin = fechaFin.value;
            const firma = fechaFirma.value;
            if (firma && inicio) {
                const dFirma = new Date(firma);
                const dInicio = new Date(inicio);
                if (dInicio < dFirma) {
                    periodo.value = '';
                    window.notifyAction && window.notifyAction('error', 'La fecha de inicio no puede ser anterior a la fecha de firma del contrato.', 'Corrige la fecha de inicio o la fecha de firma.');
                    return;
                }
            }
            if (inicio && fin) {
                const d1 = new Date(inicio);
                const d2 = new Date(fin);
                const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
                if (diff < 0) {
                    periodo.value = '';
                    window.notifyAction && window.notifyAction('error', 'La fecha de terminación no puede ser anterior a la de inicio.');
                } else {
                    periodo.value = diff;
                }
            } else {
                periodo.value = '';
            }
        }
        fechaInicio.addEventListener('change', calcularDias);
        fechaFin.addEventListener('change', calcularDias);
        fechaFirma.addEventListener('change', calcularDias);
        calcularDias(); // Calcular al cargar
    }

    // --- Modalidad de Contratación ---
    const modalidadSelect = document.getElementById('modalidad-contratacion');
    const nuevaModalidadInput = document.getElementById('nueva-modalidad');
    const agregarModalidadBtn = document.getElementById('agregar-modalidad');
    const eliminarModalidadBtn = document.getElementById('eliminar-modalidad');
    const feedback = document.getElementById('modalidad-feedback');
    // Cargar modalidades guardadas
    if (modalidadSelect) {
        const modalidadesGuardadas = JSON.parse(localStorage.getItem('modalidadesContratacion') || '[]');
        modalidadSelect.innerHTML = '<option value="">-- Seleccione una Modalidad --</option>';
        modalidadesGuardadas.forEach(modalidad => {
            const option = document.createElement('option');
            option.value = modalidad;
            option.text = modalidad;
            modalidadSelect.add(option);
        });
    }
    // Agregar modalidad
    if (agregarModalidadBtn) {
        agregarModalidadBtn.onclick = function() {
            const nueva = nuevaModalidadInput.value.trim();
            if (!nueva) return;
            if ([...modalidadSelect.options].some(opt => opt.value === nueva)) {
                if (feedback) feedback.style.display = '';
                return;
            }
            if (feedback) feedback.style.display = 'none';
            const option = document.createElement('option');
            option.value = nueva;
            option.text = nueva;
            modalidadSelect.add(option);
            modalidadSelect.value = nueva;
            nuevaModalidadInput.value = '';
            // Guardar en localStorage
            const modalidades = Array.from(modalidadSelect.options).filter(o=>o.value).map(o=>o.value);
            localStorage.setItem('modalidadesContratacion', JSON.stringify(modalidades));
        };
    }
    // Eliminar modalidad
    if (eliminarModalidadBtn) {
        eliminarModalidadBtn.onclick = function() {
            if (modalidadSelect.selectedIndex > 0) {
                modalidadSelect.remove(modalidadSelect.selectedIndex);
                // Guardar en localStorage
                const modalidades = Array.from(modalidadSelect.options).filter(o=>o.value).map(o=>o.value);
                localStorage.setItem('modalidadesContratacion', JSON.stringify(modalidades));
            }
        };
    }
}); 