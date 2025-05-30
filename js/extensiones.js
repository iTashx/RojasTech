// js/extensiones.js
// Gestión de extensiones de contrato

(function() {
    // Variables globales para extensiones
    window.extensionesPorContrato = window.extensionesPorContrato || {};

    // Utilidad para mostrar toasts
    function showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0 show`;
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = 9999;
        toast.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    }

    // Registrar extensión
    document.getElementById('guardar-extension')?.addEventListener('click', function() {
        const tipo = document.getElementById('tipo-extension').value;
        const nuevaFecha = document.getElementById('nueva-fecha-terminacion').value;
        const nuevoMonto = document.getElementById('nuevo-monto').value;
        const motivo = document.getElementById('motivo-extension').value.trim();
        const contratoId = document.getElementById('select-contract-to-edit').value;
        if (!contratoId) {
            showToast('Seleccione un contrato para registrar la extensión', 'danger');
            return;
        }
        if (!motivo) {
            showToast('Debe indicar el motivo de la extensión', 'danger');
            return;
        }
        if ((tipo === 'tiempo' || tipo === 'ambos') && !nuevaFecha) {
            showToast('Debe indicar la nueva fecha de terminación', 'danger');
            return;
        }
        if ((tipo === 'erogacion' || tipo === 'ambos') && (!nuevoMonto || parseFloat(nuevoMonto) <= 0)) {
            showToast('Debe indicar un nuevo monto válido', 'danger');
            return;
        }
        let extension = { tipo, motivo, fecha: new Date().toISOString() };
        // Validaciones y cálculos
        if (tipo === 'tiempo' || tipo === 'ambos') {
            if (!nuevaFecha) {
                showToast('Debe indicar la nueva fecha de terminación', 'danger');
                return;
            }
            extension.nuevaFecha = nuevaFecha;
        }
        if (tipo === 'erogacion' || tipo === 'ambos') {
            if (!nuevoMonto || parseFloat(nuevoMonto) <= 0) {
                showToast('Debe indicar un nuevo monto válido', 'danger');
                return;
            }
            extension.nuevoMonto = parseFloat(nuevoMonto);
        }
        // Guardar extensión
        window.extensionesPorContrato[contratoId] = window.extensionesPorContrato[contratoId] || [];
        window.extensionesPorContrato[contratoId].push(extension);
        showToast('Extensión registrada correctamente', 'success');
        // Actualizar resumen general
        actualizarResumenExtensiones(contratoId);
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('extensionModal'));
        modal?.hide();
        // Limpiar formulario
        document.getElementById('extensionForm').reset();
    });

    // Actualizar resumen de extensiones
    function actualizarResumenExtensiones(contratoId) {
        const extensiones = window.extensionesPorContrato[contratoId] || [];
        let diasExtension = 0;
        let nuevaFecha = '-';
        let erogacion = 'No disponible';
        let historialHtml = '';
        if (extensiones.length > 0) {
            extensiones.forEach((ext, idx) => {
                let detalle = `<li><b>Tipo:</b> ${ext.tipo} | <b>Fecha:</b> ${ext.fecha ? new Date(ext.fecha).toLocaleString() : '-'} | <b>Motivo:</b> ${ext.motivo}`;
                if (ext.nuevaFecha) detalle += ` | <b>Nueva Fecha:</b> ${ext.nuevaFecha}`;
                if (ext.nuevoMonto) detalle += ` | <b>Monto:</b> USD ${ext.nuevoMonto.toLocaleString('es-VE', {minimumFractionDigits:2})}`;
                detalle += '</li>';
                historialHtml += detalle;
            });
            const ultima = extensiones[extensiones.length - 1];
            if (ultima.nuevaFecha) {
                const fechaOriginal = document.getElementById('fecha-terminacion').value;
                if (fechaOriginal) {
                    const f1 = new Date(fechaOriginal);
                    const f2 = new Date(ultima.nuevaFecha);
                    diasExtension = Math.round((f2 - f1) / (1000 * 60 * 60 * 24));
                    nuevaFecha = ultima.nuevaFecha;
                }
            }
            if (ultima.nuevoMonto) {
                erogacion = `USD ${ultima.nuevoMonto.toLocaleString('es-VE', {minimumFractionDigits:2})}`;
            }
        }
        document.getElementById('dias-extension').textContent = diasExtension;
        document.getElementById('nueva-fecha-vencimiento').textContent = nuevaFecha;
        document.getElementById('erogacion-extension').textContent = erogacion;
        // Mostrar historial completo si existe el contenedor
        let historialCont = document.getElementById('historial-extensiones');
        if (!historialCont) {
            historialCont = document.createElement('div');
            historialCont.id = 'historial-extensiones';
            historialCont.className = 'mt-2';
            document.getElementById('extensiones-resumen').appendChild(historialCont);
        }
        historialCont.innerHTML = `<h6>Historial de Extensiones</h6><ul>${historialHtml || '<li>No hay extensiones registradas</li>'}</ul>`;
    }

    // Si cambia el contrato seleccionado, actualizar resumen
    document.getElementById('select-contract-to-edit')?.addEventListener('change', function() {
        actualizarResumenExtensiones(this.value);
    });

    // Inicializar resumen al cargar
    document.addEventListener('DOMContentLoaded', function() {
        const contratoId = document.getElementById('select-contract-to-edit')?.value;
        if (contratoId) actualizarResumenExtensiones(contratoId);
    });
})(); 