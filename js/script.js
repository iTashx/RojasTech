import { db, addSampleData } from './database.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar la base de datos (si es necesario, puedes llamar a addSampleData aquí)
    await db.open();
    // await addSampleData(); // Descomentar para añadir datos de ejemplo

    // --- Elementos del DOM ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.content-section');
    const contractForm = document.getElementById('contract-form');
    const addPartidaBtn = document.getElementById('add-partida-btn');
    const partidasTableBody = document.querySelector('#partidas-table tbody');
    const clearContractFormBtn = document.getElementById('clear-contract-form-btn');
    const saveContractBtn = document.getElementById('save-contract-btn');
    const contractListBody = document.getElementById('contract-list-body');
    const filterProveedorInput = document.getElementById('filter-proveedor');
    const filterSicacInput = document.getElementById('filter-sicac');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    // Campos del formulario de contrato
    const fechaInicioInput = document.getElementById('fecha-inicio');
    const fechaTerminacionInput = document.getElementById('fecha-terminacion');
    const periodoCulminacionInput = document.getElementById('periodo-culminacion');
    const modalidadContratacionSelect = document.getElementById('modalidad-contratacion');
    const montoOriginalInput = document.getElementById('monto-original'); // Nuevo
    const montoModificadoInput = document.getElementById('monto-modificado'); // Nuevo
    const montoTotalContratoInput = document.getElementById('monto-total-contrato'); // Nuevo

    // Nuevos campos de extensión
    const fechaTerminacionOriginalInput = document.getElementById('fecha-terminacion');
    const diasExtensionInput = document.getElementById('dias-extension');
    const fechaTerminacionExtendidaInput = document.getElementById('fecha-terminacion-extendida');

    // Elementos del formulario HES
    const hesForm = document.getElementById('hes-form');
    const hesContractSelect = document.getElementById('hes-contract-select');
    const hesNoHesInput = document.getElementById('hes-no-hes');
    const hesFechaInicioInput = document.getElementById('hes-fecha-inicio');
    const hesFechaFinalInput = document.getElementById('hes-fecha-final');
    const hesAprobadoSelect = document.getElementById('hes-aprobado');
    const hesTextoHesTextarea = document.getElementById('hes-texto-hes');
    const hesEjecutadaCheckbox = document.getElementById('hes-ejecutada');
    const hesFechaCreadoInput = document.getElementById('hes-fecha-creado');
    const hesFechaAprobadoInput = document.getElementById('hes-fecha-aprobado');
    const hesTextoBreveInput = document.getElementById('hes-texto-breve');
    const hesValuacionInput = document.getElementById('hes-valuacion');
    const hesLugarPrestacionServicioInput = document.getElementById('hes-lugar-prestacion-servicio');
    const hesResponsableSdoInput = document.getElementById('hes-responsable-sdo');
    const hesAnexosInput = document.getElementById('hes-anexos');
    const hesAnexosInfoSpan = document.getElementById('hes-anexos-info');
    const hesValuadoCheckbox = document.getElementById('hes-valuado');
    const hesSubtotalInput = document.getElementById('hes-subtotal');
    const hesGastosAdministrativosInput = document.getElementById('hes-gastos-administrativos');
    const hesTotalInput = document.getElementById('hes-total');
    const hesPartidasTableBody = document.getElementById('hes-partidas-table-body');
    const hesPartidasInfo = document.getElementById('hes-partidas-info');
    const saveHesBtn = document.getElementById('save-hes-btn');
    const clearHesFormBtn = document.getElementById('clear-hes-form-btn');
    const hesListBody = document.getElementById('hes-list-body');

    // Elementos de la papelera
    const deletedContractsBody = document.getElementById('deleted-contracts-body');
    const deletedHesBody = document.getElementById('deleted-hes-body');

    // Elementos de avance físico/financiero
    const physicalAdvanceContractSelect = document.getElementById('physical-advance-contract-select');
    const physicalAdvanceDetails = document.getElementById('physical-advance-details');
    const paContractSicac = document.getElementById('pa-contract-sicac');
    const paContractTotal = document.getElementById('pa-contract-total');
    const paPhysicalGlobalPercentage = document.getElementById('pa-physical-global-percentage');
    const paPhysicalGlobalProgressBar = document.getElementById('pa-physical-global-progress-bar');
    const paPartidasBody = document.getElementById('pa-partidas-body');

    const financialAdvanceContractSelect = document.getElementById('financial-advance-contract-select');
    const financialAdvanceDetails = document.getElementById('financial-advance-details');
    const faContractSicac = document.getElementById('fa-contract-sicac');
    const faContractTotal = document.getElementById('fa-contract-total');
    const faExecutedAmount = document.getElementById('fa-executed-amount');
    const faFinancialGlobalPercentage = document.getElementById('fa-financial-global-percentage');
    const faFinancialGlobalProgressBar = document.getElementById('fa-financial-global-progress-bar');
    const faHesListBody = document.getElementById('fa-hes-list-body');

    // Elementos de resumen gráfico
    let contractStatusChartInstance = null, contractModalityChartInstance = null;
    const contractStatusChartCanvas = document.getElementById('contractStatusChart');
    const contractModalityChartCanvas = document.getElementById('contractModalityChart');

    // Elementos de informes
    const reportContractSelect = document.getElementById('report-contract-select');
    const reportDetails = document.getElementById('report-details');
    const reportContractSicac = document.getElementById('report-contract-sicac');
    const reportContractTotal = document.getElementById('report-contract-total');
    const reportConsumedAmount = document.getElementById('report-consumed-amount');
    const reportRemainingAmount = document.getElementById('report-remaining-amount');
    const reportPartidasConsumoBody = document.getElementById('report-partidas-consumo-body');
    const reportHesListBody = document.getElementById('report-hes-list-body');
    const reportHesDetailView = document.getElementById('report-hes-detail-view');
    const reportHesDetailNo = document.getElementById('report-hes-detail-no');
    const reportHesPhysicalPercentage = document.getElementById('report-hes-physical-percentage');
    const reportHesPhysicalProgressBar = document.getElementById('report-hes-physical-progress-bar');
    const reportHesFinancialPercentage = document.getElementById('report-hes-financial-percentage');
    const reportHesFinancialProgressBar = document.getElementById('report-hes-financial-progress-bar');
    const reportHesPartidasBody = document.getElementById('report-hes-partidas-body');


    let currentContractId = null; // Para edición de contratos
    let currentHesId = null; // Para edición de HES

    // Nuevos elementos para editar contrato desde selector
    const selectContractToEdit = document.getElementById('select-contract-to-edit');

    // --- Función para mostrar mensajes emergentes (Toasts) ---
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            console.error("No se encontró el contenedor de toasts.");
            return;
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    window.showToast = showToast; // Hacerla global

    // --- Manejar Pestañas (Secciones) ---
    tabButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const targetId = button.getAttribute('data-target');
            
            // Ocultar todas las secciones y desactivar todos los botones
            sections.forEach(section => section.classList.remove('active', 'show'));
            tabButtons.forEach(btn => btn.classList.remove('active'));

            // Mostrar la sección de destino y activar el botón
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active', 'show');
                button.classList.add('active');
            }

            // Cargar datos específicos al cambiar de pestaña
            try {
                if (targetId === 'contract-list') {
                    await loadContractList();
                } else if (targetId === 'general-summary') {
                    await updateSummaryCards();
                    // Re-inicializar el carrusel después de cargar los contratos
                    await renderContractsSlider(); 
                } else if (targetId === 'new-edit-contract') {
                    if (!currentContractId) {
                        document.getElementById('fecha-creado').value = new Date().toISOString().split('T')[0];
                    }
                } else if (targetId === 'hes-management') {
                    await populateContractSelect(hesContractSelect);
                    await loadHesList();
                    if (!currentHesId) { // Solo setear fecha de creación si es nueva HES
                        hesFechaCreadoInput.value = new Date().toISOString().split('T')[0];
                    }
                } else if (targetId === 'trash-can') {
                    await loadTrashCan();
                } else if (targetId === 'physical-advance') {
                    await populateContractSelect(physicalAdvanceContractSelect);
                    physicalAdvanceDetails.style.display = 'none'; // Ocultar detalles al cambiar
                } else if (targetId === 'financial-advance') {
                    await populateContractSelect(financialAdvanceContractSelect);
                    financialAdvanceDetails.style.display = 'none'; // Ocultar detalles al cambiar
                } else if (targetId === 'graphic-summary') {
                    await renderCharts();
                    await renderGraficosSelectores();
                } else if (targetId === 'reports') {
                    await populateContractSelect(reportContractSelect);
                    reportDetails.style.display = 'none';
                    reportHesDetailView.style.display = 'none';
                }
            } catch (error) {
                console.error(`Error al cargar pestaña ${targetId}:`, error);
                showToast(`Error al cargar la sección.`, "error");
            }
        });
    });

    // Asegurar que los event listeners de exportación estén adjuntos después de que los elementos existan
    document.getElementById('export-excel-btn')?.addEventListener('click', () => exportAvanceToExcel('contratos'));
    document.getElementById('export-pdf-btn')?.addEventListener('click', () => exportAvanceToPDF('contratos'));

    document.getElementById('export-physical-excel-btn')?.addEventListener('click', () => exportAvanceToExcel('fisico'));
    document.getElementById('export-physical-pdf-btn')?.addEventListener('click', () => exportAvanceToPDF('fisico'));
    document.getElementById('export-financial-excel-btn')?.addEventListener('click', () => exportAvanceToExcel('financiero'));
    document.getElementById('export-financial-pdf-btn')?.addEventListener('click', () => exportAvanceToPDF('financiero'));

    // Asegurar que los event listeners de gráficos estén adjuntos
    document.getElementById('graficos-contrato-select')?.addEventListener('change', (e) => {
        const contratoId = parseInt(e.target.value);
        const tipo = document.getElementById('graficos-tipo-select').value;
        renderResumenGrafico(contratoId, tipo);
    });
    document.getElementById('graficos-tipo-select')?.addEventListener('change', (e) => {
        const tipo = e.target.value;
        const contratoId = parseInt(document.getElementById('graficos-contrato-select').value);
        renderResumenGrafico(contratoId, tipo);
    });

    // Inicializar selectores de gráficos si la pestaña está activa al inicio
    const resumenGraficoTabBtn = document.querySelector('[data-target="graphic-summary"]');
    if (resumenGraficoTabBtn) {
        resumenGraficoTabBtn.addEventListener('click', async () => {
            await renderGraficosSelectores();
        });
    }
    if (document.getElementById('graphic-summary').classList.contains('active')) {
        renderGraficosSelectores(); // Llamada inicial si es la pestaña activa al cargar
    }

    // --- Funciones para Resumen General ---
    async function updateSummaryCards() {
        try {
            const allContracts = await db.contracts.toArray();
            // Solo actualizar si los elementos existen (estamos en la pestaña de resumen)
            const activeContractsEl = document.getElementById('active-contracts');
            if (activeContractsEl) {
                activeContractsEl.textContent = allContracts.filter(c => c.estatusContrato === 'Activo').length;
            }
            
            const totalContractAmountEl = document.getElementById('total-contract-amount');
            if (totalContractAmountEl) {
                 const totalAmount = allContracts.reduce((sum, c) => sum + (c.montoTotalContrato || 0), 0);
                 totalContractAmountEl.textContent = `USD ${totalAmount.toFixed(2)}`;
            }

            const expiringContractsEl = document.getElementById('expiring-contracts');
            if (expiringContractsEl) {
                // Contar contratos que vencen en 30 días para la tarjeta (si aplica)
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                const expiringContracts = allContracts.filter(c => 
                    { // Usar fechaTerminacionExtendida si existe, si no fechaTerminacion
                        const terminationDate = c.fechaTerminacionExtendida ? new Date(c.fechaTerminacionExtendida) : new Date(c.fechaTerminacion);
                        return terminationDate && terminationDate <= thirtyDaysFromNow && terminationDate >= new Date();
                    }
                ).length;
                expiringContractsEl.textContent = expiringContracts;
            }

            // Mostrar alerta para contratos que vencen en 20 días o menos
            const twentyDaysFromNow = new Date();
            twentyDaysFromNow.setDate(twentyDaysFromNow.getDate() + 20);
            const expiringSoonContracts = allContracts.filter(c => {
                const terminationDate = c.fechaTerminacionExtendida ? new Date(c.fechaTerminacionExtendida) : new Date(c.fechaTerminacion);
                return terminationDate && terminationDate <= twentyDaysFromNow && terminationDate >= new Date();
            });

            if (expiringSoonContracts.length > 0) {
                let message = `¡Alerta! ${expiringSoonContracts.length} contrato(s) vencen pronto (en 20 días o menos):<br>`;
                expiringSoonContracts.forEach(c => {
                    const terminationDate = c.fechaTerminacionExtendida ? new Date(c.fechaTerminacionExtendida) : new Date(c.fechaTerminacion);
                    const daysLeft = Math.ceil((terminationDate - new Date()) / (1000 * 60 * 60 * 24));
                    message += `- Contrato N° Proveedor: ${c.numeroProveedor || 'N/A'} (Vence en ${daysLeft} días)<br>`;
                });
                showToast(message, 'warning');
            }

            const contractsExpiryListEl = document.getElementById('contracts-expiry-list');
            if (contractsExpiryListEl) {
                // ... existing code ...
            }

            const totalModalitiesEl = document.getElementById('total-modalities');
            if (totalModalitiesEl) {
                 const modalities = new Set(allContracts.map(c => c.modalidadContratacion).filter(Boolean));
                 totalModalitiesEl.textContent = modalities.size;
            }

        } catch (error) {
            console.error("Error al actualizar tarjetas de resumen:", error);
            showToast("Error al cargar resumen general.", "error");
        }
    }

    // Función para actualizar el resumen basado en el contrato seleccionado en el slider
    async function updateSummaryByContract(contract) {
        try {
            if (!contract) return;

            // Actualizar Monto Total Contratado (del contrato seleccionado)
            document.getElementById('total-contract-amount').textContent = `USD ${formatMonto(contract.montoTotalContrato)}`;

            // Actualizar Días para Vencimiento (solo para el contrato seleccionado)
            const expiryList = document.getElementById('contracts-expiry-list');
            expiryList.innerHTML = ''; // Limpiar lista anterior
            if (contract.fechaTerminacion) {
                const today = new Date();
                const terminationDate = new Date(contract.fechaTerminacion + 'T00:00:00');
                const diffTime = terminationDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const expiryItem = document.createElement('li');
                expiryItem.textContent = `${contract.numeroSICAC || contract.numeroProveedor || 'Contrato'}: ${diffDays} días`;
                expiryList.appendChild(expiryItem);
            } else {
                 const expiryItem = document.createElement('li');
                 expiryItem.textContent = `${contract.numeroSICAC || contract.numeroProveedor || 'Contrato'}: Fecha de terminación no especificada`;
                 expiryList.appendChild(expiryItem);
            }

            // Actualizar Avance Financiero y Físico (del contrato seleccionado)
            const { physicalPercentage, financialPercentage } = await calculateContractAdvances(contract.id);

            // Avance Financiero
            const financialProgressBar = document.getElementById('financial-progress-bar');
            const financialProgressLabel = document.getElementById('financial-progress-label');
            financialProgressBar.style.width = `${financialPercentage}%`;
            financialProgressBar.setAttribute('aria-valuenow', financialPercentage);
            financialProgressLabel.textContent = `${financialPercentage.toFixed(2)}%`;

            // Avance Físico
            const physicalProgressBar = document.getElementById('physical-progress-bar');
            const physicalProgressLabel = document.getElementById('physical-progress-label');
            physicalProgressBar.style.width = `${physicalPercentage}%`;
            physicalProgressBar.setAttribute('aria-valuenow', physicalPercentage);
            physicalProgressLabel.textContent = `${physicalPercentage.toFixed(2)}%`;


        } catch (error) {
            console.error("Error al actualizar resumen por contrato:", error);
            showToast("Error al cargar detalles del contrato.", "error");
        }
    }

    // Función auxiliar para formatear monto a USD 32.000,00
    function formatMonto(amount) {
        if (amount === undefined || amount === null) return '0.00';
        return parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    // --- Lógica del Formulario Nuevo/Editar Contrato ---

    // Función para calcular Período de Culminación (Días)
    function calculatePeriodoCulminacion() {
        const fechaInicio = fechaInicioInput.value;
        const fechaTerminacion = fechaTerminacionInput.value;

        if (fechaInicio && fechaTerminacion) {
            const start = new Date(fechaInicio + 'T00:00:00'); // Añadir hora para evitar problemas de zona horaria
            const end = new Date(fechaTerminacion + 'T00:00:00');
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            periodoCulminacionInput.value = diffDays;
        } else {
            periodoCulminacionInput.value = '';
        }
    }
    fechaInicioInput.addEventListener('change', calculatePeriodoCulminacion);
    fechaTerminacionInput.addEventListener('change', calculatePeriodoCulminacion);

    // Añadir Partida a la tabla de contratos
    addPartidaBtn.addEventListener('click', () => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${partidasTableBody.children.length + 1}</td>
            <td><input type="text" class="form-control" name="descripcion" placeholder="Descripción"></td>
            <td><input type="number" class="form-control" name="cantidad" value="1" min="1"></td>
            <td><input type="text" class="form-control" name="umd" placeholder="UMD"></td>
            <td><input type="number" class="form-control" name="precioUnitario" value="0.00" step="0.01"></td>
            <td><span class="total-partida">0.00</span></td>
            <td><button type="button" class="btn btn-danger btn-sm remove-partida-btn"><i class="fas fa-trash"></i></button></td>
        `;
        partidasTableBody.appendChild(row);
        updateContractPartidaTotals();
    });

    // Delegación de eventos para eliminar partida y actualizar totales en contratos
    partidasTableBody.addEventListener('click', (e) => {
        if (e.target.closest('.remove-partida-btn')) {
            e.target.closest('tr').remove();
            updateContractPartidaTotals();
        }
    });

    partidasTableBody.addEventListener('input', (e) => {
        if (e.target.name === 'cantidad' || e.target.name === 'precioUnitario') {
            updateContractPartidaTotals(e.target.closest('tr'));
        }
    });

    // Actualiza los totales de partidas y el Monto Original/Total del Contrato
    function updateContractPartidaTotals(row = null) {
        let totalOriginalPartidas = 0;
        const rows = row ? [row] : partidasTableBody.children;

        Array.from(rows).forEach(r => {
            const cantidad = parseFloat(r.querySelector('[name="cantidad"]').value) || 0;
            const precioUnitario = parseFloat(r.querySelector('[name="precioUnitario"]').value) || 0;
            const totalPartida = cantidad * precioUnitario;
            r.querySelector('.total-partida').textContent = totalPartida.toFixed(2);
            totalOriginalPartidas += totalPartida;
        });

        montoOriginalInput.value = totalOriginalPartidas.toFixed(2);
        // Recalcular Monto Total del Contrato
        const montoModificado = parseFloat(montoModificadoInput.value) || 0;
        montoTotalContratoInput.value = (totalOriginalPartidas + montoModificado).toFixed(2);
    }
    // Escuchar cambios en Monto Modificado para recalcular Monto Total
    montoModificadoInput.addEventListener('input', updateContractPartidaTotals);


    // Limpiar formulario de contrato completo
    clearContractFormBtn.addEventListener('click', () => {
        contractForm.reset();
        partidasTableBody.innerHTML = '';
        document.getElementById('adjuntar-archivos-info').textContent = 'Ningún archivo seleccionado';
        currentContractId = null;
        montoOriginalInput.value = '0.00'; // Resetear también
        montoModificadoInput.value = '0.00'; // Resetear también
        montoTotalContratoInput.value = '0.00'; // Resetear también
        showToast("Formulario de contrato limpiado.", "info");
    });

    // Guardar/Actualizar Contrato
    saveContractBtn.addEventListener('click', async (event) => {
        event.preventDefault(); // Evitar el envío del formulario por defecto

        const contractId = document.getElementById('contract-id').value;
        const numeroProveedor = document.getElementById('numero-proveedor').value;
        const fechaFirmaContrato = document.getElementById('fecha-firma-contrato').value;
        const fechaCreado = document.getElementById('fecha-creado').value;
        const fechaInicio = document.getElementById('fecha-inicio').value;
        // Obtener valores de los campos de extensión
        const fechaTerminacionOriginal = fechaTerminacionOriginalInput.value;
        const diasExtension = parseInt(diasExtensionInput.value) || 0;
        const fechaTerminacionExtendida = fechaTerminacionExtendidaInput.value;
        // La fechaTerminacion principal para compatibilidad con lógica existente
        const fechaTerminacion = fechaTerminacionExtendida || fechaTerminacionOriginal;

        const periodoCulminacion = parseInt(document.getElementById('periodo-culminacion').value) || 0;
        const numeroSICAC = document.getElementById('numero-sicac').value;
        const divisionArea = document.getElementById('division-area').value;
        const eemn = document.getElementById('eemn').value;
        const region = document.getElementById('region').value;
        const naturalezaContratacion = document.getElementById('naturaleza-contratacion').value;
        const lineaServicio = document.getElementById('linea-servicio').value;
        const noPeticionOferta = document.getElementById('no-peticion-oferta').value;
        const modalidadContratacion = modalidadContratacionSelect.value;
        const regimenLaboral = document.getElementById('regimen-laboral').value;
        const objetoContractual = document.getElementById('objeto-contractual').value;
        const fechaCambioAlcance = document.getElementById('fecha-cambio-alcance').value;
        const montoOriginal = parseFloat(montoOriginalInput.value) || 0;
        const montoModificado = parseFloat(montoModificadoInput.value) || 0;
        const montoTotalContrato = parseFloat(montoTotalContratoInput.value) || 0;
        const numeroContratoInterno = document.getElementById('numero-contrato-interno').value;
        const observaciones = document.getElementById('observaciones').value;
        const estatusContrato = document.getElementById('estatus-contrato').value;
        const moneda = document.getElementById('moneda').value;
        // Los archivos adjuntos requieren manejo especial
        const archivosAdjuntos = await handleFileUpload(
            document.getElementById('adjuntar-archivos'),
            document.getElementById('adjuntar-archivos-info')
        );

        // Crear un objeto limpio con solo las propiedades esperadas para evitar problemas de Dexie
        const cleanedContractData = {
            numeroProveedor: numeroProveedor,
            fechaFirmaContrato: fechaFirmaContrato,
            fechaCreado: fechaCreado,
            fechaInicio: fechaInicio,
            // Guardar campos de extensión
            fechaTerminacionOriginal: fechaTerminacionOriginal,
            diasExtension: diasExtension,
            fechaTerminacionExtendida: fechaTerminacionExtendida,
            // Mantener fechaTerminacion para compatibilidad
            fechaTerminacion: fechaTerminacion,
            periodoCulminacion: periodoCulminacion,
            numeroSICAC: numeroSICAC,
            divisionArea: divisionArea,
            eemn: eemn,
            region: region,
            naturalezaContratacion: naturalezaContratacion,
            lineaServicio: lineaServicio,
            noPeticionOferta: noPeticionOferta,
            modalidadContratacion: modalidadContratacion,
            regimenLaboral: regimenLaboral,
            objetoContractual: objetoContractual,
            fechaCambioAlcance: fechaCambioAlcance,
            montoOriginal: montoOriginal,
            montoModificado: montoModificado,
            montoTotalContrato: montoTotalContrato,
            numeroContratoInterno: numeroContratoInterno,
            observaciones: observaciones,
            estatusContrato: estatusContrato,
            moneda: moneda,
            // No incluir archivosAdjuntos aquí, se manejan por separado
        };

        if (!numeroProveedor || !fechaFirmaContrato || !fechaInicio || !fechaTerminacion) {
            showToast("Por favor, complete los campos obligatorios: N° Proveedor, Fecha Firma, Fecha Inicio y Fecha Terminación.", "warning");
            saveContractBtn.disabled = false; // Habilitar si falla la validación inicial
            return;
        }

        try {
            let contractId;
            if (currentContractId) {
                console.log("Operación: Actualizar", currentContractId);
                await db.contracts.update(currentContractId, cleanedContractData);
                contractId = currentContractId;
                showToast("Contrato actualizado exitosamente.", "success");
            } else {
                // Validar N° SICAC duplicado solo al crear un nuevo contrato
                if (numeroSICAC) {
                    const existingContract = await db.contracts.where({ numeroSICAC: numeroSICAC }).first();
                    if (existingContract) {
                        showToast(`Ya existe un contrato con el N° SICAC: ${numeroSICAC}. Por favor, edite el contrato existente o use otro número.`, "error");
                        saveContractBtn.disabled = false; // Habilitar si hay duplicado de SICAC
                        return;
                    }
                }
                console.log("Operación: Añadir nuevo\n");
                contractId = await db.contracts.add(cleanedContractData);
                showToast("Contrato guardado exitosamente.", "success");
            }

            // Guardar partidas asociadas al contrato
            await db.partidas.where({ contractId: contractId }).delete(); // Eliminar partidas existentes para actualizar
            const partidaRows = partidasTableBody.querySelectorAll('tr');
            for (const row of partidaRows) {
                const partida = {
                    contractId: contractId,
                    descripcion: row.querySelector('[name="descripcion"]').value,
                    cantidad: parseFloat(row.querySelector('[name="cantidad"]').value) || 0,
                    umd: row.querySelector('[name="umd"]').value,
                    precioUnitario: parseFloat(row.querySelector('[name="precioUnitario"]').value) || 0,
                    total: parseFloat(row.querySelector('.total-partida').textContent) || 0
                };
                await db.partidas.add(partida);
            }
            
            // Manejar archivos adjuntos
            const archivosInput = document.getElementById('adjuntar-archivos');
            if (archivosInput.files.length > 0) {
                await guardarArchivos(contractId, 'contrato', archivosInput.files);
            } else if (currentContractId) {
                // Si no se seleccionaron nuevos archivos al actualizar, pero había archivos antes,
                // podrías querer mantenerlos o tener una forma de eliminarlos. Por ahora, si
                // no se seleccionan nuevos, se eliminan los viejos. Si quieres mantenerlos, 
                // necesitarías una lógica diferente aquí (ej. no borrar si no se suben nuevos).
                // Para esta corrección, si no subes nuevos, se borran los viejos para esa entidadId/entidadTipo.
                 await db.archivos.where({ entidadId: contractId, entidadTipo: 'contrato' }).delete();
            }

            clearContractFormBtn.click();
            loadContractList();
            tabButtons.forEach(btn => {
                if (btn.getAttribute('data-target') === 'contract-list') {
                    btn.click();
                }
            });

        } catch (error) {
            console.log("Se ha capturado un error al guardar/actualizar el contrato:", error);
            showToast("Ocurrió un error al guardar/actualizar el contrato.", "error");
        } finally {
            // Habilitar el botón al finalizar (éxito, error o validación fallida)
            saveContractBtn.disabled = false;
        }
    });

    // Función para manejar archivos adjuntos
    async function handleFileUpload(fileInput, infoSpan) {
        const files = fileInput.files;
        if (files.length > 0) {
            const fileList = Array.from(files).map(file => ({
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified
            }));
            infoSpan.textContent = `${files.length} archivo(s) seleccionado(s)`;
            return fileList;
        } else {
            infoSpan.textContent = 'Ningún archivo seleccionado';
            return [];
        }
    }

    // Modificar el event listener de adjuntar archivos en contratos
    document.getElementById('adjuntar-archivos').addEventListener('change', async (e) => {
        const fileList = await handleFileUpload(e.target, document.getElementById('adjuntar-archivos-info'));
        // Aquí podrías guardar la lista de archivos en la base de datos o manejarla según necesites
    });


    // --- Lógica de Lista de Contratos ---

    async function loadContractList(filters = {}) {
        console.log("Cargando lista de contratos con filtros:", filters); // Log para depuración
        contractListBody.innerHTML = '';

        let contracts = await db.contracts.toArray();

        if (filters.numeroProveedor) {
            contracts = contracts.filter(c => c.numeroProveedor.toLowerCase().includes(filters.numeroProveedor.toLowerCase()));
        }
        if (filters.numeroSICAC) {
            contracts = contracts.filter(c => c.numeroSICAC && c.numeroSICAC.toLowerCase().includes(filters.numeroSICAC.toLowerCase()));
        }

        if (contracts.length === 0) {
            contractListBody.innerHTML = `<tr><td colspan="8" class="text-center">No hay contratos registrados.</td></tr>`;
            return;
        }

        for (const contract of contracts) {
            const { physicalAdvancePercentage, financialAdvancePercentage } = await calculateContractAdvances(contract.id);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contract.numeroProveedor}</td>
                <td>${contract.numeroSICAC || '-'}</td>
                <td>${contract.fechaInicio}</td>
                <td>${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}</td>
                <td><div class="progress"><div class="progress-bar bg-info" style="width: ${physicalAdvancePercentage}%">${physicalAdvancePercentage.toFixed(1)}%</div></div></td>
                <td><div class="progress"><div class="progress-bar bg-success" style="width: ${financialAdvancePercentage}%">${financialAdvancePercentage.toFixed(1)}%</div></div></td>
                <td>${contract.estatusContrato || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-contract-btn" data-id="${contract.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-contract-btn" data-id="${contract.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            contractListBody.appendChild(row);
        }
    }

    applyFiltersBtn.addEventListener('click', () => {
        const filters = {
            numeroProveedor: filterProveedorInput.value,
            numeroSICAC: filterSicacInput.value
        };
        loadContractList(filters);
    });

    clearFiltersBtn.addEventListener('click', () => {
        filterProveedorInput.value = '';
        filterSicacInput.value = '';
        loadContractList();
        showToast("Filtros limpiados.", "info");
    });

    // Editar y Eliminar Contrato (Delegación de eventos)
    contractListBody.addEventListener('click', async (e) => {
        const targetBtn = e.target.closest('button');
        if (!targetBtn) return;

        const contractId = parseInt(targetBtn.dataset.id);

        if (targetBtn.classList.contains('edit-contract-btn')) {
            // Cargar contrato para edición usando la nueva función
            cargarContratoParaEdicion(contractId);
        } else if (targetBtn.classList.contains('delete-contract-btn')) {
            if (confirm('¿Está seguro de que desea enviar este contrato a la papelera?')) {
                try {
                    const contractToDelete = await db.contracts.get(contractId);
                    const relatedPartidas = await db.partidas.where({ contractId: contractId }).toArray();
                    // Mover a la papelera en lugar de eliminar directamente
                    await db.trash.add({
                        originalId: contractId,
                        type: 'contract',
                        data: { ...contractToDelete, partidas: relatedPartidas }, // Incluir partidas en los datos guardados
                        deletedAt: new Date().toISOString()
                    });
                    await db.contracts.delete(contractId);
                    // Las partidas y HES asociadas se eliminarán/marcarán con la lógica de recuperación
                    // para simplificar ahora, pero se puede mejorar para mover también a papelera.
                    // Por ahora, al eliminar el contrato, las partidas y HES "huérfanas" se gestionarán al restaurar.
                    // Idealmente, también se mueven las partidas y HES a la papelera si el contrato se elimina.

                    // Para que las HES vinculadas también vayan a la papelera
                    const relatedHes = await db.hes.where({ contractId: contractId }).toArray();
                    for (const hes of relatedHes) {
                        await db.trash.add({
                            originalId: hes.id,
                            type: 'hes',
                            data: hes,
                            deletedAt: new Date().toISOString()
                        });
                        await db.hes.delete(hes.id);
                        await db.hesPartidas.where({ hesId: hes.id }).delete();
                    }
                    await db.partidas.where({ contractId: contractId }).delete(); // Eliminar partidas del contrato

                    showToast("Contrato enviado a la papelera exitosamente.", "success");
                    loadContractList();
                    updateSummaryCards();
                } catch (error) {
                    console.error("Error al enviar contrato a la papelera:", error);
                    showToast("Error al enviar el contrato a la papelera: " + error.message, "error");
                }
            }
        }
    });

    // Cargar contrato en el formulario de edición
    async function cargarContratoParaEdicion(contractId) {
        if (!contractId) return; // No hacer nada si no hay ID
        try {
            const contract = await db.contracts.get(contractId);
            if (contract) {
                currentContractId = contractId; // Establecer el ID del contrato actual
                // Rellenar todos los campos del formulario con los datos del contrato
                document.getElementById('numero-proveedor').value = contract.numeroProveedor || '';
                document.getElementById('fecha-firma-contrato').value = contract.fechaFirmaContrato || '';
                document.getElementById('fecha-creado').value = contract.fechaCreado || '';
                document.getElementById('fecha-inicio').value = contract.fechaInicio || '';
                // Cargar campos de extensión
                fechaTerminacionOriginalInput.value = contract.fechaTerminacionOriginal || contract.fechaTerminacion || ''; // Usar original si existe, si no, la vieja fechaTerminacion
                diasExtensionInput.value = contract.diasExtension || 0;
                fechaTerminacionExtendidaInput.value = contract.fechaTerminacionExtendida || '';
                // Actualizar el campo de fechaTerminacion principal para cálculos existentes si es necesario (manteniendo compatibilidad)
                document.getElementById('fecha-terminacion').value = contract.fechaTerminacionExtendida || contract.fechaTerminacionOriginal || contract.fechaTerminacion || '';

                // Calcular y mostrar período de culminación
                calculatePeriodoCulminacion();

                document.getElementById('numero-sicac').value = contract.numeroSICAC || '';
                document.getElementById('division-area').value = contract.divisionArea || '';
                document.getElementById('eemn').value = contract.eemn || '';
                document.getElementById('region').value = contract.region || '';
                document.getElementById('naturaleza-contratacion').value = contract.naturalezaContratacion || '';
                document.getElementById('linea-servicio').value = contract.lineaServicio || '';
                document.getElementById('no-peticion-oferta').value = contract.noPeticionOferta || '';
                modalidadContratacionSelect.value = contract.modalidadContratacion || 'Obra';
                document.getElementById('regimen-laboral').value = contract.regimenLaboral || '';
                document.getElementById('objeto-contractual').value = contract.objetoContractual || '';
                document.getElementById('fecha-cambio-alcance').value = contract.fechaCambioAlcance || '';
                montoOriginalInput.value = contract.montoOriginal !== undefined ? contract.montoOriginal.toFixed(2) : '0.00';
                montoModificadoInput.value = contract.montoModificado !== undefined ? contract.montoModificado.toFixed(2) : '0.00';
                montoTotalContratoInput.value = contract.montoTotalContrato !== undefined ? contract.montoTotalContrato.toFixed(2) : '0.00';
                document.getElementById('numero-contrato-interno').value = contract.numeroContratoInterno || '';
                document.getElementById('observaciones').value = contract.observaciones || '';
                document.getElementById('estatus-contrato').value = contract.estatusContrato || 'Activo';
                document.getElementById('moneda').value = contract.moneda || 'USD';

                // Cargar partidas asociadas
                partidasTableBody.innerHTML = ''; // Limpiar partidas actuales
                const partidas = await db.partidas.where({ contractId: contractId }).toArray();
                partidas.forEach((p, index) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td><input type="text" class="form-control" name="descripcion" value="${p.descripcion || ''}"></td>
                        <td><input type="number" class="form-control" name="cantidad" value="${p.cantidad || 1}" min="1"></td>
                        <td><input type="text" class="form-control" name="umd" value="${p.umd || ''}"></td>
                        <td><input type="number" class="form-control" name="precioUnitario" value="${p.precioUnitario || 0.00}" step="0.01"></td>
                        <td><span class="total-partida">${(p.total || 0).toFixed(2)}</span></td>
                        <td><button type="button" class="btn btn-danger btn-sm remove-partida-btn"><i class="fas fa-trash"></i></button></td>
                    `;
                    partidasTableBody.appendChild(row);
                });
                updateContractPartidaTotals(); // Recalcular totales
                calculatePeriodoCulminacion(); // Recalcular período de culminación

                // Cargar archivos adjuntos
                const archivos = await recuperarArchivos(contractId, 'contrato');
                mostrarArchivosAdjuntos(archivos, 'archivos-contrato'); // Mostrar archivos adjuntos
                if (archivos.length > 0) {
                     document.getElementById('adjuntar-archivos-info').textContent = 
                         `${archivos.length} archivo(s) adjunto(s)`;
                 } else {
                      document.getElementById('adjuntar-archivos-info').textContent = 'Ningún archivo seleccionado';
                 }

                showToast("Contrato cargado para edición.", "info");

                // Cambiar a la pestaña de Nuevo/Editar Contrato
                tabButtons.forEach(btn => {
                    if (btn.getAttribute('data-target') === 'new-edit-contract') {
                        btn.click();
                    }
                });

            } else {
                showToast("Contrato no encontrado.", "error");
            }
        } catch (error) {
            console.error("Error al cargar contrato para edición:", error);
            showToast("Error al cargar contrato para edición: " + error.message, "error");
        }
    }

    // Poblar selector de contratos para edición y cargar al cambiar
    async function populateContractEditSelect() {
         const selectElement = document.getElementById('select-contract-to-edit');
         if (!selectElement) return; // Asegurarse de que el elemento existe

         selectElement.innerHTML = '<option value="">-- Seleccione un Contrato --</option>';
         const contracts = await db.contracts.toArray();
         contracts.forEach(contract => {
             const option = document.createElement('option');
             option.value = contract.id;
             option.textContent = `${contract.numeroSICAC || 'Sin SICAC'} (${contract.numeroProveedor || 'Sin Proveedor'})`;
             selectElement.appendChild(option);
         });

         // Event listener para cargar el contrato seleccionado
         selectElement.addEventListener('change', (e) => {
             const contractId = parseInt(e.target.value);
             if (contractId) {
                 cargarContratoParaEdicion(contractId);
             } else {
                 // Si selecciona la opción por defecto, limpiar el formulario
                 clearContractFormBtn.click();
             }
         });
    }

    // Llama a populateContractEditSelect cuando se carga la pestaña de edición
    document.querySelector('[data-target="new-edit-contract"]').addEventListener('click', populateContractEditSelect);


    // --- Lógica de Gestión de HES ---

    // Poblar select de contratos para HES
    async function populateContractSelect(selectElement) {
        selectElement.innerHTML = '<option value="">Seleccione un Contrato</option>';
        const contracts = await db.contracts.toArray();
        contracts.forEach(contract => {
            const option = document.createElement('option');
            option.value = contract.id;
            option.textContent = `${contract.numeroSICAC} (${contract.numeroProveedor})`;
            selectElement.appendChild(option);
        });
    }

    // Cargar partidas del contrato seleccionado en la tabla de HES
    hesContractSelect.addEventListener('change', async () => {
        const contractId = parseInt(hesContractSelect.value);
        hesPartidasTableBody.innerHTML = '';
        hesPartidasInfo.style.display = 'block';

        if (!contractId) {
            hesPartidasInfo.textContent = 'Seleccione un contrato para cargar sus partidas.';
            clearHesPartidaTotals();
            return;
        }

        const contract = await db.contracts.get(contractId);
        if (!contract) {
            hesPartidasInfo.textContent = 'Contrato no encontrado.';
            clearHesPartidaTotals();
            return;
        }

        // Calcular avance físico y financiero del contrato
        const { physicalAdvancePercentage, financialAdvancePercentage } = await calculateContractAdvances(contractId);

        // Mostrar advertencia pero permitir edición
        if (physicalAdvancePercentage >= 99.99 || financialAdvancePercentage >= 99.99) {
            hesPartidasInfo.textContent = `Advertencia: Este contrato ha alcanzado el 100% de avance físico o financiero.`;
            hesPartidasInfo.classList.remove('alert-info');
            hesPartidasInfo.classList.add('alert-warning');
        } else {
            hesPartidasInfo.classList.remove('alert-warning');
            hesPartidasInfo.classList.add('alert-info');
        }
        
        const partidas = await db.partidas.where({ contractId: contractId }).toArray();
        if (partidas.length === 0) {
            hesPartidasInfo.textContent = 'El contrato seleccionado no tiene partidas.';
            return;
        }
        
        hesPartidasInfo.style.display = 'none';

        for (const partida of partidas) {
            const executedAmountForPartida = await getExecutedQuantityForContractPartida(partida.id, currentHesId);
            const availableQuantity = partida.cantidad - executedAmountForPartida;

            const row = document.createElement('tr');
            row.dataset.contractPartidaId = partida.id;
            row.innerHTML = `
                <td>${partidas.indexOf(partida) + 1}</td>
                <td>${partida.descripcion}</td>
                <td>${partida.umd}</td>
                <td>${partida.precioUnitario.toFixed(2)}</td>
                <td>${partida.cantidad}</td>
                <td>${executedAmountForPartida.toFixed(2)}</td>
                <td>${availableQuantity.toFixed(2)}</td>
                <td><input type="number" class="form-control hes-cantidad-ejecutar" min="0" max="${availableQuantity}" step="0.01" value="0.00"></td>
                <td><span class="hes-partida-total">0.00</span></td>
            `;
            hesPartidasTableBody.appendChild(row);
        }
        updateHesPartidaTotals();
    });

    // Delegación de eventos para input de cantidad a ejecutar en HES
    hesPartidasTableBody.addEventListener('input', (e) => {
        if (e.target.classList.contains('hes-cantidad-ejecutar')) {
            const input = e.target;
            const row = input.closest('tr');
            const availableQuantity = parseFloat(row.children[6].textContent); // Cantidad Disponible

            let cantidadEjecutar = parseFloat(input.value) || 0;
            if (cantidadEjecutar < 0) cantidadEjecutar = 0;
            
            // Validar contra la cantidad disponible. Permitimos un pequeño margen por posibles errores de coma flotante.
            if (cantidadEjecutar > availableQuantity + 0.001) {
                 showToast(`La cantidad a ejecutar excede la cantidad disponible (${availableQuantity.toFixed(2)}).`, "warning");
                 // Opcional: Restablecer el valor al máximo disponible
                 cantidadEjecutar = availableQuantity;
                 input.value = cantidadEjecutar.toFixed(2);
             }

            // Asegurarse de que el valor tiene 2 decimales si es un número válido
            // Si el usuario está escribiendo y el número aún no está completo (ej. '12.'), no formatear todavía
            if (!isNaN(cantidadEjecutar) && input.value.trim() !== '' && !input.value.endsWith('.') && !input.value.endsWith('.0')) {
                input.value = cantidadEjecutar.toFixed(2);
            }

            updateHesPartidaTotals(row); // Actualizar totales después de la validación/formato
        }
    });

    // Event listeners para los botones de incremento/decremento (opcional, pero manteniendo la funcionalidad)
    hesPartidasTableBody.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('button');
        if (!targetBtn) return;

        // Asegurarse de que el clic fue en uno de los botones +/- dentro de un input-group
        if (!targetBtn.classList.contains('increment-hes-cantidad') && !targetBtn.classList.contains('decrement-hes-cantidad')) {
            return; // Salir si no es uno de los botones que nos interesa
        }

        const row = targetBtn.closest('tr');
        const input = row.querySelector('.hes-cantidad-ejecutar');
        const availableQuantity = parseFloat(row.children[6].textContent); // Cantidad Disponible
        const step = parseFloat(input.step) || 0.01; // Usar el step del input, default 0.01

        let currentValue = parseFloat(input.value) || 0;

        if (targetBtn.classList.contains('increment-hes-cantidad')) {
            currentValue += step;
        } else if (targetBtn.classList.contains('decrement-hes-cantidad')) {
            currentValue -= step;
        }

        // Asegurarse de que el valor esté dentro de los límites (0 y cantidad disponible)
        if (currentValue < 0) currentValue = 0;
        // Limitar al máximo disponible, permitiendo un pequeño margen por decimales
        if (currentValue > availableQuantity + 0.001) currentValue = availableQuantity;

        input.value = currentValue.toFixed(2); // Formatear y actualizar el input
        updateHesPartidaTotals(row); // Actualizar totales

        // Disparar evento input en el campo numérico después de actualizar su valor
        // Esto asegura que el event listener 'input' en el campo se active y haga sus validaciones/actualizaciones si es necesario
        const inputEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);
    });

    // Calcula el total de la partida HES y los totales de la HES
    function updateHesPartidaTotals(row = null) {
        let subtotalHes = 0;
        const rows = row ? [row] : hesPartidasTableBody.children;

        Array.from(rows).forEach(r => {
            const cantidadEjecutar = parseFloat(r.querySelector('.hes-cantidad-ejecutar').value) || 0;
            const precioUnitario = parseFloat(r.children[3].textContent) || 0; // Precio Unitario del contrato
            const totalPartidaHes = cantidadEjecutar * precioUnitario; // Cálculo base

            // Obtener el monto adicional manual para esta partida si el campo existe
            const montoAdicionalManualInput = r.querySelector('.hes-monto-adicional-manual');
            const montoAdicionalManual = montoAdicionalManualInput ? parseFloat(montoAdicionalManualInput.value) || 0 : 0;

            const totalConAdicional = totalPartidaHes + montoAdicionalManual; // Sumar monto adicional
            r.querySelector('.hes-partida-total').textContent = totalConAdicional.toFixed(2); // Mostrar total con adicional
            subtotalHes += totalConAdicional; // Sumar al subtotal de la HES
        });

        hesSubtotalInput.value = subtotalHes.toFixed(2);
        
        // Leer el porcentaje de gastos administrativos ingresado por el usuario
        const gastosAdminPercentageInput = document.getElementById('hes-gastos-administrativos-percentage');
        const gastosAdminPercentage = gastosAdminPercentageInput ? parseFloat(gastosAdminPercentageInput.value) || 0 : 0;

        // Calcular gastos administrativos usando el porcentaje del usuario
        const gastosAdmin = subtotalHes * (gastosAdminPercentage / 100);
        hesGastosAdministrativosInput.value = gastosAdmin.toFixed(2);
        hesTotalInput.value = (subtotalHes + gastosAdmin).toFixed(2);
    }

    function clearHesPartidaTotals() {
        hesSubtotalInput.value = '0.00';
        hesGastosAdministrativosInput.value = '0.00';
        hesTotalInput.value = '0.00';
    }


    // Limpiar formulario HES
    clearHesFormBtn.addEventListener('click', () => {
        hesForm.reset();
        hesPartidasTableBody.innerHTML = '';
        hesPartidasInfo.style.display = 'block';
        hesPartidasInfo.textContent = 'Seleccione un contrato para cargar sus partidas.';
        hesPartidasInfo.classList.remove('alert-danger');
        hesPartidasInfo.classList.add('alert-info');
        hesAnexosInfoSpan.textContent = 'Ningún archivo seleccionado';
        currentHesId = null;
        saveHesBtn.disabled = false; // Asegurarse de que el botón no esté deshabilitado por un contrato al 100%
        hesFechaCreadoInput.value = new Date().toISOString().split('T')[0]; // Resetear fecha de creado
        clearHesPartidaTotals();
        showToast("Formulario HES limpiado.", "info");
    });

    // Guardar/Actualizar HES
    hesForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const contractId = parseInt(hesContractSelect.value);
        if (!contractId) {
            showToast("Debe seleccionar un contrato asociado para la HES.", "warning");
            return;
        }

        const hesData = {
            contractId: contractId,
            noHes: hesNoHesInput.value,
            fechaInicioHes: hesFechaInicioInput.value,
            fechaFinalHes: hesFechaFinalInput.value,
            aprobado: hesAprobadoSelect.value,
            textoHes: hesTextoHesTextarea.value,
            ejecutada: hesEjecutadaCheckbox.checked,
            fechaCreadoHes: hesFechaCreadoInput.value,
            fechaAprobadoHes: hesFechaAprobadoInput.value,
            textoBreveHes: hesTextoBreveInput.value,
            valuacion: parseFloat(hesValuacionInput.value) || 0,
            lugarPrestacionServicio: hesLugarPrestacionServicioInput.value,
            responsableSdo: hesResponsableSdoInput.value,
            subTotalHes: parseFloat(hesSubtotalInput.value) || 0,
            gastosAdministrativosHes: parseFloat(hesGastosAdministrativosInput.value) || 0,
            totalHes: parseFloat(hesTotalInput.value) || 0,
            anexos: await handleFileUpload(
                document.getElementById('hes-anexos'),
                document.getElementById('hes-anexos-info')
            )
        };

        if (!hesData.noHes || !hesData.fechaInicioHes || !hesData.fechaFinalHes) {
            showToast("Por favor, complete los campos obligatorios de la HES: No. HES, Fecha Inicio y Fecha Final.", "warning");
            return;
        }

        const hesPartidaRows = hesPartidasTableBody.querySelectorAll('tr');
        let hasExecutedQuantity = false;
        const hesPartidasToSave = [];

        for (const row of hesPartidaRows) {
            const contractPartidaId = parseInt(row.dataset.contractPartidaId);
            const cantidadEjecutada = parseFloat(row.querySelector('.hes-cantidad-ejecutar').value) || 0;
            const cantidadOriginalContract = parseFloat(row.children[4].textContent);
            const precioUnitario = parseFloat(row.children[3].textContent);
            const umd = row.children[2].textContent;
            const descripcion = row.children[1].textContent;
            const montoAdicionalManual = parseFloat(row.querySelector('.hes-monto-adicional-manual')?.value) || 0; // Obtener monto adicional manual
            const totalPartidaHes = cantidadEjecutada * precioUnitario + montoAdicionalManual; // Recalcular total incluyendo adicional

            if (cantidadEjecutada > 0 || montoAdicionalManual > 0) {
                hasExecutedQuantity = true;
                const executedAmountForPartida = await getExecutedQuantityForContractPartida(contractPartidaId, currentHesId);
                const availableQuantity = cantidadOriginalContract - executedAmountForPartida;

                if (cantidadEjecutada > availableQuantity + 0.001) {
                    showToast(`La cantidad a ejecutar para la partida "${descripcion}" excede la cantidad disponible.`, "error");
                    return;
                }

                hesPartidasToSave.push({
                    contractPartidaId: contractPartidaId,
                    descripcion: descripcion,
                    cantidadOriginal: cantidadOriginalContract,
                    cantidadEjecutada: cantidadEjecutada,
                    umd: umd,
                    precioUnitario: precioUnitario,
                    totalPartidaHes: totalPartidaHes, // Guardar el total con adicional
                    montoAdicionalManual: montoAdicionalManual // Guardar el monto adicional manual
                });
            }
        }

        if (!hasExecutedQuantity) {
            showToast("Debe ingresar al menos una cantidad a ejecutar o un monto adicional en las partidas de la HES.", "warning");
            return;
        }

        try {
            let hesId;
            if (currentHesId) {
                await db.hes.update(currentHesId, hesData);
                hesId = currentHesId;
                showToast("HES actualizada exitosamente.", "success");
            } else {
                hesId = await db.hes.add(hesData);
                showToast("HES guardada exitosamente.", "success");
            }

            // Eliminar hesPartidas existentes para esta HES antes de guardar las nuevas (si es actualización)
            if (currentHesId) {
                await db.hesPartidas.where('hesId').equals(currentHesId).delete();
            }

            // Guardar las hesPartidas asociadas a esta HES
            for (const partidaHes of hesPartidasToSave) {
                await db.hesPartidas.add({
                    hesId: hesId,
                    contractPartidaId: partidaHes.contractPartidaId,
                    descripcion: partidaHes.descripcion,
                    cantidadOriginal: partidaHes.cantidadOriginal,
                    cantidadEjecutada: partidaHes.cantidadEjecutada,
                    umd: partidaHes.umd,
                    precioUnitario: partidaHes.precioUnitario,
                    totalPartidaHes: partidaHes.totalPartidaHes,
                    montoAdicionalManual: partidaHes.montoAdicionalManual // Guardar el monto adicional manual
                 });
             }

            clearHesFormBtn.click();
            await loadHesList();
            await loadContractList();
            await updateSummaryCards();
            await populateContractSelect(hesContractSelect);
        } catch (error) {
            console.error("Error al guardar/actualizar HES:", error);
            showToast("Error al guardar/actualizar HES: " + error.message, "error");
        }
    });

    // Cargar lista de HES
    async function loadHesList() {
        hesListBody.innerHTML = '';
        const allHes = await db.hes.toArray();

        if (allHes.length === 0) {
            hesListBody.innerHTML = `<tr><td colspan="7" class="text-center">No hay HES registradas.</td></tr>`;
            return;
        }

        for (const hes of allHes) {
            const contract = await db.contracts.get(hes.contractId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contract ? contract.numeroSICAC : 'N/A'}</td>
                <td>${hes.noHes}</td>
                <td>${hes.fechaInicioHes}</td>
                <td>${hes.fechaFinalHes}</td>
                <td>${hes.totalHes.toFixed(2)}</td>
                <td>${hes.aprobado}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-hes-btn" data-id="${hes.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-hes-btn" data-id="${hes.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            hesListBody.appendChild(row);
        }
    }

    // Editar y Eliminar HES (Delegación de eventos)
    hesListBody.addEventListener('click', async (e) => {
        const targetBtn = e.target.closest('button');
        if (!targetBtn) return;

        const hesId = parseInt(targetBtn.dataset.id);

        if (targetBtn.classList.contains('edit-hes-btn')) {
            const hes = await db.hes.get(hesId);
            if (hes) {
                currentHesId = hesId;
                hesContractSelect.value = hes.contractId;
                await populateContractSelect(hesContractSelect); // Asegurarse que el select esté cargado
                hesContractSelect.value = hes.contractId; // Re-establecer el valor después de cargar opciones
                
                // Disparar el evento change para cargar las partidas del contrato
                const changeEvent = new Event('change');
                hesContractSelect.dispatchEvent(changeEvent);
                
                // Rellenar campos de HES después de cargar las partidas (para que los inputs existan)
                setTimeout(async () => { // Usar un timeout pequeño para dar tiempo a la tabla de renderizarse
                    hesNoHesInput.value = hes.noHes || '';
                    hesFechaInicioInput.value = hes.fechaInicioHes || '';
                    hesFechaFinalInput.value = hes.fechaFinalHes || '';
                    hesAprobadoSelect.value = hes.aprobado || 'Pendiente';
                    hesTextoHesTextarea.value = hes.textoHes || '';
                    hesEjecutadaCheckbox.checked = hes.ejecutada || false;
                    hesFechaCreadoInput.value = hes.fechaCreadoHes || new Date().toISOString().split('T')[0];
                    hesFechaAprobadoInput.value = hes.fechaAprobadoHes || '';
                    hesTextoBreveInput.value = hes.textoBreveHes || '';
                    hesValuacionInput.value = hes.valuacion !== undefined ? hes.valuacion.toFixed(2) : '0.00';
                    hesLugarPrestacionServicioInput.value = hes.lugarPrestacionServicio || '';
                    hesResponsableSdoInput.value = hes.responsableSdo || '';
                    hesValuadoCheckbox.checked = hes.valuado || false;
                    hesSubtotalInput.value = hes.subTotalHes !== undefined ? hes.subTotalHes.toFixed(2) : '0.00';
                    hesGastosAdministrativosInput.value = hes.gastosAdministrativosHes !== undefined ? hes.gastosAdministrativosHes.toFixed(2) : '0.00';
                    hesTotalInput.value = hes.totalHes !== undefined ? hes.totalHes.toFixed(2) : '0.00';

                    // Rellenar las cantidades ejecutadas en la tabla de partidas de la HES
                    const hesPartidas = await db.hesPartidas.where({ hesId: hesId }).toArray();
                    hesPartidas.forEach(p => {
                        const row = hesPartidasTableBody.querySelector(`tr[data-contract-partida-id="${p.contractPartidaId}"]`);
                        if (row) {
                            row.querySelector('.hes-cantidad-ejecutar').value = p.cantidadEjecutada.toFixed(2);
                            row.querySelector('.hes-partida-total').textContent = p.totalPartidaHes.toFixed(2);
                        }
                    });
                    updateHesPartidaTotals(); // Recalcular totales HES
                    showToast("HES cargada para edición.", "info");
                    tabButtons.forEach(btn => {
                        if (btn.getAttribute('data-target') === 'hes-management') {
                            btn.click();
                        }
                    });
                }, 50); // Pequeño retraso
            }
        } else if (targetBtn.classList.contains('delete-hes-btn')) {
            if (confirm('¿Está seguro de que desea enviar esta HES a la papelera?')) {
                try {
                    const hesToDelete = await db.hes.get(hesId);
                    await db.trash.add({
                        originalId: hesId,
                        type: 'hes',
                        data: hesToDelete,
                        deletedAt: new Date().toISOString()
                    });
                    await db.hes.delete(hesId);
                    await db.hesPartidas.where({ hesId: hesId }).delete(); // Eliminar partidas de la HES
                    showToast("HES enviada a la papelera exitosamente.", "success");
                    loadHesList();
                    loadContractList(); // Para actualizar avances
                    updateSummaryCards();
                } catch (error) {
                    console.error("Error al enviar HES a la papelera:", error);
                    showToast("Error al enviar la HES a la papelera: " + error.message, "error");
                }
            }
        }
    });

    // --- Funciones de Avances ---
    // Calcula la cantidad ya ejecutada para una partida de contrato específica en todas las HES
    async function getExecutedQuantityForContractPartida(contractPartidaId, excludeHesId = null) {
        const hesPartidas = await db.hesPartidas.where({ contractPartidaId: contractPartidaId }).toArray();
        let totalExecuted = 0;
        for (const hp of hesPartidas) {
            // Asegurarse de que la HES a la que pertenece esta hesPartida no esté en la papelera
            const parentHes = await db.hes.get(hp.hesId);
            if (parentHes && (!excludeHesId || parentHes.id !== excludeHesId)) { // Excluir la HES que se está editando
                totalExecuted += hp.cantidadEjecutada;
            }
        }
        return totalExecuted;
    }

    // Calcula los avances físico y financiero para un contrato dado
    async function calculateContractAdvances(contractId) {
        const contract = await db.contracts.get(contractId);
        if (!contract) return { physicalAdvancePercentage: 0, financialAdvancePercentage: 0, totalExecutedAmount: 0 };

        const contractPartidas = await db.partidas.where({ contractId: contractId }).toArray();
        const hesList = await db.hes.where({ contractId: contractId }).toArray();

        let totalContractQuantity = 0;
        let totalExecutedQuantity = 0;
        let totalContractAmount = contract.montoTotalContrato || 0;
        let totalExecutedAmount = 0;

        // Calcular avance físico por cantidad
        for (const partida of contractPartidas) {
            totalContractQuantity += partida.cantidad;
            const executedInHES = await getExecutedQuantityForContractPartida(partida.id);
            totalExecutedQuantity += executedInHES;
        }

        let physicalAdvancePercentage = totalContractQuantity > 0 ? (totalExecutedQuantity / totalContractQuantity) * 100 : 0;

        // Calcular avance financiero
        for (const hes of hesList) {
            totalExecutedAmount += hes.totalHes || 0;
        }

        let financialAdvancePercentage = totalContractAmount > 0 ? (totalExecutedAmount / totalContractAmount) * 100 : 0;

        // Limitar porcentajes a 100%
        physicalAdvancePercentage = Math.min(physicalAdvancePercentage, 100);
        financialAdvancePercentage = Math.min(financialAdvancePercentage, 100);

        return {
            physicalAdvancePercentage: physicalAdvancePercentage,
            financialAdvancePercentage: financialAdvancePercentage,
            totalExecutedAmount: totalExecutedAmount
        };
    }

    // Lógica para la pestaña de Avance Físico
    physicalAdvanceContractSelect.addEventListener('change', async () => {
        const contractId = parseInt(physicalAdvanceContractSelect.value);
        if (!contractId) {
            physicalAdvanceDetails.style.display = 'none';
            return;
        }
        physicalAdvanceDetails.style.display = 'block';

        const contract = await db.contracts.get(contractId);
        if (!contract) return;

        paContractSicac.textContent = contract.numeroSICAC || '-';
        paContractTotal.textContent = `${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`;

        const { physicalAdvancePercentage } = await calculateContractAdvances(contractId);
        paPhysicalGlobalPercentage.textContent = `${physicalAdvancePercentage.toFixed(1)}%`;
        paPhysicalGlobalProgressBar.style.width = `${physicalAdvancePercentage}%`;
        paPhysicalGlobalProgressBar.setAttribute('aria-valuenow', physicalAdvancePercentage);
        paPhysicalGlobalProgressBar.textContent = `${physicalAdvancePercentage.toFixed(1)}%`;

        paPartidasBody.innerHTML = '';
        const contractPartidas = await db.partidas.where({ contractId: contractId }).toArray();
        for (const partida of contractPartidas) {
            const executedInHES = await getExecutedQuantityForContractPartida(partida.id);
            const partidaPhysicalAdvance = partida.cantidad > 0 ? (executedInHES / partida.cantidad) * 100 : 0;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${partida.descripcion}</td>
                <td>${partida.cantidad} ${partida.umd}</td>
                <td>${executedInHES.toFixed(2)} ${partida.umd}</td>
                <td><div class="progress" style="width: 100%;"><div class="progress-bar bg-info" style="width: ${partidaPhysicalAdvance}%">${partidaPhysicalAdvance.toFixed(1)}%</div></div></td>
            `;
            paPartidasBody.appendChild(row);
        }
    });

    // Lógica para la pestaña de Avance Financiero
    financialAdvanceContractSelect.addEventListener('change', async () => {
        const contractId = parseInt(financialAdvanceContractSelect.value);
        if (!contractId) {
            financialAdvanceDetails.style.display = 'none';
            return;
        }
        financialAdvanceDetails.style.display = 'block';

        const contract = await db.contracts.get(contractId);
        if (!contract) return;

        faContractSicac.textContent = contract.numeroSICAC || '-';
        faContractTotal.textContent = `${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`;

        const { financialAdvancePercentage, totalExecutedAmount } = await calculateContractAdvances(contractId);
        faExecutedAmount.textContent = `${totalExecutedAmount.toFixed(2)} ${contract.moneda || 'USD'}`;
        faFinancialGlobalPercentage.textContent = `${financialAdvancePercentage.toFixed(1)}%`;
        faFinancialGlobalProgressBar.style.width = `${financialAdvancePercentage}%`;
        faFinancialGlobalProgressBar.setAttribute('aria-valuenow', financialAdvancePercentage);
        faFinancialGlobalProgressBar.textContent = `${financialAdvancePercentage.toFixed(1)}%`;

        faHesListBody.innerHTML = '';
        const hesList = await db.hes.where({ contractId: contractId }).toArray();
        if (hesList.length === 0) {
            faHesListBody.innerHTML = `<tr><td colspan="5" class="text-center">No hay HES asociadas a este contrato.</td></tr>`;
        } else {
            hesList.forEach(hes => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${hes.noHes}</td>
                    <td>${hes.fechaInicioHes}</td>
                    <td>${hes.fechaFinalHes}</td>
                    <td>${hes.totalHes.toFixed(2)}</td>
                    <td>${hes.aprobado}</td>
                `;
                faHesListBody.appendChild(row);
            });
        }
    });


    // --- Lógica de Resumen Gráfico ---
    async function renderCharts() {
        const allContracts = await db.contracts.toArray();

        // Gráfico de Estatus de Contratos
        if (contractStatusChartInstance) contractStatusChartInstance.destroy();
        const statusCounts = allContracts.reduce((acc, contract) => {
            acc[contract.estatusContrato] = (acc[contract.estatusContrato] || 0) + 1;
            return acc;
        }, {});
        contractStatusChartInstance = new Chart(contractStatusChartCanvas, {
            type: 'pie',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6c757d'], // Green, Red, Yellow, Cyan, Grey
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false,
                        text: 'Contratos por Estatus'
                    }
                }
            }
        });

        // Gráfico de Modalidades de Contratación
        if (contractModalityChartInstance) contractModalityChartInstance.destroy();
        const modalityCounts = allContracts.reduce((acc, contract) => {
            acc[contract.modalidadContratacion] = (acc[contract.modalidadContratacion] || 0) + 1;
            return acc;
        }, {});
        contractModalityChartInstance = new Chart(contractModalityChartCanvas, {
            type: 'bar',
            data: {
                labels: Object.keys(modalityCounts),
                datasets: [{
                    label: 'Número de Contratos',
                    data: Object.values(modalityCounts),
                    backgroundColor: '#007bff', // Primary blue
                    borderColor: '#0056b3',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false,
                    },
                    title: {
                        display: false,
                        text: 'Contratos por Modalidad'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0 // No decimales para conteo
                        }
                    }
                }
            }
        });
    }

    // --- Lógica de Informes ---
    reportContractSelect.addEventListener('change', async () => {
        const contractId = parseInt(reportContractSelect.value);
        if (!contractId) {
            reportDetails.style.display = 'none';
            return;
        }
        reportDetails.style.display = 'block';
        reportHesDetailView.style.display = 'none'; // Ocultar detalle de HES al cambiar de contrato

        const contract = await db.contracts.get(contractId);
        if (!contract) return;

        reportContractSicac.textContent = contract.numeroSICAC || '-';
        reportContractTotal.textContent = `${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`;

        const hesList = await db.hes.where({ contractId: contractId }).toArray();
        let totalConsumedAmount = 0;
        for (const hes of hesList) {
            totalConsumedAmount += hes.totalHes || 0;
        }
        reportConsumedAmount.textContent = `${totalConsumedAmount.toFixed(2)} ${contract.moneda || 'USD'}`;
        reportRemainingAmount.textContent = `${(contract.montoTotalContrato - totalConsumedAmount).toFixed(2)} ${contract.moneda || 'USD'}`;

        // Partidas del Contrato y Consumo
        reportPartidasConsumoBody.innerHTML = '';
        const contractPartidas = await db.partidas.where({ contractId: contractId }).toArray();
        for (const partida of contractPartidas) {
            const executedInHES = await getExecutedQuantityForContractPartida(partida.id);
            const remainingQuantity = partida.cantidad - executedInHES;
            const consumedAmount = executedInHES * partida.precioUnitario;
            const remainingAmount = remainingQuantity * partida.precioUnitario;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${partida.descripcion}</td>
                <td>${partida.cantidad} ${partida.umd}</td>
                <td>${executedInHES.toFixed(2)} ${partida.umd}</td>
                <td>${remainingQuantity.toFixed(2)} ${partida.umd}</td>
                <td>${consumedAmount.toFixed(2)} ${contract.moneda || 'USD'}</td>
                <td>${remainingAmount.toFixed(2)} ${contract.moneda || 'USD'}</td>
            `;
            reportPartidasConsumoBody.appendChild(row);
        }

        // Lista de HES del Contrato
        reportHesListBody.innerHTML = '';
        if (hesList.length === 0) {
            reportHesListBody.innerHTML = `<tr><td colspan="6" class="text-center">No hay HES asociadas a este contrato.</td></tr>`;
        } else {
            hesList.forEach(hes => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${hes.noHes}</td>
                    <td>${hes.fechaInicioHes}</td>
                    <td>${hes.fechaFinalHes}</td>
                    <td>${hes.totalHes.toFixed(2)}</td>
                    <td>${hes.aprobado}</td>
                    <td><button class="btn btn-sm btn-info view-hes-detail-btn" data-id="${hes.id}"><i class="fas fa-eye"></i> Ver Detalle</button></td>
                `;
                reportHesListBody.appendChild(row);
            });
        }
    });

    // Ver detalle de HES en informes
    reportHesListBody.addEventListener('click', async (e) => {
        const targetBtn = e.target.closest('.view-hes-detail-btn');
        if (!targetBtn) return;

        const hesId = parseInt(targetBtn.dataset.id);
        const hes = await db.hes.get(hesId);
        if (!hes) return;

        reportHesDetailView.style.display = 'block';
        reportHesDetailNo.textContent = hes.noHes;

        // Calcular avances de la HES
        let totalHesPhysicalQuantity = 0;
        let totalHesExecutedQuantity = 0;
        let totalHesFinancialAmount = hes.totalHes || 0;
        let currentHesExecutedAmount = 0;

        reportHesPartidasBody.innerHTML = '';
        const hesPartidas = await db.hesPartidas.where({ hesId: hesId }).toArray();
        for (const hp of hesPartidas) {
            const contractPartida = await db.partidas.get(hp.contractPartidaId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${hp.descripcion}</td>
                <td>${hp.cantidadEjecutada} ${hp.umd}</td>
                <td>${hp.precioUnitario.toFixed(2)}</td>
                <td>${hp.totalPartidaHes.toFixed(2)}</td>
            `;
            reportHesPartidasBody.appendChild(row);

            // Para avance físico de la HES (usamos la cantidad original de la partida de contrato para el % del total)
            if (contractPartida) {
                 totalHesPhysicalQuantity += contractPartida.cantidad; // Total original de la partida del contrato
                 totalHesExecutedQuantity += hp.cantidadEjecutada; // Cantidad ejecutada en esta HES
            }
            currentHesExecutedAmount += hp.totalPartidaHes; // Monto total de partidas en esta HES
        }
        
        const hesPhysicalAdvancePercentage = totalHesPhysicalQuantity > 0 ? (totalHesExecutedQuantity / totalHesPhysicalQuantity) * 100 : 0;
        reportHesPhysicalPercentage.textContent = `${hesPhysicalAdvancePercentage.toFixed(1)}%`;
        reportHesPhysicalProgressBar.style.width = `${hesPhysicalAdvancePercentage}%`;
        reportHesPhysicalProgressBar.setAttribute('aria-valuenow', hesPhysicalAdvancePercentage);
        reportHesPhysicalProgressBar.textContent = `${hesPhysicalAdvancePercentage.toFixed(1)}%`;

        const hesFinancialAdvancePercentage = totalHesFinancialAmount > 0 ? (currentHesExecutedAmount / totalHesFinancialAmount) * 100 : 0;
        reportHesFinancialPercentage.textContent = `${hesFinancialAdvancePercentage.toFixed(1)}%`;
        reportHesFinancialProgressBar.style.width = `${hesFinancialAdvancePercentage}%`;
        reportHesFinancialProgressBar.setAttribute('aria-valuenow', hesFinancialAdvancePercentage);
        reportHesFinancialProgressBar.textContent = `${hesFinancialAdvancePercentage.toFixed(1)}%`;
    });


    // --- Funciones de Exportación ---
    exportExcelBtn.addEventListener('click', async () => {
        try {
            const contracts = await db.contracts.toArray();
            if (contracts.length === 0) {
                showToast("No hay datos para exportar a Excel.", "warning");
                return;
            }

            const data = [];
            for (const c of contracts) {
                const contractPartidas = await db.partidas.where({ contractId: c.id }).toArray();
                const hesList = await db.hes.where({ contractId: c.id }).toArray();

                const row = {
                    'N° Proveedor': c.numeroProveedor,
                    'Fecha Firma': c.fechaFirmaContrato,
                    'Fecha Creado': c.fechaCreado,
                    'Fecha Inicio': c.fechaInicio,
                    'Fecha Terminación': c.fechaTerminacion,
                    'Período Culminación (Días)': c.periodoCulminacion,
                    'N° SICAC': c.numeroSICAC,
                    'División/Área': c.divisionArea,
                    'EEMN': c.eemn,
                    'Región': c.region,
                    'Naturaleza Contratación': c.naturalezaContratacion,
                    'Línea de Servicio': c.lineaServicio,
                    'No. Petición Oferta': c.noPeticionOferta,
                    'Modalidad Contratación': c.modalidadContratacion,
                    'Régimen Laboral': c.regimenLaboral,
                    'Objeto Contractual': c.objetoContractual,
                    'Fecha Cambio Alcance': c.fechaCambioAlcance,
                    'Monto Original': c.montoOriginal,
                    'Monto Modificado': c.montoModificado,
                    'Monto Total del Contrato': c.montoTotalContrato,
                    'N° Contrato (Interno)': c.numeroContratoInterno,
                    'Observaciones': c.observaciones,
                    'Estatus': c.estatusContrato,
                    'Moneda': c.moneda,
                    'Total Partidas Contrato': c.montoOriginal,
                    'Partidas Detalle': contractPartidas.map(p => `${p.descripcion} (${p.cantidad} ${p.umd} @${p.precioUnitario})`).join('; '),
                    'Total HES Asociadas': hesList.reduce((sum, h) => sum + (h.totalHes || 0), 0),
                    'HES Detalle': hesList.map(h => `${h.noHes} (Total: ${h.totalHes})`).join('; ')
                };
                data.push(row);
            }

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Contratos");
            XLSX.writeFile(wb, "Contratos.xlsx");
            showToast("Datos exportados a Excel.", "success");
        } catch (error) {
            console.error("Error al exportar a Excel:", error);
            showToast("Error al exportar a Excel: " + error.message, "error");
        }
    });

    exportPdfBtn.addEventListener('click', async () => {
        try {
            const contracts = await db.contracts.toArray();
            if (contracts.length === 0) {
                showToast("No hay datos para exportar a PDF.", "warning");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape'); // Orientación horizontal para más columnas

            const tableColumn = [
                "N° Prov.", "N° SICAC", "Fecha Inicio", "Fecha Fin",
                "Monto Total", "Av. Físico", "Av. Financ.", "Estatus", "Modalidad"
            ];
            const tableRows = [];

            for (const c of contracts) {
                const { physicalAdvancePercentage, financialAdvancePercentage } = await calculateContractAdvances(c.id);
                tableRows.push([
                    c.numeroProveedor,
                    c.numeroSICAC || '-',
                    c.fechaInicio || '-',
                    c.fechaTerminacion || '-',
                    `${c.montoTotalContrato ? c.montoTotalContrato.toFixed(2) : '0.00'} ${c.moneda || 'USD'}`,
                    `${physicalAdvancePercentage.toFixed(1)}%`,
                    `${financialAdvancePercentage.toFixed(1)}%`,
                    c.estatusContrato || '-',
                    c.modalidadContratacion || '-'
                ]);
            }
            
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
                headStyles: { fillColor: [70, 130, 180], textColor: 255, fontStyle: 'bold' }, // Azul acero
                margin: { top: 15, left: 10, right: 10, bottom: 10 },
                didDrawPage: function(data) {
                    doc.text("Lista de Contratos", data.settings.margin.left, 10);
                }
            });
            doc.save("Contratos.pdf");
            showToast("Datos exportados a PDF.", "success");
        } catch (error) {
            console.error("Error al exportar a PDF:", error);
            showToast("Error al exportar a PDF: " + error.message, "error");
        }
    });


    // --- Lógica de la Papelera de Reciclaje ---
    async function loadTrashCan() {
        deletedContractsBody.innerHTML = '';
        deletedHesBody.innerHTML = '';

        const deletedItems = await db.trash.toArray();

        const deletedContracts = deletedItems.filter(item => item.type === 'contract');
        if (deletedContracts.length === 0) {
            deletedContractsBody.innerHTML = `<tr><td colspan="4" class="text-center">No hay contratos eliminados.</td></tr>`;
        } else {
            deletedContracts.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.data.numeroProveedor || '-'}</td>
                    <td>${item.data.numeroSICAC || '-'}</td>
                    <td>${new Date(item.deletedAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-info restore-btn" data-id="${item.id}" data-type="contract"><i class="fas fa-undo"></i> Restaurar</button>
                        <button class="btn btn-sm btn-danger delete-permanent-btn" data-id="${item.id}" data-type="contract"><i class="fas fa-times-circle"></i> Eliminar Permanentemente</button>
                    </td>
                `;
                deletedContractsBody.appendChild(row);
            });
        }

        const deletedHes = deletedItems.filter(item => item.type === 'hes');
        if (deletedHes.length === 0) {
            deletedHesBody.innerHTML = `<tr><td colspan="4" class="text-center">No hay HES eliminadas.</td></tr>`;
        } else {
            for (const item of deletedHes) {
                const originalContract = await db.contracts.get(item.data.contractId); // Intentar obtener el contrato original
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.data.noHes || '-'}</td>
                    <td>${originalContract ? originalContract.numeroSICAC : 'Contrato Eliminado'}</td>
                    <td>${new Date(item.deletedAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-info restore-btn" data-id="${item.id}" data-type="hes"><i class="fas fa-undo"></i> Restaurar</button>
                        <button class="btn btn-sm btn-danger delete-permanent-btn" data-id="${item.id}" data-type="hes"><i class="fas fa-times-circle"></i> Eliminar Permanentemente</button>
                    </td>
                `;
                deletedHesBody.appendChild(row);
            }
        }
    }

    // Delegación de eventos para restaurar y eliminar permanentemente de la papelera
    document.getElementById('trash-can').addEventListener('click', async (e) => {
        const targetBtn = e.target.closest('button');
        if (!targetBtn) return;

        const trashItemId = parseInt(targetBtn.dataset.id);
        const itemType = targetBtn.dataset.type;

        if (targetBtn.classList.contains('restore-btn')) {
            if (confirm(`¿Está seguro de que desea restaurar este ${itemType}?`)) {
                try {
                    const trashItem = await db.trash.get(trashItemId);
                    if (itemType === 'contract') {
                        await db.contracts.add(trashItem.data); // Restaurar contrato (los datos ahora incluyen partidas)
                        // También restaurar sus partidas si las guardamos en la papelera con él
                        // Por ahora, asumimos que se eliminaron y tendrían que recrearse o guardar una copia
                        // más profunda en la papelera. Para esta versión, solo restauramos el contrato.
                        // SI las partidas no se guardaron con el contrato en la papelera, no se restaurarán.
                        // Para una restauración completa, la data.partidas debería incluir las partidas.
                        const originalPartidas = await db.partidas.where({ contractId: trashItem.originalId }).toArray();
                        for (const partida of originalPartidas) {
                            partida.id = undefined; // Quitar ID para que Dexie asigne uno nuevo
                            partida.contractId = await db.contracts.add(trashItem.data); // Obtener el ID del contrato restaurado
                            await db.partidas.add(partida);
                        }
                        // Restaurar las partidas que estaban guardadas *dentro* del objeto data en la papelera
                        if (trashItem.data.partidas && Array.isArray(trashItem.data.partidas)) {
                            const restoredContract = await db.contracts.get(trashItem.originalId); // Obtener el contrato restaurado por su originalId
                            if (restoredContract) {
                                for (const partida of trashItem.data.partidas) {
                                    // Eliminar la partida original de la papelera (si estaba allí como item separado)
                                    const partidaInTrash = await db.trash.where({ type: 'partida', originalId: partida.id }).first();
                                    if (partidaInTrash) await db.trash.delete(partidaInTrash.id);

                                    partida.id = undefined; // Asegurar nuevo ID
                                    partida.contractId = restoredContract.id; // Asignar al contrato restaurado
                                    await db.partidas.add(partida);
                                }
                            } else {
                                console.error("Contrato restaurado no encontrado para adjuntar partidas.");
                            }
                        }
                        // Si las HES relacionadas se movieron a la papelera, también restaurarlas aquí
                        const relatedHesInTrash = await db.trash.where({ type: 'hes', data: { contractId: trashItem.originalId } }).toArray();
                        for (const hesItem of relatedHesInTrash) {
                            // Verificar si el contrato al que pertenece la HES existe (ya debería existir si restauramos el contrato)
                            const contractExists = await db.contracts.get(hesItem.data.contractId);
                            if (contractExists) {
                                // Restaurar la HES
                                await db.hes.add(hesItem.data);
                                // Restaurar las partidas de la HES si estaban guardadas en los datos de la HES en la papelera
                                if (hesItem.data.hesPartidas && Array.isArray(hesItem.data.hesPartidas)) {
                                    const restoredHes = await db.hes.get(hesItem.originalId); // Obtener la HES restaurada por su originalId
                                    if (restoredHes) {
                                        for (const hesPartida of hesItem.data.hesPartidas) {
                                            hesPartida.id = undefined; // Asegurar nuevo ID
                                            hesPartida.hesId = restoredHes.id; // Asignar a la HES restaurada
                                            await db.hesPartidas.add(hesPartida);
                                        }
                                    } else {
                                        console.error("HES restaurada no encontrada para adjuntar partidas.");
                                    }
                                }
                                // Eliminar la HES de la papelera
                                await db.trash.delete(hesItem.id);
                            } else {
                                console.warn(`Contrato (${hesItem.data.contractId}) para HES (${hesItem.data.noHes}) en papelera no encontrado. No se restaurará la HES.`);
                            }
                        }

                    } else if (itemType === 'hes') {
                        // Antes de restaurar HES, verificar si su contrato original existe.
                        const contractExists = await db.contracts.get(trashItem.data.contractId);
                        if (!contractExists) {
                            showToast(`El contrato original de esta HES (${trashItem.data.contractId}) no existe. Restaure primero el contrato.`, "error");
                            return;
                        }
                        await db.hes.add(trashItem.data); // Restaurar HES
                        const originalHesPartidas = await db.hesPartidas.where({ hesId: trashItem.originalId }).toArray();
                        for (const hesPartida of originalHesPartidas) {
                            hesPartida.id = undefined;
                            hesPartida.hesId = trashItem.data.id;
                            await db.hesPartidas.add(hesPartida);
                        }
                    }
                    await db.trash.delete(trashItemId); // Eliminar de la papelera
                    showToast(`${itemType} restaurado exitosamente.`, "success");
                    loadTrashCan();
                    if (itemType === 'contract') await loadContractList();
                    if (itemType === 'hes') await loadHesList();
                    await updateSummaryCards();
                } catch (error) {
                    console.error(`Error al restaurar ${itemType}:`, error);
                    showToast(`Error al restaurar ${itemType}: ` + error.message, "error");
                }
            }
        } else if (targetBtn.classList.contains('delete-permanent-btn')) {
            if (confirm(`¡Advertencia! ¿Está seguro de que desea ELIMINAR PERMANENTEMENTE este ${itemType}? Esta acción no se puede deshacer.`)) {
                try {
                    await db.trash.delete(trashItemId);
                    showToast(`${itemType} eliminado permanentemente.`, "success");
                    loadTrashCan();
                    updateSummaryCards(); // Por si afecta algún conteo, aunque ya está eliminado lógicamente
                } catch (error) {
                    console.error(`Error al eliminar permanentemente ${itemType}:`, error);
                    showToast(`Error al eliminar permanentemente ${itemType}: ` + error.message, "error");
                }
            }
        }
    });


    // --- Datos de Ejemplo (Debugging/Seeding) ---
    async function seedDatabase() {
        // Solo sembrar si la base de datos está vacía
        const contractCount = await db.contracts.count();
        if (contractCount === 0) {
            showToast("Sembrando la base de datos con datos de ejemplo...", "info");

            // Contrato 1
            const contract1Id = await db.contracts.add({
                numeroProveedor: 'PROV001',
                fechaFirmaContrato: '2023-01-01',
                fechaCreado: '2023-01-01',
                fechaInicio: '2023-01-15',
                fechaTerminacion: '2024-01-14',
                periodoCulminacion: 365,
                numeroSICAC: 'SICAC-C001',
                divisionArea: 'Ingeniería',
                eemn: 'EEMN-A',
                region: 'Central',
                naturalezaContratacion: 'Construcción',
                lineaServicio: 'Obra Civil',
                noPeticionOferta: 'PO-001',
                modalidadContratacion: 'Obra',
                regimenLaboral: 'Contratista',
                objetoContractual: 'Construcción de nueva sede administrativa.',
                fechaCambioAlcance: '',
                montoOriginal: 100000.00,
                montoModificado: 0.00,
                montoTotalContrato: 100000.00,
                numeroContratoInterno: 'INT-2023-001',
                observaciones: 'Contrato inicial para el proyecto sede.',
                estatusContrato: 'Activo',
                moneda: 'USD'
            });

            await db.partidas.bulkAdd([
                { contractId: contract1Id, descripcion: 'Movimiento de Tierras', cantidad: 1000, umd: 'm3', precioUnitario: 50, total: 50000 },
                { contractId: contract1Id, descripcion: 'Estructura Metálica', cantidad: 1, umd: 'Glb', precioUnitario: 30000, total: 30000 },
                { contractId: contract1Id, descripcion: 'Acabados Internos', cantidad: 1, umd: 'Glb', precioUnitario: 20000, total: 20000 }
            ]);

            // HES 1 para Contrato 1
            const hes1Id = await db.hes.add({
                contractId: contract1Id,
                noHes: 'HES-001-C001',
                fechaInicioHes: '2023-02-01',
                fechaFinalHes: '2023-02-28',
                aprobado: 'Aprobado',
                textoHes: 'Avance de Movimiento de Tierras Fase 1.',
                ejecutada: true,
                fechaCreadoHes: '2023-03-01',
                fechaAprobadoHes: '2023-03-05',
                textoBreveHes: 'HES Movimiento Tierras',
                valuacion: 0,
                lugarPrestacionServicio: 'Sitio de Obra',
                responsableSdo: 'Juan Pérez',
                subTotalHes: 25000,
                gastosAdministrativosHes: 1250,
                totalHes: 26250
            });
            await db.hesPartidas.bulkAdd([
                { hesId: hes1Id, contractPartidaId: (await db.partidas.where({contractId: contract1Id, descripcion: 'Movimiento de Tierras'}).first()).id, descripcion: 'Movimiento de Tierras', cantidadOriginal: 1000, cantidadEjecutada: 500, umd: 'm3', precioUnitario: 50, totalPartidaHes: 25000 }
            ]);

            // Contrato 2
            const contract2Id = await db.contracts.add({
                numeroProveedor: 'PROV002',
                fechaFirmaContrato: '2023-03-10',
                fechaCreado: '2023-03-10',
                fechaInicio: '2023-04-01',
                fechaTerminacion: '2023-09-30',
                periodoCulminacion: 182,
                numeroSICAC: 'SICAC-C002',
                divisionArea: 'IT',
                eemn: 'EEMN-B',
                region: 'Occidental',
                naturalezaContratacion: 'Servicios',
                lineaServicio: 'Soporte Software',
                noPeticionOferta: 'PO-002',
                modalidadContratacion: 'Servicio',
                regimenLaboral: 'Servicio Profesional',
                objetoContractual: 'Soporte y mantenimiento de software empresarial.',
                fechaCambioAlcance: '',
                montoOriginal: 50000.00,
                montoModificado: 0.00,
                montoTotalContrato: 50000.00,
                numeroContratoInterno: 'INT-2023-002',
                observaciones: 'Contrato de servicios recurrentes.',
                estatusContrato: 'Activo',
                moneda: 'USD'
            });

            await db.partidas.bulkAdd([
                { contractId: contract2Id, descripcion: 'Soporte Nivel 1', cantidad: 500, umd: 'Horas', precioUnitario: 40, total: 20000 },
                { contractId: contract2Id, descripcion: 'Soporte Nivel 2', cantidad: 300, umd: 'Horas', precioUnitario: 60, total: 18000 },
                { contractId: contract2Id, descripcion: 'Consultoría', cantidad: 120, umd: 'Horas', precioUnitario: 100, total: 12000 }
            ]);

            showToast("Datos de ejemplo cargados.", "success");
            loadContractList();
            updateSummaryCards();
        }
    }


    // --- Inicialización ---
    // Cargar la primera pestaña activa al inicio
    // Mover la inicialización aquí para asegurar que los event listeners estén configurados
    const initialActiveTab = document.querySelector('.tab-btn.active');
    if (initialActiveTab) {
        initialActiveTab.click(); // Simula un clic para cargar el contenido inicial
    } else {
        // Fallback si no hay ninguna pestaña marcada como activa en HTML
        document.querySelector('.tab-btn[data-target="general-summary"]').click();
    }

    // --- SLIDER/CARRUSEL EN RESUMEN GENERAL ---
    async function renderContractsSlider() {
        console.log("Renderizando carrusel de contratos..."); // Log para depuración
        const sliderInner = document.getElementById('contracts-slider-inner');
        const contracts = await db.contracts.toArray();
        console.log("Contratos cargados para carrusel:", contracts.length); // Log para depuración
        sliderInner.innerHTML = '';
        if (contracts.length === 0) {
            sliderInner.innerHTML = '<div class="carousel-item active"><div class="card"><h3>No hay contratos activos</h3><p>Registra nuevos contratos para ver el resumen aquí.</p></div></div>';
            // Ocultar controles si no hay contratos
            document.querySelector('.carousel-control-prev').style.display = 'none';
            document.querySelector('.carousel-control-next').style.display = 'none';
            // Limpiar resumen si no hay contratos
            document.getElementById('total-contract-amount').textContent = 'USD 0.00';
            document.getElementById('contracts-expiry-list').innerHTML = '<li>No hay contratos próximos a vencer</li>';
            document.getElementById('financial-progress-bar').style.width = '0%';
            document.getElementById('financial-progress-bar').setAttribute('aria-valuenow', 0);
            document.getElementById('financial-progress-label').textContent = '0%';
            document.getElementById('physical-progress-bar').style.width = '0%';
            document.getElementById('physical-progress-bar').setAttribute('aria-valuenow', 0);
            document.getElementById('physical-progress-label').textContent = '0%';
            return; // Salir si no hay contratos
        }
        // Mostrar controles si hay contratos
        document.querySelector('.carousel-control-prev').style.display = '';
        document.querySelector('.carousel-control-next').style.display = '';

        contracts.forEach((contract, idx) => {
            const isActive = idx === 0 ? 'active' : '';
            const card = document.createElement('div');
            card.className = `carousel-item ${isActive}`;
            card.innerHTML = `
                <div class="card">
                    <h3>${contract.numeroSICAC || contract.numeroProveedor || 'Sin Nombre'}</h3>
                    <p><strong>N° Proveedor:</strong> ${contract.numeroProveedor || '-'}</p>
                    <p><strong>N° SICAC:</strong> ${contract.numeroSICAC || '-'}</p>
                    <p><strong>Monto:</strong> USD ${formatMonto(contract.montoTotalContrato)}</p>
                    <p><strong>Fecha Inicio:</strong> ${contract.fechaInicio || '-'}</p>
                    <p><strong>Estatus:</strong> ${contract.estatusContrato || '-'}</p>
                </div>
            `;
            sliderInner.appendChild(card);
        });
        if (contracts.length > 0) {
            console.log("Actualizando resumen para el primer contrato en carrusel:", contracts[0].id); // Log
            updateSummaryByContract(contracts[0]);
        }

        // Inicializar el carrusel de Bootstrap explícitamente
        if (contracts.length > 0 && document.getElementById('contracts-slider')) {
            const carousel = new bootstrap.Carousel(document.getElementById('contracts-slider'), { interval: false }); // Puedes ajustar el intervalo si quieres auto-slide
            console.log("Carrusel de Bootstrap inicializado."); // Log
        }
    }

    const contractsSlider = document.getElementById('contracts-slider');
    if (contractsSlider) {
        contractsSlider.addEventListener('slid.bs.carousel', async function (e) {
            console.log("Evento slid.bs.carousel disparado. Index:", e.to); // Log para depuración
            const idx = e.to;
            const contracts = await db.contracts.toArray();
            if (contracts[idx]) {
                console.log("Actualizando resumen para contrato index:", idx, contracts[idx].id); // Log
                updateSummaryByContract(contracts[idx]);
            } else {
                 console.warn("Contrato en index no encontrado:", idx); // Log de advertencia
            }
        });
    }

    // --- EXPORTAR EN AVANCE FÍSICO Y FINANCIERO ---
    async function exportAvanceToExcel(tipo) {
        let data = [];
        let filename = '';
        if (tipo === 'fisico') {
            const contractId = parseInt(document.getElementById('physical-advance-contract-select').value);
            if (!contractId) return;
            const contract = await db.contracts.get(contractId);
            const partidas = await db.partidas.where({ contractId }).toArray();
            for (const p of partidas) {
                const ejecutada = await getExecutedQuantityForContractPartida(p.id);
                data.push({
                    'Descripción': p.descripcion,
                    'Cantidad Contrato': p.cantidad,
                    'Cantidad Ejecutada': ejecutada,
                    'Avance (%)': p.cantidad > 0 ? ((ejecutada / p.cantidad) * 100).toFixed(2) : '0.00'
                });
            }
            filename = `AvanceFisico_${contract.numeroSICAC || contract.numeroProveedor}.xlsx`;
        } else if (tipo === 'financiero') {
            const contractId = parseInt(document.getElementById('financial-advance-contract-select').value);
            if (!contractId) return;
            const contract = await db.contracts.get(contractId);
            const hesList = await db.hes.where({ contractId }).toArray();
            for (const hes of hesList) {
                data.push({
                    'No. HES': hes.noHes,
                    'Fecha Inicio': hes.fechaInicioHes,
                    'Fecha Final': hes.fechaFinalHes,
                    'Total HES': hes.totalHes,
                    'Estatus': hes.aprobado
                });
            }
            filename = `AvanceFinanciero_${contract.numeroSICAC || contract.numeroProveedor}.xlsx`;
        }
        if (data.length > 0) {
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Avance');
            XLSX.writeFile(wb, filename);
            showToast('Exportado a Excel.', 'success');
        }
    }

    async function exportAvanceToPDF(tipo) {
        console.log(`Intentando exportar a PDF para tipo: ${tipo}`); // Log para depuración
        let data = [];
        let columns = [];
        let filename = '';
        let title = '';

        if (tipo === 'fisico') {
            const contractId = parseInt(document.getElementById('physical-advance-contract-select').value);
            if (!contractId) { showToast("Seleccione un contrato para exportar el avance físico.", "warning"); return; }
            const contract = await db.contracts.get(contractId);
            const partidas = await db.partidas.where({ contractId }).toArray();
            for (const p of partidas) {
                const ejecutada = await getExecutedQuantityForContractPartida(p.id);
                data.push([
                    p.descripcion,
                    p.cantidad,
                    ejecutada,
                    p.cantidad > 0 ? ((ejecutada / p.cantidad) * 100).toFixed(2) + '%' : '0.00%'
                ]);
            }
            columns = ['Descripción', 'Cantidad Contrato', 'Cantidad Ejecutada', 'Avance (%)'];
            filename = `AvanceFisico_${contract.numeroSICAC || contract.numeroProveedor}.pdf`;
            title = `Avance Físico del Contrato ${contract.numeroSICAC || contract.numeroProveedor}`;

        } else if (tipo === 'financiero') {
            const contractId = parseInt(document.getElementById('financial-advance-contract-select').value);
            if (!contractId) { showToast("Seleccione un contrato para exportar el avance financiero.", "warning"); return; }
            const contract = await db.contracts.get(contractId);
            const hesList = await db.hes.where({ contractId }).toArray();
            for (const hes of hesList) {
                data.push([
                    hes.noHes,
                    hes.fechaInicioHes,
                    hes.fechaFinalHes,
                    hes.totalHes.toFixed(2),
                    hes.aprobado
                ]);
            }
            columns = ['No. HES', 'Fecha Inicio', 'Fecha Final', 'Total HES', 'Estatus'];
            filename = `AvanceFinanciero_${contract.numeroSICAC || contract.numeroProveedor}.pdf`;
            title = `Avance Financiero del Contrato ${contract.numeroSICAC || contract.numeroProveedor}`;

        } else if (tipo === 'contratos') {
             const contracts = await db.contracts.toArray();
             if (contracts.length === 0) { showToast("No hay datos para exportar a PDF.", "warning"); return; }

             columns = [
                 "N° Prov.", "N° SICAC", "Fecha Inicio", "Fecha Fin",
                 "Monto Total", "Av. Físico", "Av. Financ.", "Estatus", "Modalidad"
             ];
             for (const c of contracts) {
                 const { physicalAdvancePercentage, financialAdvancePercentage } = await calculateContractAdvances(c.id);
                 data.push([
                     c.numeroProveedor,
                     c.numeroSICAC || '-',
                     c.fechaInicio || '-',
                     c.fechaTerminacion || '-',
                     `${c.montoTotalContrato ? c.montoTotalContrato.toFixed(2) : '0.00'} ${c.moneda || 'USD'}`,
                     `${physicalAdvancePercentage.toFixed(1)}%`,
                     `${financialAdvancePercentage.toFixed(1)}%`,
                     c.estatusContrato || '-',
                     c.modalidadContratacion || '-'
                 ]);
             }
             filename = "ListaContratos.pdf";
             title = "Lista de Contratos";
        }

        if (data.length > 0) {
            const { jsPDF } = window.jspdf; // Obtener referencia aquí
            if (!jsPDF) {
                console.error("Librería jsPDF no cargada.");
                showToast("Error al generar PDF: librería no disponible.", "error");
                return;
            }
            const doc = new jsPDF('landscape'); // Usar landscape para más columnas

            doc.autoTable({
                head: [columns],
                body: data,
                startY: 20,
                styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
                headStyles: { fillColor: [70, 130, 180], textColor: 255, fontStyle: 'bold' }, // Azul acero
                margin: { top: 15, left: 10, right: 10, bottom: 10 },
                didDrawPage: function(data) {
                    doc.text(title, data.settings.margin.left, 10);
                }
            });
            doc.save(filename);
            showToast('Exportado a PDF.', 'success');
        }
    }

    document.getElementById('export-excel-btn')?.addEventListener('click', () => exportAvanceToExcel('contratos'));
    document.getElementById('export-pdf-btn')?.addEventListener('click', () => exportAvanceToPDF('contratos')); // Lista Contratos

    document.getElementById('export-physical-excel-btn')?.addEventListener('click', () => exportAvanceToExcel('fisico'));
    document.getElementById('export-physical-pdf-btn')?.addEventListener('click', () => exportAvanceToPDF('fisico')); // Avance Físico
    document.getElementById('export-financial-excel-btn')?.addEventListener('click', () => exportAvanceToExcel('financiero'));
    document.getElementById('export-financial-pdf-btn')?.addEventListener('click', () => exportAvanceToPDF('financiero')); // Avance Financiero

    // --- RESUMEN GRÁFICO: SELECTORES Y RENDERIZADO ---
    async function renderGraficosSelectores() {
        console.log("Renderizando selectores de gráficos..."); // Log para depuración
        const contratos = await db.contracts.toArray();
        const selectContrato = document.getElementById('graficos-contrato-select');
        const selectTipo = document.getElementById('graficos-tipo-select');
        selectContrato.innerHTML = '';
        contratos.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.numeroSICAC || c.numeroProveedor || 'Sin Nombre';
            selectContrato.appendChild(opt);
        });
        selectTipo.value = 'bar';
        if (contratos.length > 0) {
            renderResumenGrafico(contratos[0].id, 'bar');
        }
    }

    async function renderResumenGrafico(contratoId, tipo) {
        const canvas = document.getElementById('resumen-grafico');
        if (!canvas) return;

        // Destruir instancia anterior si existe
        if (window.resumenGraficoInstance) {
            window.resumenGraficoInstance.destroy();
        }

        const contract = await db.contracts.get(contratoId);
        if (!contract) return;

        const ctx = canvas.getContext('2d');
        let chartData;

        if (tipo === 'financiero') {
            // Obtener todas las HES del contrato ordenadas por fecha
            const hesList = await db.hes
                .where('contractId')
                .equals(contratoId)
                .toArray();

            // Ordenar HES por fecha de inicio
            hesList.sort((a, b) => new Date(a.fechaInicioHes) - new Date(b.fechaInicioHes));

            // Preparar datos para la línea de tiempo
            const labels = hesList.map(hes => {
                const fecha = new Date(hes.fechaInicioHes);
                return fecha.toLocaleDateString('es-ES', { 
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            });

            // Calcular montos acumulados
            let montoAcumulado = 0;
            const montosAcumulados = hesList.map(hes => {
                montoAcumulado += hes.totalHes || 0;
                return montoAcumulado;
            });

            // Añadir punto inicial (0) y punto final (monto total)
            labels.unshift(new Date(contract.fechaInicio).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }));
            montosAcumulados.unshift(0);

            chartData = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Monto Acumulado',
                        data: montosAcumulados,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                        fill: true,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: `Línea de Tiempo Financiera - ${contract.numeroSICAC || contract.numeroProveedor}`
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Monto: ${context.raw.toFixed(2)} ${contract.moneda || 'USD'}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: `Monto (${contract.moneda || 'USD'})`
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Fecha'
                            }
                        }
                    }
                }
            };
        } else {
            // ... existing code for other chart types ...
        }

        window.resumenGraficoInstance = new Chart(ctx, chartData);

        // Asegurar que el botón de exportación funcione
        const exportPngButton = document.getElementById('export-chart-png');
        if (exportPngButton) {
            exportPngButton.onclick = () => {
                if (window.resumenGraficoInstance) {
                    const link = document.createElement('a');
                    link.download = `grafico_${contract.numeroSICAC || contract.numeroProveedor || 'contrato'}.png`;
                    link.href = window.resumenGraficoInstance.toBase64Image();
                    link.click();
                }
            };
        }
    }

    // --- MODALIDAD DINÁMICA MEJORADA ---
    function getModalidades() {
        const data = localStorage.getItem('modalidades_contratacion');
        if (data) {
            try {
                const arr = JSON.parse(data);
                if (Array.isArray(arr) && arr.length > 0) return arr;
            } catch {}
        }
        return ['Obra', 'Servicio', 'Suministro'];
    }
    function setModalidades(arr) {
        localStorage.setItem('modalidades_contratacion', JSON.stringify(arr));
    }
    function renderModalidadesSelect() {
        const modalidades = getModalidades();
        const modalidadSelect = document.getElementById('modalidad-contratacion');
        modalidadSelect.innerHTML = '';
        modalidades.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            modalidadSelect.appendChild(opt);
        });
    }
    document.getElementById('agregar-modalidad')?.addEventListener('click', () => {
        const nueva = document.getElementById('nueva-modalidad').value.trim();
        if (!nueva) return;
        let modalidades = getModalidades();
        if (!modalidades.includes(nueva)) {
            modalidades.push(nueva);
            setModalidades(modalidades);
            renderModalidadesSelect();
            document.getElementById('modalidad-contratacion').value = nueva;
            document.getElementById('nueva-modalidad').value = '';
            showToast('Modalidad agregada.', 'success');
        } else {
            showToast('La modalidad ya existe.', 'warning');
        }
    });
    document.getElementById('eliminar-modalidad')?.addEventListener('click', () => {
        const actual = document.getElementById('modalidad-contratacion').value;
        if (!actual) return; // No hacer nada si no hay modalidad seleccionada
        let modalidades = getModalidades().filter(m => m !== actual);
        setModalidades(modalidades);
        renderModalidadesSelect();
        showToast('Modalidad eliminada.', 'info');
    });
    renderModalidadesSelect();

    // Exportar Informe de Contrato Individual a Excel
    document.getElementById('export-report-excel-btn')?.addEventListener('click', async () => {
        const contractId = parseInt(document.getElementById('report-contract-select').value);
        if (!contractId) {
            showToast("Seleccione un contrato para exportar el informe.", "warning");
            return;
        }
        const contract = await db.contracts.get(contractId);
        if (!contract) return;

        const partidas = await db.partidas.where({ contractId: contractId }).toArray();
        const hesList = await db.hes.where({ contractId: contractId }).toArray();

        const data = [];
        // Información general del contrato
        data.push({ 'Informe de Contrato Individual': contract.numeroSICAC || contract.numeroProveedor });
        data.push({ 'Monto Total Contrato': `${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}` });
        let totalConsumedAmount = 0;
        for (const hes of hesList) { totalConsumedAmount += hes.totalHes || 0; }
        data.push({ 'Monto Consumido por HES': `${totalConsumedAmount.toFixed(2)} ${contract.moneda || 'USD'}` });
        data.push({ 'Monto Restante del Contrato': `${(contract.montoTotalContrato - totalConsumedAmount).toFixed(2)} ${contract.moneda || 'USD'}` });
        data.push({}); // Fila vacía para separar

        // Partidas del Contrato y Consumo
        data.push({ 'Partidas del Contrato y Consumo': '' });
        const partidasHeaders = ['Descripción', 'Cantidad Original', 'Cantidad Consumida', 'Cantidad Restante', 'Monto Consumido', 'Monto Restante'];
        data.push(partidasHeaders.reduce((obj, header) => { obj[header] = header; return obj; }, {})); // Añadir encabezados
        for (const partida of partidas) {
            const executedInHES = await getExecutedQuantityForContractPartida(partida.id);
            const remainingQuantity = partida.cantidad - executedInHES;
            const consumedAmount = executedInHES * partida.precioUnitario;
            const remainingAmount = remainingQuantity * partida.precioUnitario;
            data.push({
                'Descripción': partida.descripcion,
                'Cantidad Original': `${partida.cantidad} ${partida.umd}`,
                'Cantidad Consumida': `${executedInHES.toFixed(2)} ${partida.umd}`,
                'Cantidad Restante': `${remainingQuantity.toFixed(2)} ${partida.umd}`,
                'Monto Consumido': `${consumedAmount.toFixed(2)} ${contract.moneda || 'USD'}`,
                'Monto Restante': `${remainingAmount.toFixed(2)} ${contract.moneda || 'USD'}`
            });
        }
        data.push({}); // Fila vacía para separar

        // HES Asociadas a este Contrato
        data.push({ 'HES Asociadas a este Contrato': '' });
        const hesHeaders = ['No. HES', 'Fecha Inicio', 'Fecha Final', 'Total HES', 'Estatus'];
        data.push(hesHeaders.reduce((obj, header) => { obj[header] = header; return obj; }, {})); // Añadir encabezados
        if (hesList.length === 0) {
            data.push({ 'No hay HES asociadas a este contrato.': '' });
        } else {
            hesList.forEach(hes => {
                data.push({
                    'No. HES': hes.noHes,
                    'Fecha Inicio': hes.fechaInicioHes,
                    'Fecha Final': hes.fechaFinalHes,
                    'Total HES': hes.totalHes.toFixed(2),
                    'Estatus': hes.aprobado
                });
            });
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Informe Contrato");
        XLSX.writeFile(wb, `Informe_${contract.numeroSICAC || contract.numeroProveedor}.xlsx`);
        showToast("Informe exportado a Excel.", "success");
    });

    // Exportar Informe de Contrato Individual a PDF
    document.getElementById('export-report-pdf-btn')?.addEventListener('click', async () => {
        const contractId = parseInt(document.getElementById('report-contract-select').value);
        if (!contractId) {
            showToast("Seleccione un contrato para exportar el informe.", "warning");
            return;
        }
        const contract = await db.contracts.get(contractId);
        if (!contract) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let yOffset = 15;
        doc.text(`Informe de Contrato Individual: ${contract.numeroSICAC || contract.numeroProveedor}`, 10, yOffset);
        yOffset += 10;
        doc.text(`Monto Total Contrato: ${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`, 10, yOffset);
        yOffset += 7;
        const hesList = await db.hes.where({ contractId: contractId }).toArray();
        let totalConsumedAmount = 0;
        for (const hes of hesList) { totalConsumedAmount += hes.totalHes || 0; }
        doc.text(`Monto Consumido por HES: ${totalConsumedAmount.toFixed(2)} ${contract.moneda || 'USD'}`, 10, yOffset);
        yOffset += 7;
        doc.text(`Monto Restante del Contrato: ${(contract.montoTotalContrato - totalConsumedAmount).toFixed(2)} ${contract.moneda || 'USD'}`, 10, yOffset);
        yOffset += 15;

        doc.text('Partidas del Contrato y Consumo:', 10, yOffset);
        yOffset += 5;
        const partidasTableColumn = ['Descripción', 'Cantidad Original', 'Cantidad Consumida', 'Cantidad Restante', 'Monto Consumido', 'Monto Restante'];
        const partidasTableRows = [];
        const partidas = await db.partidas.where({ contractId: contractId }).toArray();
        for (const partida of partidas) {
            const executedInHES = await getExecutedQuantityForContractPartida(partida.id);
            const remainingQuantity = partida.cantidad - executedInHES;
            const consumedAmount = executedInHES * partida.precioUnitario;
            const remainingAmount = remainingQuantity * partida.precioUnitario;
            partidasTableRows.push([
                partida.descripcion,
                `${partida.cantidad} ${partida.umd}`,
                `${executedInHES.toFixed(2)} ${partida.umd}`,
                `${remainingQuantity.toFixed(2)} ${partida.umd}`,
                `${consumedAmount.toFixed(2)} ${contract.moneda || 'USD'}`,
                `${remainingAmount.toFixed(2)} ${contract.moneda || 'USD'}`
            ]);
        }
        doc.autoTable({
            head: [partidasTableColumn],
            body: partidasTableRows,
            startY: yOffset,
            styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
            headStyles: { fillColor: [70, 130, 180], textColor: 255, fontStyle: 'bold' },
            margin: { top: 15, bottom: 10, left: 10, right: 10 },
             didDrawPage: function(data) { yOffset = data.cursor.y; }
        });

        yOffset += 10; // Espacio después de la tabla
        doc.text('HES Asociadas a este Contrato:', 10, yOffset);
        yOffset += 5;
        const hesTableColumn = ['No. HES', 'Fecha Inicio', 'Fecha Final', 'Total HES', 'Estatus'];
        const hesTableRows = [];
        if (hesList.length === 0) {
            hesTableRows.push(['No hay HES asociadas a este contrato.', '', '', '', '']);
        } else {
            hesList.forEach(hes => {
                hesTableRows.push([
                    hes.noHes,
                    hes.fechaInicioHes,
                    hes.fechaFinalHes,
                    hes.totalHes.toFixed(2),
                    hes.aprobado
                ]);
            });
        }
        doc.autoTable({
            head: [hesTableColumn],
            body: hesTableRows,
            startY: yOffset,
            styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
            headStyles: { fillColor: [70, 130, 180], textColor: 255, fontStyle: 'bold' },
            margin: { top: 15, bottom: 10, left: 10, right: 10 },
             didDrawPage: function(data) { yOffset = data.cursor.y; }
        });

        doc.save(`Informe_${contract.numeroSICAC || contract.numeroProveedor}.pdf`);
        showToast("Informe exportado a PDF.", "success");
    });

    // Modificar el event listener de anexos en HES
    document.getElementById('hes-anexos').addEventListener('change', async (e) => {
        const fileList = await handleFileUpload(e.target, document.getElementById('hes-anexos-info'));
        // Aquí podrías guardar la lista de archivos en la base de datos o manejarla según necesites
    });

    // Función para guardar archivos en la base de datos
    async function guardarArchivos(entidadId, entidadTipo, files) {
        try {
            // Primero eliminar archivos existentes para esta entidad
            await db.archivos.where({ entidadId, entidadTipo }).delete();
            
            // Guardar los nuevos archivos
            for (const file of files) {
                const reader = new FileReader();
                const contenido = await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                
                await db.archivos.add({
                    entidadId,
                    entidadTipo,
                    nombre: file.name,
                    tipo: file.type,
                    tamano: file.size,
                    fechaModificacion: file.lastModified,
                    contenido
                });
            }
            return true;
        } catch (error) {
            console.error('Error al guardar archivos:', error);
            showToast('Error al guardar los archivos adjuntos', 'error');
            return false;
        }
    }

    // Función para recuperar archivos de la base de datos
    async function recuperarArchivos(entidadId, entidadTipo) {
        try {
            const archivos = await db.archivos.where({ entidadId, entidadTipo }).toArray();
            return archivos.map(archivo => ({
                name: archivo.nombre,
                type: archivo.tipo,
                size: archivo.tamano,
                lastModified: archivo.fechaModificacion,
                content: archivo.contenido
            }));
        } catch (error) {
            console.error('Error al recuperar archivos:', error);
            showToast('Error al recuperar los archivos adjuntos', 'error');
            return [];
        }
    }

    // Modificar la función handleFileUpload para incluir el guardado
    async function handleFileUpload(fileInput, infoSpan, entidadId, entidadTipo) {
        const files = fileInput.files;
        if (files.length > 0) {
            const fileList = Array.from(files);
            infoSpan.textContent = `${files.length} archivo(s) seleccionado(s)`;
            
            if (entidadId && entidadTipo) {
                await guardarArchivos(entidadId, entidadTipo, fileList);
            }
            
            return fileList.map(file => ({
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified
            }));
        } else {
            infoSpan.textContent = 'Ningún archivo seleccionado';
            return [];
        }
    }

    // Modificar los event listeners para incluir el guardado
    document.getElementById('adjuntar-archivos').addEventListener('change', async (e) => {
        const fileList = await handleFileUpload(
            e.target, 
            document.getElementById('adjuntar-archivos-info'),
            currentContractId,
            'contrato'
        );
    });

    document.getElementById('hes-anexos').addEventListener('change', async (e) => {
        const fileList = await handleFileUpload(
            e.target, 
            document.getElementById('hes-anexos-info'),
            currentHesId,
            'hes'
        );
    });

    // Modificar la función de cargar contrato para incluir archivos
    async function cargarContrato(contractId) {
        // ... existing code ...
        
        // Cargar archivos adjuntos
        const archivos = await recuperarArchivos(contractId, 'contrato');
        if (archivos.length > 0) {
            document.getElementById('adjuntar-archivos-info').textContent = 
                `${archivos.length} archivo(s) adjunto(s)`;
        }
        
        // ... rest of existing code ...
    }

    // Modificar la función de cargar HES para incluir archivos
    async function cargarHES(hesId) {
        // ... existing code ...
        
        // Cargar anexos
        const archivos = await recuperarArchivos(hesId, 'hes');
        if (archivos.length > 0) {
            document.getElementById('hes-anexos-info').textContent = 
                `${archivos.length} archivo(s) adjunto(s)`;
        }
        
        // ... rest of existing code ...
    }

    // Función para descargar archivos adjuntos
    async function descargarArchivo(archivo) {
        try {
            // Crear un enlace temporal
            const link = document.createElement('a');
            link.href = archivo.content;
            link.download = archivo.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error al descargar archivo:', error);
            showToast('Error al descargar el archivo', 'error');
        }
    }

    // Función para mostrar la lista de archivos adjuntos
    function mostrarArchivosAdjuntos(archivos, contenedorId) {
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return;
        
        contenedor.innerHTML = '';
        if (archivos.length === 0) {
            contenedor.innerHTML = '<p class="text-muted">No hay archivos adjuntos</p>';
            return;
        }
        
        const lista = document.createElement('ul');
        lista.className = 'list-group';
        
        archivos.forEach(archivo => {
            const item = document.createElement('li');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            const info = document.createElement('div');
            info.innerHTML = `
                <strong>${archivo.name}</strong>
                <small class="text-muted ms-2">${(archivo.size / 1024).toFixed(2)} KB</small>
            `;
            
            const boton = document.createElement('button');
            boton.className = 'btn btn-sm btn-primary';
            boton.innerHTML = '<i class="fas fa-download"></i>';
            boton.onclick = () => descargarArchivo(archivo);
            
            item.appendChild(info);
            item.appendChild(boton);
            lista.appendChild(item);
        });
        
        contenedor.appendChild(lista);
    }

    // Modificar las funciones de cargar para mostrar los archivos
    async function cargarContrato(contractId) {
        // ... existing code ...
        
        // Cargar y mostrar archivos adjuntos
        const archivos = await recuperarArchivos(contractId, 'contrato');
        mostrarArchivosAdjuntos(archivos, 'archivos-contrato');
        
        // ... rest of existing code ...
    }

    async function cargarHES(hesId) {
        // ... existing code ...
        
        // Cargar y mostrar anexos
        const archivos = await recuperarArchivos(hesId, 'hes');
        mostrarArchivosAdjuntos(archivos, 'archivos-hes');
        
        // ... rest of existing code ...
    }

    // Event listener para calcular fecha de terminación extendida
    diasExtensionInput.addEventListener('input', () => {
        const fechaOriginal = new Date(fechaTerminacionOriginalInput.value);
        const dias = parseInt(diasExtensionInput.value) || 0;
        if (!isNaN(fechaOriginal.getTime()) && dias >= 0) {
            const fechaExtendida = new Date(fechaOriginal);
            fechaExtendida.setDate(fechaOriginal.getDate() + dias);
            fechaTerminacionExtendidaInput.value = fechaExtendida.toISOString().split('T')[0];
        } else {
            fechaTerminacionExtendidaInput.value = ''; // Limpiar si las entradas no son válidas
        }
    });

    // Función para calcular la fecha de vencimiento (20 días antes)
    function calcularFechaVencimiento(fechaTerminacion) {
        const fecha = new Date(fechaTerminacion);
        fecha.setDate(fecha.getDate() - 20);
        return fecha;
    }

    // Función para calcular la fecha extendida
    function calcularFechaExtendida(fechaTerminacion, diasExtension) {
        const fecha = new Date(fechaTerminacion);
        fecha.setDate(fecha.getDate() + diasExtension);
        return fecha;
    }

    // Modificar la función de guardar contrato
    async function guardarContrato(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        // Calcular fecha de vencimiento (20 días antes)
        const fechaTerminacion = new Date(formData.get('fechaTerminacion'));
        const fechaVencimiento = calcularFechaVencimiento(fechaTerminacion);
        
        // Calcular fecha extendida si hay días de extensión
        const diasExtension = parseInt(formData.get('diasExtension')) || 0;
        const fechaExtendida = diasExtension > 0 ? calcularFechaExtendida(fechaTerminacion, diasExtension) : null;

        const contratoData = {
            numeroProveedor: formData.get('numeroProveedor'),
            numeroSICAC: formData.get('numeroSICAC'),
            fechaFirma: formData.get('fechaFirma'),
            fechaInicio: formData.get('fechaInicio'),
            fechaTerminacion: fechaTerminacion,
            fechaVencimiento: fechaVencimiento,
            diasExtension: diasExtension,
            fechaExtendida: fechaExtendida,
            montoTotalContrato: parseFloat(formData.get('montoTotalContrato')),
            estatusContrato: formData.get('estatusContrato'),
            modalidadContratacion: formData.get('modalidadContratacion'),
            moneda: formData.get('moneda'),
            observaciones: formData.get('observaciones'),
            fechaCreacion: new Date(),
            fechaModificacion: new Date()
        };

        try {
            await db.contracts.add(contratoData);
            showToast('Contrato guardado exitosamente', 'success');
            form.reset();
        } catch (error) {
            showToast('Error al guardar el contrato: ' + error.message, 'error');
        }
    }

    // Modificar la función de guardar HES
    async function guardarHES(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const contractId = parseInt(formData.get('contractId'));
        const contrato = await db.contracts.get(contractId);
        
        // Calcular monto adicional y porcentaje
        const montoAdicional = parseFloat(formData.get('montoAdicional')) || 0;
        const porcentajeAdicional = parseFloat(formData.get('porcentajeAdicional')) || 0;
        
        // Validar que el monto total no supere el monto original del contrato
        const totalHes = parseFloat(formData.get('totalHes')) + montoAdicional;
        if (totalHes > contrato.montoTotalContrato) {
            showToast('El monto total no puede superar el monto original del contrato', 'error');
            return;
        }

        const hesData = {
            contractId: contractId,
            noHes: formData.get('noHes'),
            fechaInicioHes: formData.get('fechaInicioHes'),
            fechaFinalHes: formData.get('fechaFinalHes'),
            totalHes: totalHes,
            estatusHes: formData.get('estatusHes'),
            aprobado: formData.get('aprobado') === 'true',
            montoAdicional: montoAdicional,
            porcentajeAdicional: porcentajeAdicional,
            fechaCreacion: new Date(),
            fechaModificacion: new Date()
        };

        try {
            await db.hes.add(hesData);
            showToast('HES guardada exitosamente', 'success');
            form.reset();
        } catch (error) {
            showToast('Error al guardar la HES: ' + error.message, 'error');
        }
    }

    // Función para verificar vencimientos
    async function verificarVencimientos() {
        const hoy = new Date();
        const contratos = await db.contracts.toArray();
        
        // Obtener el número de días configurado para las alertas
        const configAlerta = await db.configuracion.where('clave').equals('dias_alerta_vencimiento').first();
        const diasAlerta = configAlerta ? parseInt(configAlerta.valor) : 20; // Valor por defecto: 20 días
        
        for (const contrato of contratos) {
            const fechaVencimiento = new Date(contrato.fechaVencimiento);
            const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
            
            if (diasRestantes <= diasAlerta && diasRestantes > 0) {
                showToast(`¡Alerta! El contrato ${contrato.numeroSICAC || contrato.numeroProveedor} vence en ${diasRestantes} días`, 'warning');
            }
        }
    }

    // Función para actualizar la configuración de días de alerta
    async function actualizarDiasAlerta(nuevosDias) {
        try {
            const configAlerta = await db.configuracion.where('clave').equals('dias_alerta_vencimiento').first();
            if (configAlerta) {
                await db.configuracion.update(configAlerta.id, { valor: nuevosDias.toString() });
            } else {
                await db.configuracion.add({
                    clave: 'dias_alerta_vencimiento',
                    valor: nuevosDias.toString(),
                    descripcion: 'Número de días antes del vencimiento para mostrar alertas'
                });
            }
            showToast('Configuración de días de alerta actualizada correctamente', 'success');
            // Ejecutar verificación inmediatamente con la nueva configuración
            await verificarVencimientos();
        } catch (error) {
            console.error('Error al actualizar días de alerta:', error);
            showToast('Error al actualizar la configuración: ' + error.message, 'error');
        }
    }

    // Ejecutar verificación de vencimientos cada día y al cargar la página
    setInterval(verificarVencimientos, 24 * 60 * 60 * 1000);
    verificarVencimientos(); // Ejecutar al cargar la página

    // --- Gestión de Base de Datos (Importación/Exportación) ---

    // Función para exportar toda la base de datos a un archivo Excel con múltiples hojas
    async function exportDatabase() {
        try {
            showToast('Preparando datos para exportar a Excel...', 'info');

            const data = {
                contracts: await db.contracts.toArray(),
                partidas: await db.partidas.toArray(),
                hes: await db.hes.toArray(),
                hesPartidas: await db.hesPartidas.toArray(),
                trash: await db.trash.toArray(), // Incluir papelera en exportación
                archivos: await db.archivos.toArray() // Incluir metadatos de archivos en exportación
            };

            const wb = XLSX.utils.book_new();

            // Añadir cada tabla como una hoja
            for (const tableName in data) {
                if (data.hasOwnProperty(tableName)) {
                    const ws = XLSX.utils.json_to_sheet(data[tableName]);
                    XLSX.utils.book_append_sheet(wb, ws, tableName.charAt(0).toUpperCase() + tableName.slice(1)); // Capitalizar nombre de hoja
                }
            }

            XLSX.writeFile(wb, 'sigescon_db_export.xlsx');

            showToast('Base de datos exportada a Excel exitosamente.', 'success');

        } catch (error) {
            console.error('Error al exportar la base de datos:', error);
            showToast('Error al exportar la base de datos: ' + error.message, 'error');
        }
    }

    // Event listener para el botón de exportar
    const exportDbBtn = document.getElementById('export-db-btn');
    if (exportDbBtn) {
        exportDbBtn.addEventListener('click', exportDatabase);
    }

    // --- Lógica de Importación de Base de Datos desde Excel ---
    const importDbBtn = document.getElementById('import-db-btn');
    const importDbFileInput = document.getElementById('import-db-file-input');

    // Asociar el botón al input de archivo oculto
    if (importDbBtn && importDbFileInput) {
        importDbBtn.addEventListener('click', () => {
            importDbFileInput.click(); // Simula el clic en el input de archivo
        });
    }

    // Event listener para cuando se selecciona un archivo en el input
    if (importDbFileInput) {
        importDbFileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return; // No hay archivo seleccionado

            if (!confirm('¿Está seguro de que desea importar datos? Esto podría actualizar o añadir contratos y HES existentes.')) {
                importDbFileInput.value = '';
                return;
            }

            showToast('Iniciando importación desde Excel...', 'info');

            try {
                const reader = new FileReader();
                reader.onload = async (e) => { // <-- Abre scope de onload
                    try { // <-- Abre try dentro de onload
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });

                        // --- Lógica de Procesamiento de Hojas y Datos ---
                        const importedData = {};
                        workbook.SheetNames.forEach(sheetName => {
                            const worksheet = workbook.Sheets[sheetName];
                            // Convertir la hoja a JSON (array de objetos)
                            importedData[sheetName.toLowerCase()] = XLSX.utils.sheet_to_json(worksheet);
                        });

                        console.log('Datos leídos del archivo Excel:', importedData);

                        // Diccionarios para mapear IDs antiguos/externos a IDs de Dexie
                        const contractIdMap = new Map(); // Mapa: identificador_externo -> dexieId
                        const hesIdMap = new Map(); // Mapa: identificador_externo -> dexieId
                        
                        // --- Importar Contratos ---
                        if (importedData.contracts) {
                             showToast(`Importando ${importedData.contracts.length} contratos...`, 'info');
                            for (const contractData of importedData.contracts) {
                                // Usar numeroSICAC o numeroProveedor como identificador único si están presentes
                                // Asumimos que si numeroSICAC existe, es el principal. Si no, usamos numeroProveedor.
                                const externalId = contractData.numeroSICAC || contractData.numeroProveedor;
                                
                                if (!externalId) {
                                     console.warn('Contrato sin identificador único (numeroSICAC o numeroProveedor), omitiendo:', contractData);
                                     showToast(`Contrato sin identificador único omitido.`, 'warning');
                                     continue; // Omitir contratos sin identificador único
                                }

                                // Buscar si el contrato ya existe en Dexie por numeroSICAC o numeroProveedor
                                let existingContract = await db.contracts
                                    .where('numeroSICAC').equals(externalId).first() ||
                                    await db.contracts.where('numeroProveedor').equals(externalId).first();

                                // Eliminar el ID original si existe para que Dexie asigne uno nuevo en caso de add
                                delete contractData.id; 
                                
                                let dexieId;
                                if (existingContract) {
                                    // Si existe, actualizarlo
                                    // Mantener el ID de Dexie existente
                                    dexieId = existingContract.id;
                                    await db.contracts.update(dexieId, contractData);
                                    console.log(`Contrato ${externalId} actualizado (Dexie ID: ${dexieId}).`);
                                } else {
                                    // Si no existe, añadirlo
                                    dexieId = await db.contracts.add(contractData);
                                    console.log(`Contrato ${externalId} añadido (Dexie ID: ${dexieId}).`);
                                }
                                // Mapear el identificador externo al ID de Dexie
                                contractIdMap.set(externalId, dexieId);
                            }
                            showToast('Contratos importados/actualizados.', 'success');
                        }

                        // --- Importar Partidas (depende de Contratos) ---
                        if (importedData.partidas) {
                            showToast(`Importando ${importedData.partidas.length} partidas...`, 'info');
                             // Limpiar partidas existentes para los contratos que fueron actualizados
                             const updatedContractIds = Array.from(contractIdMap.values());
                             if(updatedContractIds.length > 0) {
                                 // Esto podría ser problemático si el Excel no tiene TODAS las partidas del contrato.
                                 // Una lógica más avanzada implicaría intentar emparejar partidas también.
                                 // Por ahora, si actualizamos un contrato, BORRAMOS sus partidas viejas e insertamos las del Excel.
                                 await db.partidas.where('contractId').anyOf(updatedContractIds).delete();
                                 console.log(`Partidas antiguas de ${updatedContractIds.length} contratos actualizados eliminadas.`);
                             }
                            for (const partidaData of importedData.partidas) {
                                // Asumimos que cada partida tiene una referencia al contrato padre (ej. por numeroSICAC del contrato)
                                const parentContractExternalId = partidaData.contractExternalId; // Nombre de columna de ejemplo
                                const parentContractDexieId = contractIdMap.get(parentContractExternalId);

                                if (parentContractDexieId) {
                                     delete partidaData.id; // Eliminar ID original
                                    // Asegurarse de que la partida se vincule al ID de Dexie del contrato
                                    partidaData.contractId = parentContractDexieId;
                                     // Opcional: Eliminar la columna externa usada para el mapeo
                                     delete partidaData.contractExternalId;
                                    await db.partidas.add(partidaData);
                                } else {
                                    console.warn(`Partida sin contrato padre válido (${parentContractExternalId}), omitiendo:`, partidaData);
                                    showToast(`Partida sin contrato padre válido omitida.`, 'warning');
                                }
                            }
                             showToast('Partidas importadas.', 'success');
                        }

                        // --- Importar HES (depende de Contratos) ---
                        if (importedData.hes) {
                            showToast(`Importando ${importedData.hes.length} HES...`, 'info');
                             // Similar a partidas, si actualizamos un contrato, BORRAMOS sus HES viejas y las insertamos desde Excel
                              const updatedContractIds = Array.from(contractIdMap.values());
                              if(updatedContractIds.length > 0) {
                                   await db.hes.where('contractId').anyOf(updatedContractIds).delete();
                                   console.log(`HES antiguas de ${updatedContractIds.length} contratos actualizados eliminadas.`);
                              }
                            for (const hesData of importedData.hes) {
                                const parentContractExternalId = hesData.contractExternalId; // Nombre de columna de ejemplo
                                const parentContractDexieId = contractIdMap.get(parentContractExternalId);
                                const hesExternalId = hesData.noHes; // Usar noHes como identificador para HES

                                if (parentContractDexieId && hesExternalId) {
                                    delete hesData.id; // Eliminar ID original
                                     // Asegurarse de que la HES se vincule al ID de Dexie del contrato
                                    hesData.contractId = parentContractDexieId;
                                     // Opcional: Eliminar la columna externa usada para el mapeo
                                     delete hesData.contractExternalId;
                                    
                                    // Aquí podríamos buscar si la HES ya existe dentro del contrato (por noHes) si quisiéramos actualizar HES individuales
                                    // Por ahora, con el borrado de HES viejas por contrato, simplemente las añadimos.
                                    
                                    const newHesId = await db.hes.add(hesData);
                                     // Mapear el identificador externo (noHes) al ID de Dexie de la HES recién creada
                                     hesIdMap.set(hesExternalId, newHesId);

                                } else {
                                    console.warn(`HES sin contrato padre válido (${parentContractExternalId}) o sin noHes (${hesExternalId}), omitiendo:`, hesData);
                                     showToast(`HES sin contrato padre válido o sin No. HES omitida.`, 'warning');
                                }
                            }
                             showToast('HES importadas.', 'success');
                        }

                        // --- Importar HesPartidas (depende de HES y Partidas) ---
                        if (importedData.hespartidas) {
                            showToast(`Importando ${importedData.hespartidas.length} HesPartidas...`, 'info');
                            // La lógica de importación es más compleja y se abordará en el siguiente paso.
                            // Necesita manejar duplicados, relaciones entre tablas, y errores.
                            // NO HAY }); AQUÍ
                        }

                        // ... Continúa con la lógica de importación de otras tablas si las hay ...

                        showToast('Importación desde Excel finalizada.', 'success'); // Mensaje de éxito final para la importación

                    } catch (error) { // <-- Cierra el try dentro de onload
                        console.error('Error al procesar el archivo Excel:', error);
                        showToast('Error al procesar el archivo Excel: ' + error.message, 'error');
                    }
                }; // <-- Cierre del reader.onload (Añadido/corregido)

                reader.readAsArrayBuffer(file); // Inicia la lectura del archivo

            } catch (error) { // <-- Cierra el try principal
                console.error('Error durante la lectura o importación del archivo:', error);
                showToast('Error durante la lectura o importación: ' + error.message, 'error');
            }
        }); // <-- Cierra el listener de change
    } // <-- Cierra el if de importDbFileInput

    // Lógica para el botón de hamburguesa y el sidebar responsive
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const bodyEl = document.body;

    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', () => {
            bodyEl.classList.toggle('sidebar-open');
        });
    }

    // Cerrar sidebar al hacer clic en el overlay o en un enlace del sidebar (si se convierte en menú)
    document.addEventListener('click', (e) => {
        // Si se hizo clic en el overlay y el sidebar está abierto
        if (bodyEl.classList.contains('sidebar-open') && e.target === bodyEl.lastChild && e.target.classList.contains('sidebar-overlay')) {
             bodyEl.classList.remove('sidebar-open');
         }
         // Si se hizo clic en un enlace dentro del sidebar (y está en modo responsive/desplegable)
         if (bodyEl.classList.contains('sidebar-open') && e.target.closest('.sidebar .nav-link')) {
             // Añadir una pequeña demora para permitir que la navegación ocurra antes de cerrar
             setTimeout(() => {
                  bodyEl.classList.remove('sidebar-open');
             }, 100);
         }
    });

    // Opcional: Cerrar sidebar si se redimensiona la ventana a un tamaño mayor
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && bodyEl.classList.contains('sidebar-open')) {
            bodyEl.classList.remove('sidebar-open');
        }
    });

    // Cargar configuración de días de alerta
    async function cargarConfiguracionDiasAlerta() {
        try {
            const configAlerta = await db.configuracion.where('clave').equals('dias_alerta_vencimiento').first();
            const diasAlertaInput = document.getElementById('dias-alerta-vencimiento');
            if (diasAlertaInput) {
                diasAlertaInput.value = configAlerta ? configAlerta.valor : '20';
            }
        } catch (error) {
            console.error('Error al cargar configuración de días de alerta:', error);
        }
    }

    // Event listener para el botón de guardar días de alerta
    const guardarDiasAlertaBtn = document.getElementById('guardar-dias-alerta-btn');
    if (guardarDiasAlertaBtn) {
        guardarDiasAlertaBtn.addEventListener('click', async () => {
            const diasAlertaInput = document.getElementById('dias-alerta-vencimiento');
            if (diasAlertaInput) {
                const nuevosDias = parseInt(diasAlertaInput.value);
                if (nuevosDias >= 1 && nuevosDias <= 365) {
                    await actualizarDiasAlerta(nuevosDias);
                } else {
                    showToast('El número de días debe estar entre 1 y 365', 'warning');
                }
            }
        });
    }

    // Cargar configuración al cambiar a la pestaña de informes
    tabButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const targetId = button.getAttribute('data-target');
            
            if (targetId === 'reports') {
                await cargarConfiguracionDiasAlerta();
            }
            // ... resto del código existente ...
        });
    });

    // ... existing code ...

    // Llamada inicial para cargar el resumen general y el carrusel al cargar la página
    // Asegurarse de que el carrusel se inicialice DESPUÉS de que los datos se carguen
    updateSummaryCards(); // <-- Ahora dentro del listener
    renderContractsSlider(); // <-- Ahora dentro del listener

}); // Cierre del event listener DOMContentLoaded (Asegúrate que este es el ÚNICO }}); al final)

// Funciones restantes del archivo (si las hay fuera del DOMContentLoaded)
// ... existing code ...