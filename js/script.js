// script.js
document.addEventListener('DOMContentLoaded', async () => {
    // Inicialización de Dexie (base de datos local)
    const db = new Dexie('SigesconDB');
    db.version(1).stores({
        contracts: '++id,numeroProveedor,fechaFirmaContrato,montoTotalContrato,estatusContrato',
        partidas: '++id,contractId,descripcion,cantidad,umd,precioUnitario,total',
        hes: '++id,contractId,noHes,fechaInicioHes,fechaFinalHes,aprobado,textoHes,ejecutada,fechaCreadoHes,fechaAprobadoHes,textoBreveHes,valuacion,lugarPrestacionServicio,responsableSdo,subTotalHes,gastosAdministrativosHes,totalHes',
        hesPartidas: '++id,hesId,contractPartidaId,descripcion,cantidadOriginal,cantidadEjecutada,umd,precioUnitario,totalPartidaHes',
        trash: '++id,originalId,type,data,deletedAt' // Para la papelera de reciclaje
    });

    try {
        await db.open();
        console.log("Base de datos abierta exitosamente.");
        // seedDatabase(); // Habilitar para cargar datos de prueba al inicio
    } catch (err) {
        console.error("Error al abrir la base de datos:", err);
        showToast("Error al cargar la base de datos local. " + err.message, "error");
        return;
    }

    // --- Elementos del DOM ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.content-section');
    const contractForm = document.getElementById('contract-form');
    const addPartidaBtn = document.getElementById('add-partida-btn');
    const partidasTableBody = document.querySelector('#partidas-table-body');
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
    let contractStatusChartInstance, contractModalityChartInstance;
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
            
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Cargar datos específicos al cambiar de pestaña
            if (targetId === 'contract-list') {
                await loadContractList();
            } else if (targetId === 'general-summary') {
                await updateSummaryCards();
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
            } else if (targetId === 'reports') {
                await populateContractSelect(reportContractSelect);
                reportDetails.style.display = 'none';
                reportHesDetailView.style.display = 'none';
            }
        });
    });

    // --- Funciones para Resumen General ---
    async function updateSummaryCards() {
        try {
            const allContracts = await db.contracts.toArray();
            document.getElementById('active-contracts').textContent = allContracts.filter(c => c.estatusContrato === 'Activo').length;
            
            const totalAmount = allContracts.reduce((sum, c) => sum + (c.montoTotalContrato || 0), 0);
            document.getElementById('total-contract-amount').textContent = `USD ${totalAmount.toFixed(2)}`;

            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            const expiringContracts = allContracts.filter(c => 
                c.fechaTerminacion && new Date(c.fechaTerminacion) <= thirtyDaysFromNow && new Date(c.fechaTerminacion) >= new Date()
            ).length;
            document.getElementById('expiring-contracts').textContent = expiringContracts;

            const modalities = new Set(allContracts.map(c => c.modalidadContratacion).filter(Boolean));
            document.getElementById('total-modalities').textContent = modalities.size;

        } catch (error) {
            console.error("Error al actualizar tarjetas de resumen:", error);
            showToast("Error al cargar resumen general.", "error");
        }
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
    contractForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const contractData = {
            numeroProveedor: document.getElementById('numero-proveedor').value,
            fechaFirmaContrato: document.getElementById('fecha-firma-contrato').value,
            fechaCreado: document.getElementById('fecha-creado').value,
            fechaInicio: document.getElementById('fecha-inicio').value,
            fechaTerminacion: document.getElementById('fecha-terminacion').value,
            periodoCulminacion: parseInt(periodoCulminacionInput.value) || 0,
            numeroSICAC: document.getElementById('numero-sicac').value,
            divisionArea: document.getElementById('division-area').value,
            eemn: document.getElementById('eemn').value,
            region: document.getElementById('region').value,
            naturalezaContratacion: document.getElementById('naturaleza-contratacion').value,
            lineaServicio: document.getElementById('linea-servicio').value,
            noPeticionOferta: document.getElementById('no-peticion-oferta').value,
            modalidadContratacion: modalidadContratacionSelect.value,
            regimenLaboral: document.getElementById('regimen-laboral').value,
            objetoContractual: document.getElementById('objeto-contractual').value,
            fechaCambioAlcance: document.getElementById('fecha-cambio-alcance').value,
            montoOriginal: parseFloat(montoOriginalInput.value) || 0,
            montoModificado: parseFloat(montoModificadoInput.value) || 0,
            montoTotalContrato: parseFloat(montoTotalContratoInput.value) || 0,
            numeroContratoInterno: document.getElementById('numero-contrato-interno').value,
            observaciones: document.getElementById('observaciones').value,
            estatusContrato: document.getElementById('estatus-contrato').value,
            moneda: document.getElementById('moneda').value,
            // Los archivos adjuntos requieren manejo especial
        };

        if (!contractData.numeroProveedor || !contractData.fechaFirmaContrato || !contractData.fechaInicio || !contractData.fechaTerminacion) {
            showToast("Por favor, complete los campos obligatorios: N° Proveedor, Fecha Firma, Fecha Inicio y Fecha Terminación.", "warning");
            return;
        }

        try {
            let contractId;
            if (currentContractId) {
                await db.contracts.update(currentContractId, contractData);
                contractId = currentContractId;
                showToast("Contrato actualizado exitosamente.", "success");
            } else {
                contractId = await db.contracts.add(contractData);
                showToast("Contrato guardado exitosamente.", "success");
            }

            // Guardar partidas asociadas al contrato
            await db.partidas.where({ contractId: contractId }).delete();
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
            
            clearContractFormBtn.click();
            loadContractList();
            tabButtons.forEach(btn => {
                if (btn.getAttribute('data-target') === 'contract-list') {
                    btn.click();
                }
            });

        } catch (error) {
            console.error("Error al guardar/actualizar el contrato:", error);
            showToast("Error al guardar/actualizar el contrato: " + error.message, "error");
        }
    });

    document.getElementById('adjuntar-archivos').addEventListener('change', (e) => {
        const fileInput = e.target;
        const infoSpan = document.getElementById('adjuntar-archivos-info');
        if (fileInput.files.length > 0) {
            infoSpan.textContent = `${fileInput.files.length} archivo(s) seleccionado(s)`;
        } else {
            infoSpan.textContent = 'Ningún archivo seleccionado';
        }
    });


    // --- Lógica de Lista de Contratos ---

    async function loadContractList(filters = {}) {
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
            const contract = await db.contracts.get(contractId);
            if (contract) {
                document.getElementById('numero-proveedor').value = contract.numeroProveedor || '';
                document.getElementById('fecha-firma-contrato').value = contract.fechaFirmaContrato || '';
                document.getElementById('fecha-creado').value = contract.fechaCreado || new Date().toISOString().split('T')[0];
                document.getElementById('fecha-inicio').value = contract.fechaInicio || '';
                document.getElementById('fecha-terminacion').value = contract.fechaTerminacion || '';
                periodoCulminacionInput.value = contract.periodoCulminacion !== undefined ? contract.periodoCulminacion : '';
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
                
                partidasTableBody.innerHTML = '';
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
                updateContractPartidaTotals();
                calculatePeriodoCulminacion();

                currentContractId = contractId;
                showToast("Contrato cargado para edición.", "info");
                tabButtons.forEach(btn => {
                    if (btn.getAttribute('data-target') === 'new-edit-contract') {
                        btn.click();
                    }
                });
            }
        } else if (targetBtn.classList.contains('delete-contract-btn')) {
            if (confirm('¿Está seguro de que desea enviar este contrato a la papelera?')) {
                try {
                    const contractToDelete = await db.contracts.get(contractId);
                    // Mover a la papelera en lugar de eliminar directamente
                    await db.trash.add({
                        originalId: contractId,
                        type: 'contract',
                        data: contractToDelete,
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
        hesPartidasInfo.style.display = 'block'; // Mostrar mensaje informativo por defecto

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

        // Calcular avance físico y financiero del contrato para verificar si está al 100%
        const { physicalAdvancePercentage, financialAdvancePercentage } = await calculateContractAdvances(contractId);
        if (physicalAdvancePercentage >= 100 && financialAdvancePercentage >= 100) {
            hesPartidasInfo.textContent = 'Este contrato ya ha alcanzado el 100% de avance físico y financiero. No se pueden agregar más partidas HES.';
            showToast('Este contrato ya está al 100% de avance. No se pueden agregar más HES.', 'warning');
            return;
        }

        hesPartidasInfo.style.display = 'none'; // Ocultar el mensaje si hay un contrato
        const partidas = await db.partidas.where({ contractId: contractId }).toArray();
        const hesPartidasExistentes = currentHesId ? await db.hesPartidas.where({ hesId: currentHesId }).toArray() : [];

        if (partidas.length === 0) {
            hesPartidasInfo.style.display = 'block';
            hesPartidasInfo.textContent = 'Este contrato no tiene partidas registradas.';
            clearHesPartidaTotals();
            return;
        }

        for (const partida of partidas) {
            const executedQuantityForPartida = await getExecutedQuantityForContractPartida(contractId, partida.id);
            const remainingQuantity = partida.cantidad - executedQuantityForPartida;

            // Si la cantidad restante es 0 o negativa, no mostrar la partida para nuevas HES,
            // pero sí para edición de HES si ya existía.
            if (remainingQuantity <= 0 && !hesPartidasExistentes.some(hp => hp.contractPartidaId === partida.id)) {
                continue;
            }

            const hesPartida = hesPartidasExistentes.find(hp => hp.contractPartidaId === partida.id);
            const cantidadEjecutada = hesPartida ? hesPartida.cantidadEjecutada : 0;
            const totalPartidaHes = hesPartida ? hesPartida.totalPartidaHes : 0;
            const isChecked = hesPartida ? 'checked' : '';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="hes-partida-checkbox" data-contract-partida-id="${partida.id}" ${isChecked}></td>
                <td>${partida.descripcion}</td>
                <td>${partida.cantidad} ${partida.umd}</td>
                <td>${partida.precioUnitario.toFixed(2)}</td>
                <td>${remainingQuantity.toFixed(2)} ${partida.umd}</td>
                <td><input type="number" class="form-control hes-partida-cantidad-ejecutada" min="0" max="${remainingQuantity + cantidadEjecutada}" value="${cantidadEjecutada.toFixed(2)}" step="0.01" ${isChecked ? '' : 'disabled'}></td>
                <td><span class="total-hes-partida">${totalPartidaHes.toFixed(2)}</span></td>
            `;
            hesPartidasTableBody.appendChild(row);
        }

        if (hesPartidasTableBody.children.length === 0) {
            hesPartidasInfo.style.display = 'block';
            hesPartidasInfo.textContent = 'Todas las partidas de este contrato ya han sido ejecutadas o no hay partidas disponibles para agregar.';
        }

        updateHesPartidaTotals();
    });

    // Delegación de eventos para checkboxes y campos de cantidad ejecutada en HES
    hesPartidasTableBody.addEventListener('change', (e) => {
        const row = e.target.closest('tr');
        if (e.target.classList.contains('hes-partida-checkbox')) {
            const cantidadInput = row.querySelector('.hes-partida-cantidad-ejecutada');
            const totalSpan = row.querySelector('.total-hes-partida');
            if (e.target.checked) {
                cantidadInput.disabled = false;
                // Si se marca, intenta rellenar con la cantidad restante si es 0, o 1 si no hay restante
                const originalQuantity = parseFloat(row.children[2].textContent.split(' ')[0]);
                const contractPartidaId = parseInt(e.target.dataset.contractPartidaId);
                getExecutedQuantityForContractPartida(parseInt(hesContractSelect.value), contractPartidaId).then(executedForPartida => {
                    const maxAllowed = originalQuantity - executedForPartida;
                    cantidadInput.value = maxAllowed > 0 ? maxAllowed.toFixed(2) : '0.00';
                    updateHesPartidaTotals(row);
                });
            } else {
                cantidadInput.disabled = true;
                cantidadInput.value = '0.00';
                totalSpan.textContent = '0.00';
            }
            updateHesPartidaTotals();
        }
    });

    hesPartidasTableBody.addEventListener('input', (e) => {
        if (e.target.classList.contains('hes-partida-cantidad-ejecutada')) {
            const row = e.target.closest('tr');
            updateHesPartidaTotals(row);
        }
    });

    // Actualiza los totales de partidas HES y el Subtotal/Total de la HES
    async function updateHesPartidaTotals(row = null) {
        let currentHesSubtotal = 0;
        const rowsToProcess = row ? [row] : hesPartidasTableBody.querySelectorAll('tr');

        for (const r of Array.from(rowsToProcess)) {
            const checkbox = r.querySelector('.hes-partida-checkbox');
            if (checkbox && checkbox.checked) {
                const cantidadEjecutada = parseFloat(r.querySelector('.hes-partida-cantidad-ejecutada').value) || 0;
                const precioUnitario = parseFloat(r.children[3].textContent) || 0; // Precio Unitario del contrato
                const totalPartidaHes = cantidadEjecutada * precioUnitario;
                r.querySelector('.total-hes-partida').textContent = totalPartidaHes.toFixed(2);
                currentHesSubtotal += totalPartidaHes;

                // Validar que la cantidad ejecutada no exceda la cantidad restante
                const contractPartidaId = parseInt(checkbox.dataset.contractPartidaId);
                const originalQuantity = parseFloat(r.children[2].textContent.split(' ')[0]);
                const executedForPartidaExcludingCurrentHes = await getExecutedQuantityForContractPartida(parseInt(hesContractSelect.value), contractPartidaId, currentHesId);
                const maxAllowed = originalQuantity - executedForPartidaExcludingCurrentHes;

                if (cantidadEjecutada > maxAllowed) {
                    showToast(`La cantidad ejecutada para "${r.children[1].textContent}" no puede exceder la cantidad restante (${maxAllowed.toFixed(2)}).`, 'warning');
                    r.querySelector('.hes-partida-cantidad-ejecutada').value = maxAllowed.toFixed(2);
                    r.querySelector('.total-hes-partida').textContent = (maxAllowed * precioUnitario).toFixed(2);
                    currentHesSubtotal -= (cantidadEjecutada * precioUnitario); // Restar el valor excesivo
                    currentHesSubtotal += (maxAllowed * precioUnitario); // Sumar el valor corregido
                }
            }
        }
        
        hesSubtotalInput.value = currentHesSubtotal.toFixed(2);
        // Recalcular Total HES
        const gastosAdministrativos = parseFloat(hesGastosAdministrativosInput.value) || 0;
        hesTotalInput.value = (currentHesSubtotal + gastosAdministrativos).toFixed(2);
    }

    // Escuchar cambios en Gastos Administrativos para recalcular Total HES
    hesGastosAdministrativosInput.addEventListener('input', updateHesPartidaTotals);

    function clearHesPartidaTotals() {
        hesSubtotalInput.value = '0.00';
        hesGastosAdministrativosInput.value = '0.00';
        hesTotalInput.value = '0.00';
    }

    // Limpiar formulario de HES
    clearHesFormBtn.addEventListener('click', () => {
        hesForm.reset();
        hesPartidasTableBody.innerHTML = '';
        hesPartidasInfo.style.display = 'block';
        hesPartidasInfo.textContent = 'Seleccione un contrato para cargar sus partidas.';
        document.getElementById('hes-anexos-info').textContent = 'Ningún archivo seleccionado';
        currentHesId = null;
        hesFechaCreadoInput.value = new Date().toISOString().split('T')[0]; // Resetear fecha de creación
        clearHesPartidaTotals();
        showToast("Formulario de HES limpiado.", "info");
    });

    // Guardar/Actualizar HES
    hesForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const contractId = parseInt(hesContractSelect.value);
        if (!contractId) {
            showToast("Debe seleccionar un contrato para la HES.", "warning");
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
            valuacion: hesValuacionInput.value,
            lugarPrestacionServicio: hesLugarPrestacionServicioInput.value,
            responsableSdo: hesResponsableSdoInput.value,
            subTotalHes: parseFloat(hesSubtotalInput.value) || 0,
            gastosAdministrativosHes: parseFloat(hesGastosAdministrativosInput.value) || 0,
            totalHes: parseFloat(hesTotalInput.value) || 0,
            valuado: hesValuadoCheckbox.checked
            // Anexos requerirán manejo especial
        };

        if (!hesData.noHes || !hesData.fechaCreadoHes) {
            showToast("Por favor, complete los campos obligatorios: Número HES y Fecha de Creación.", "warning");
            return;
        }

        const selectedHesPartidas = [];
        hesPartidasTableBody.querySelectorAll('tr').forEach(row => {
            const checkbox = row.querySelector('.hes-partida-checkbox');
            if (checkbox && checkbox.checked) {
                const contractPartidaId = parseInt(checkbox.dataset.contract-partida-id);
                const cantidadEjecutada = parseFloat(row.querySelector('.hes-partida-cantidad-ejecutada').value) || 0;
                const originalQuantityFromTable = parseFloat(row.children[2].textContent.split(' ')[0]);
                const umdFromTable = row.children[2].textContent.split(' ')[1];
                const precioUnitarioFromTable = parseFloat(row.children[3].textContent);

                if (cantidadEjecutada <= 0) {
                    showToast(`La cantidad ejecutada para la partida "${row.children[1].textContent}" debe ser mayor que cero.`, 'warning');
                    throw new Error("Cantidad ejecutada debe ser mayor que cero."); // Detener el proceso
                }

                selectedHesPartidas.push({
                    contractPartidaId: contractPartidaId,
                    descripcion: row.children[1].textContent, // Tomar descripción de la tabla
                    cantidadOriginal: originalQuantityFromTable, // Cantidad original de la partida del contrato
                    cantidadEjecutada: cantidadEjecutada,
                    umd: umdFromTable,
                    precioUnitario: precioUnitarioFromTable,
                    totalPartidaHes: parseFloat(row.querySelector('.total-hes-partida').textContent) || 0
                });
            }
        });

        if (selectedHesPartidas.length === 0) {
            showToast("Debe seleccionar al menos una partida para la HES y asegurar que su cantidad ejecutada sea mayor a cero.", "warning");
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

            // Guardar partidas de HES
            await db.hesPartidas.where({ hesId: hesId }).delete();
            for (const partida of selectedHesPartidas) {
                partida.hesId = hesId; // Asociar la partida a la HES recién creada/actualizada
                await db.hesPartidas.add(partida);
            }
            
            clearHesFormBtn.click();
            loadHesList();
            updateSummaryCards(); // Para que el avance financiero se actualice
            // No cambiamos de pestaña automáticamente para que el usuario pueda seguir creando HES
        } catch (error) {
            console.error("Error al guardar/actualizar la HES:", error);
            showToast("Error al guardar/actualizar la HES: " + error.message, "error");
        }
    });

    document.getElementById('hes-anexos').addEventListener('change', (e) => {
        const fileInput = e.target;
        const infoSpan = document.getElementById('hes-anexos-info');
        if (fileInput.files.length > 0) {
            infoSpan.textContent = `${fileInput.files.length} archivo(s) seleccionado(s)`;
        } else {
            infoSpan.textContent = 'Ningún archivo seleccionado';
        }
    });

    async function loadHesList() {
        hesListBody.innerHTML = '';
        const allHes = await db.hes.toArray();

        if (allHes.length === 0) {
            hesListBody.innerHTML = `<tr><td colspan="8" class="text-center">No hay HES registradas.</td></tr>`;
            return;
        }

        for (const hes of allHes) {
            const contract = await db.contracts.get(hes.contractId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contract ? (contract.numeroSICAC || '-') : 'Contrato Eliminado'}</td>
                <td>${hes.noHes}</td>
                <td>${hes.fechaInicioHes || '-'}</td>
                <td>${hes.fechaFinalHes || '-'}</td>
                <td>${hes.totalHes ? hes.totalHes.toFixed(2) : '0.00'} ${contract ? (contract.moneda || 'USD') : 'USD'}</td>
                <td>${hes.aprobado}</td>
                <td>${hes.ejecutada ? '<i class="fas fa-check-circle text-success"></i> Sí' : '<i class="fas fa-times-circle text-danger"></i> No'}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-hes-btn" data-id="${hes.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-hes-btn" data-id="${hes.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            hesListBody.appendChild(row);
        }
    }

    hesListBody.addEventListener('click', async (e) => {
        const targetBtn = e.target.closest('button');
        if (!targetBtn) return;

        const hesId = parseInt(targetBtn.dataset.id);

        if (targetBtn.classList.contains('edit-hes-btn')) {
            const hes = await db.hes.get(hesId);
            if (hes) {
                currentHesId = hesId;
                hesContractSelect.value = hes.contractId;
                hesNoHesInput.value = hes.noHes || '';
                hesFechaInicioInput.value = hes.fechaInicioHes || '';
                hesFechaFinalInput.value = hes.fechaFinalHes || '';
                hesAprobadoSelect.value = hes.aprobado || 'No';
                hesTextoHesTextarea.value = hes.textoHes || '';
                hesEjecutadaCheckbox.checked = hes.ejecutada || false;
                hesFechaCreadoInput.value = hes.fechaCreadoHes || '';
                hesFechaAprobadoInput.value = hes.fechaAprobadoHes || '';
                hesTextoBreveInput.value = hes.textoBreveHes || '';
                hesValuacionInput.value = hes.valuacion || '';
                hesLugarPrestacionServicioInput.value = hes.lugarPrestacionServicio || '';
                hesResponsableSdoInput.value = hes.responsableSdo || '';
                hesValuadoCheckbox.checked = hes.valuado || false;
                hesSubtotalInput.value = hes.subTotalHes !== undefined ? hes.subTotalHes.toFixed(2) : '0.00';
                hesGastosAdministrativosInput.value = hes.gastosAdministrativosHes !== undefined ? hes.gastosAdministrativosHes.toFixed(2) : '0.00';
                hesTotalInput.value = hes.totalHes !== undefined ? hes.totalHes.toFixed(2) : '0.00';

                // Cargar partidas de HES existentes
                await hesContractSelect.dispatchEvent(new Event('change')); // Esto recarga las partidas base del contrato
                const hesPartidas = await db.hesPartidas.where({ hesId: hesId }).toArray();

                hesPartidasTableBody.querySelectorAll('tr').forEach(row => {
                    const checkbox = row.querySelector('.hes-partida-checkbox');
                    const contractPartidaId = parseInt(checkbox.dataset.contractPartidaId);
                    const hesPartida = hesPartidas.find(hp => hp.contractPartidaId === contractPartidaId);
                    if (hesPartida) {
                        checkbox.checked = true;
                        const cantidadInput = row.querySelector('.hes-partida-cantidad-ejecutada');
                        cantidadInput.disabled = false;
                        cantidadInput.value = hesPartida.cantidadEjecutada.toFixed(2);
                        row.querySelector('.total-hes-partida').textContent = hesPartida.totalPartidaHes.toFixed(2);
                    } else {
                        checkbox.checked = false;
                        row.querySelector('.hes-partida-cantidad-ejecutada').disabled = true;
                        row.querySelector('.hes-partida-cantidad-ejecutada').value = '0.00';
                        row.querySelector('.total-hes-partida').textContent = '0.00';
                    }
                });
                updateHesPartidaTotals();

                showToast("HES cargada para edición.", "info");
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
                    updateSummaryCards();
                } catch (error) {
                    console.error("Error al enviar HES a la papelera:", error);
                    showToast("Error al enviar la HES a la papelera: " + error.message, "error");
                }
            }
        }
    });

    // --- Lógica de Papelera de Reciclaje ---

    async function loadTrashCan() {
        deletedContractsBody.innerHTML = '';
        deletedHesBody.innerHTML = '';

        const trashItems = await db.trash.toArray();

        if (trashItems.length === 0) {
            deletedContractsBody.innerHTML = `<tr><td colspan="5" class="text-center">La papelera de contratos está vacía.</td></tr>`;
            deletedHesBody.innerHTML = `<tr><td colspan="5" class="text-center">La papelera de HES está vacía.</td></tr>`;
            return;
        }

        trashItems.forEach(item => {
            const row = document.createElement('tr');
            let details = '';
            let bodyToAppend;

            if (item.type === 'contract') {
                details = `N° Prov: ${item.data.numeroProveedor || '-'}, SICAC: ${item.data.numeroSICAC || '-'}, Monto: ${item.data.montoTotalContrato ? item.data.montoTotalContrato.toFixed(2) : '0.00'} ${item.data.moneda || 'USD'}`;
                bodyToAppend = deletedContractsBody;
            } else if (item.type === 'hes') {
                details = `N° HES: ${item.data.noHes || '-'}, Contrato ID: ${item.data.contractId || '-'}, Monto: ${item.data.totalHes ? item.data.totalHes.toFixed(2) : '0.00'} USD`; // Moneda no está en HES directamente
                bodyToAppend = deletedHesBody;
            }

            row.innerHTML = `
                <td>${item.type === 'contract' ? 'Contrato' : 'HES'}</td>
                <td>${item.originalId}</td>
                <td>${details}</td>
                <td>${new Date(item.deletedAt).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-success restore-btn" data-id="${item.id}" data-type="${item.type}"><i class="fas fa-undo"></i></button>
                    <button class="btn btn-sm btn-danger permanent-delete-btn" data-id="${item.id}" data-type="${item.type}"><i class="fas fa-times"></i></button>
                </td>
            `;
            bodyToAppend.appendChild(row);
        });
    }

    document.addEventListener('click', async (e) => {
        const targetBtn = e.target.closest('button');
        if (!targetBtn) return;

        if (targetBtn.classList.contains('restore-btn')) {
            const itemId = parseInt(targetBtn.dataset.id);
            const itemType = targetBtn.dataset.type;

            if (confirm(`¿Está seguro de que desea restaurar este ${itemType === 'contract' ? 'contrato' : 'HES'}?`)) {
                try {
                    const trashItem = await db.trash.get(itemId);
                    if (!trashItem) {
                        showToast("Elemento no encontrado en la papelera.", "error");
                        return;
                    }

                    if (itemType === 'contract') {
                        await db.contracts.add(trashItem.data);
                        // Restaurar partidas asociadas
                        const originalPartidas = await db.trash.where({ type: 'partida', originalId: trashItem.originalId, relatedTo: 'contract' }).toArray();
                        for (const p of originalPartidas) {
                            await db.partidas.add(p.data);
                            await db.trash.delete(p.id); // Eliminar de papelera
                        }
                        // Restaurar HES asociadas que fueron eliminadas con el contrato
                        const originalHes = await db.trash.where({ type: 'hes', relatedToContract: trashItem.originalId }).toArray();
                        for (const h of originalHes) {
                            await db.hes.add(h.data);
                            await db.trash.delete(h.id); // Eliminar de papelera
                            const originalHesPartidas = await db.trash.where({ type: 'hesPartida', originalId: h.originalId, relatedTo: 'hes' }).toArray();
                             for (const hp of originalHesPartidas) {
                                await db.hesPartidas.add(hp.data);
                                await db.trash.delete(hp.id);
                            }
                        }

                    } else if (itemType === 'hes') {
                        await db.hes.add(trashItem.data);
                        // Restaurar partidas de HES asociadas
                        const originalHesPartidas = await db.trash.where({ type: 'hesPartida', originalId: trashItem.originalId, relatedTo: 'hes' }).toArray();
                        for (const hp of originalHesPartidas) {
                            await db.hesPartidas.add(hp.data);
                            await db.trash.delete(hp.id);
                        }
                    }

                    await db.trash.delete(itemId);
                    showToast(`${itemType === 'contract' ? 'Contrato' : 'HES'} restaurado exitosamente.`, "success");
                    loadTrashCan();
                    loadContractList();
                    loadHesList();
                    updateSummaryCards();
                } catch (error) {
                    console.error(`Error al restaurar ${itemType}:`, error);
                    showToast(`Error al restaurar el ${itemType}: ${error.message}`, "error");
                }
            }
        } else if (targetBtn.classList.contains('permanent-delete-btn')) {
            const itemId = parseInt(targetBtn.dataset.id);
            const itemType = targetBtn.dataset.type;

            if (confirm(`¡Advertencia! ¿Está seguro de que desea ELIMINAR PERMANENTEMENTE este ${itemType === 'contract' ? 'contrato' : 'HES'}? Esta acción no se puede deshacer.`)) {
                try {
                    await db.trash.delete(itemId);
                    showToast(`${itemType === 'contract' ? 'Contrato' : 'HES'} eliminado permanentemente.`, "success");
                    loadTrashCan();
                } catch (error) {
                    console.error(`Error al eliminar permanentemente ${itemType}:`, error);
                    showToast(`Error al eliminar permanentemente el ${itemType}: ${error.message}`, "error");
                }
            }
        }
    });

    // --- Lógica de Avance Físico ---

    physicalAdvanceContractSelect.addEventListener('change', async () => {
        const contractId = parseInt(physicalAdvanceContractSelect.value);
        if (!contractId) {
            physicalAdvanceDetails.style.display = 'none';
            return;
        }

        physicalAdvanceDetails.style.display = 'block';
        const contract = await db.contracts.get(contractId);
        if (!contract) {
            physicalAdvanceDetails.style.display = 'none';
            showToast("Contrato no encontrado para avance físico.", "error");
            return;
        }

        paContractSicac.textContent = contract.numeroSICAC || '-';
        paContractTotal.textContent = `${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`;

        const contractPartidas = await db.partidas.where({ contractId: contractId }).toArray();
        let totalOriginalQuantity = 0;
        let totalExecutedQuantity = 0;

        paPartidasBody.innerHTML = '';
        if (contractPartidas.length === 0) {
            paPartidasBody.innerHTML = `<tr><td colspan="5" class="text-center">Este contrato no tiene partidas registradas.</td></tr>`;
        }

        for (const partida of contractPartidas) {
            const executedQuantity = await getExecutedQuantityForContractPartida(contractId, partida.id);
            const percentage = (partida.cantidad > 0) ? (executedQuantity / partida.cantidad) * 100 : 0;

            totalOriginalQuantity += partida.cantidad;
            totalExecutedQuantity += executedQuantity;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${partida.descripcion}</td>
                <td>${partida.cantidad.toFixed(2)}</td>
                <td>${executedQuantity.toFixed(2)}</td>
                <td>${partida.umd || '-'}</td>
                <td><div class="progress"><div class="progress-bar bg-info" style="width: ${percentage}%">${percentage.toFixed(1)}%</div></div></td>
            `;
            paPartidasBody.appendChild(row);
        }

        const globalPhysicalPercentage = (totalOriginalQuantity > 0) ? (totalExecutedQuantity / totalOriginalQuantity) * 100 : 0;
        paPhysicalGlobalPercentage.textContent = `${globalPhysicalPercentage.toFixed(1)}%`;
        paPhysicalGlobalProgressBar.style.width = `${globalPhysicalPercentage}%`;
        paPhysicalGlobalProgressBar.textContent = `${globalPhysicalPercentage.toFixed(1)}%`;
    });

    // Función auxiliar para obtener la cantidad ejecutada de una partida específica de un contrato
    async function getExecutedQuantityForContractPartida(contractId, contractPartidaId, excludeHesId = null) {
        let totalExecuted = 0;
        const allHesForContract = await db.hes.where({ contractId: contractId }).toArray();
        for (const hes of allHesForContract) {
            if (hes.ejecutada && hes.id !== excludeHesId) { // Solo si la HES está ejecutada y no es la HES que estamos editando actualmente (si aplica)
                const hesPartidas = await db.hesPartidas.where({ hesId: hes.id, contractPartidaId: contractPartidaId }).toArray();
                hesPartidas.forEach(hp => {
                    totalExecuted += hp.cantidadEjecutada;
                });
            }
        }
        return totalExecuted;
    }

    // --- Lógica de Avance Financiero ---

    financialAdvanceContractSelect.addEventListener('change', async () => {
        const contractId = parseInt(financialAdvanceContractSelect.value);
        if (!contractId) {
            financialAdvanceDetails.style.display = 'none';
            return;
        }

        financialAdvanceDetails.style.display = 'block';
        const contract = await db.contracts.get(contractId);
        if (!contract) {
            financialAdvanceDetails.style.display = 'none';
            showToast("Contrato no encontrado para avance financiero.", "error");
            return;
        }

        faContractSicac.textContent = contract.numeroSICAC || '-';
        faContractTotal.textContent = `${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`;

        let totalExecutedAmount = 0;
        const hesForContract = await db.hes.where({ contractId: contractId }).toArray();

        faHesListBody.innerHTML = '';
        if (hesForContract.length === 0) {
            faHesListBody.innerHTML = `<tr><td colspan="5" class="text-center">No hay HES registradas para este contrato.</td></tr>`;
        }

        for (const hes of hesForContract) {
            if (hes.ejecutada) {
                totalExecutedAmount += (hes.totalHes || 0);
            }
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${hes.noHes || '-'}</td>
                <td>${hes.fechaAprobadoHes || '-'}</td>
                <td>${hes.textoBreveHes || '-'}</td>
                <td>${hes.totalHes ? hes.totalHes.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}</td>
                <td>${hes.ejecutada ? '<i class="fas fa-check-circle text-success"></i> Sí' : '<i class="fas fa-times-circle text-danger"></i> No'}</td>
            `;
            faHesListBody.appendChild(row);
        }

        faExecutedAmount.textContent = `${totalExecutedAmount.toFixed(2)} ${contract.moneda || 'USD'}`;

        const globalFinancialPercentage = (contract.montoTotalContrato > 0) ? (totalExecutedAmount / contract.montoTotalContrato) * 100 : 0;
        faFinancialGlobalPercentage.textContent = `${globalFinancialPercentage.toFixed(1)}%`;
        faFinancialGlobalProgressBar.style.width = `${globalFinancialPercentage}%`;
        faFinancialGlobalProgressBar.textContent = `${globalFinancialPercentage.toFixed(1)}%`;
    });

    // Función para calcular ambos avances para la lista de contratos
    async function calculateContractAdvances(contractId) {
        const contract = await db.contracts.get(contractId);
        if (!contract) return { physicalAdvancePercentage: 0, financialAdvancePercentage: 0 };

        // Cálculo de Avance Físico
        const contractPartidas = await db.partidas.where({ contractId: contractId }).toArray();
        let totalOriginalQuantity = 0;
        let totalExecutedQuantity = 0;
        for (const partida of contractPartidas) {
            const executedQuantity = await getExecutedExecutedQuantityForContractPartida(contractId, partida.id); // Usar la función ya definida
            totalOriginalQuantity += partida.cantidad;
            totalExecutedQuantity += executedQuantity;
        }
        const physicalAdvancePercentage = (totalOriginalQuantity > 0) ? (totalExecutedQuantity / totalOriginalQuantity) * 100 : 0;

        // Cálculo de Avance Financiero
        let totalExecutedAmount = 0;
        const hesForContract = await db.hes.where({ contractId: contractId, ejecutada: true }).toArray();
        hesForContract.forEach(hes => {
            totalExecutedAmount += (hes.totalHes || 0);
        });
        const financialAdvancePercentage = (contract.montoTotalContrato > 0) ? (totalExecutedAmount / contract.montoTotalContrato) * 100 : 0;

        return { physicalAdvancePercentage, financialAdvancePercentage };
    }

    // Renombrar la función para evitar conflictos y ser más explícita
    async function getExecutedExecutedQuantityForContractPartida(contractId, contractPartidaId) {
        let totalExecuted = 0;
        const allHesForContract = await db.hes.where({ contractId: contractId }).toArray();
        for (const hes of allHesForContract) {
            if (hes.ejecutada) {
                const hesPartidas = await db.hesPartidas.where({ hesId: hes.id, contractPartidaId: contractPartidaId }).toArray();
                hesPartidas.forEach(hp => {
                    totalExecuted += hp.cantidadEjecutada;
                });
            }
        }
        return totalExecuted;
    }


    // --- Lógica de Resumen Gráfico (Charts) ---

    async function renderCharts() {
        const allContracts = await db.contracts.toArray();

        // Chart 1: Contratos por Estatus
        const statusCounts = allContracts.reduce((acc, contract) => {
            const status = contract.estatusContrato || 'Desconocido';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        const statusLabels = Object.keys(statusCounts);
        const statusData = Object.values(statusCounts);
        const statusColors = ['#007bff', '#6c757d', '#28a745', '#ffc107', '#dc3545', '#17a2b8']; // Azul, Gris, Verde, Amarillo, Rojo, Cyan

        if (contractStatusChartInstance) {
            contractStatusChartInstance.destroy();
        }
        contractStatusChartInstance = new Chart(contractStatusChartCanvas, {
            type: 'pie',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusData,
                    backgroundColor: statusColors.slice(0, statusLabels.length),
                    borderColor: '#fff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += context.parsed + ' contratos';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });

        // Chart 2: Contratos por Modalidad de Contratación
        const modalityCounts = allContracts.reduce((acc, contract) => {
            const modality = contract.modalidadContratacion || 'Desconocida';
            acc[modality] = (acc[modality] || 0) + 1;
            return acc;
        }, {});

        const modalityLabels = Object.keys(modalityCounts);
        const modalityData = Object.values(modalityCounts);
        const modalityColors = ['#fd7e14', '#6610f2', '#20c997', '#e83e8c', '#6f42c1']; // Naranja, Púrpura, Teal, Rosa, Índigo

        if (contractModalityChartInstance) {
            contractModalityChartInstance.destroy();
        }
        contractModalityChartInstance = new Chart(contractModalityChartCanvas, {
            type: 'bar',
            data: {
                labels: modalityLabels,
                datasets: [{
                    label: 'Número de Contratos',
                    data: modalityData,
                    backgroundColor: modalityColors.slice(0, modalityLabels.length),
                    borderColor: '#fff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0 // Mostrar números enteros
                        }
                    }
                }
            }
        });
    }

    // --- Lógica de Informes ---

    reportContractSelect.addEventListener('change', async () => {
        const contractId = parseInt(reportContractSelect.value);
        reportDetails.style.display = 'none';
        reportHesDetailView.style.display = 'none'; // Ocultar detalle de HES al cambiar de contrato

        if (!contractId) {
            return;
        }

        reportDetails.style.display = 'block';
        const contract = await db.contracts.get(contractId);
        if (!contract) {
            reportDetails.style.display = 'none';
            showToast("Contrato no encontrado para informe.", "error");
            return;
        }

        reportContractSicac.textContent = contract.numeroSICAC || '-';
        reportContractTotal.textContent = `${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`;

        let totalContractedAmount = contract.montoTotalContrato || 0;
        let totalConsumedAmount = 0;

        const hesForContract = await db.hes.where({ contractId: contractId, ejecutada: true }).toArray();
        hesForContract.forEach(hes => {
            totalConsumedAmount += (hes.totalHes || 0);
        });

        reportConsumedAmount.textContent = `${totalConsumedAmount.toFixed(2)} ${contract.moneda || 'USD'}`;
        reportRemainingAmount.textContent = `${(totalContractedAmount - totalConsumedAmount).toFixed(2)} ${contract.moneda || 'USD'}`;

        // Consumo de Partidas
        reportPartidasConsumoBody.innerHTML = '';
        const contractPartidas = await db.partidas.where({ contractId: contractId }).toArray();

        if (contractPartidas.length === 0) {
            reportPartidasConsumoBody.innerHTML = `<tr><td colspan="9" class="text-center">Este contrato no tiene partidas registradas.</td></tr>`;
        }

        for (const partida of contractPartidas) {
            const executedQuantity = await getExecutedExecutedQuantityForContractPartida(contractId, partida.id);
            const remainingQuantity = partida.cantidad - executedQuantity;
            const totalExecutedPartida = executedQuantity * partida.precioUnitario;
            const totalRemainingPartida = remainingQuantity * partida.precioUnitario;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${partida.descripcion}</td>
                <td>${partida.cantidad.toFixed(2)}</td>
                <td>${executedQuantity.toFixed(2)}</td>
                <td>${remainingQuantity.toFixed(2)}</td>
                <td>${partida.umd || '-'}</td>
                <td>${partida.precioUnitario.toFixed(2)}</td>
                <td>${partida.total.toFixed(2)}</td>
                <td>${totalExecutedPartida.toFixed(2)}</td>
                <td>${totalRemainingPartida.toFixed(2)}</td>
            `;
            reportPartidasConsumoBody.appendChild(row);
        }

        // Lista de HES
        reportHesListBody.innerHTML = '';
        if (hesForContract.length === 0) {
            reportHesListBody.innerHTML = `<tr><td colspan="7" class="text-center">No hay HES ejecutadas para este contrato.</td></tr>`;
        }
        for (const hes of hesForContract) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${hes.noHes || '-'}</td>
                <td>${hes.fechaInicioHes || '-'}</td>
                <td>${hes.fechaFinalHes || '-'}</td>
                <td>${hes.totalHes ? hes.totalHes.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}</td>
                <td>${hes.aprobado}</td>
                <td>${hes.ejecutada ? '<i class="fas fa-check-circle text-success"></i> Sí' : '<i class="fas fa-times-circle text-danger"></i> No'}</td>
                <td><button class="btn btn-sm btn-info view-hes-report-btn" data-id="${hes.id}"><i class="fas fa-eye"></i> Ver Detalle</button></td>
            `;
            reportHesListBody.appendChild(row);
        }
    });

    reportHesListBody.addEventListener('click', async (e) => {
        const targetBtn = e.target.closest('.view-hes-report-btn');
        if (!targetBtn) return;

        const hesId = parseInt(targetBtn.dataset.id);
        const hes = await db.hes.get(hesId);
        if (!hes) {
            showToast("HES no encontrada para detalles.", "error");
            return;
        }

        reportHesDetailView.style.display = 'block';
        reportHesDetailNo.textContent = hes.noHes || '-';

        // Calcular avance físico y financiero de la HES
        const contract = await db.contracts.get(hes.contractId);
        let totalHesPartidasExecutedQuantity = 0; // Cantidad ejecutada real de partidas HES
        let totalOriginalPartidaQuantityInHes = 0; // Cantidad original de las partidas que se incluyen en la HES
        let totalHesPartidasAmount = 0;

        const hesPartidas = await db.hesPartidas.where({ hesId: hesId }).toArray();

        // Para avance físico de la HES
        for (const hesPartida of hesPartidas) {
            const contractPartida = await db.partidas.get(hesPartida.contractPartidaId);
            if (contractPartida) {
                 totalHesPartidasExecutedQuantity += hesPartida.cantidadEjecutada;
                 totalOriginalPartidaQuantityInHes += contractPartida.cantidad; // Sumamos la cantidad original de la partida del contrato
            }
            totalHesPartidasAmount += hesPartida.totalPartidaHes;
        }

        // Avance Físico de la HES: Se calcula como la proporción de la cantidad ejecutada en esta HES respecto a la cantidad total de las partidas de contrato involucradas en esta HES.
        const hesPhysicalPercentage = (totalOriginalPartidaQuantityInHes > 0) ? (totalHesPartidasExecutedQuantity / totalOriginalPartidaQuantityInHes) * 100 : 0;
        reportHesPhysicalPercentage.textContent = `${hesPhysicalPercentage.toFixed(1)}%`;
        reportHesPhysicalProgressBar.style.width = `${hesPhysicalPercentage}%`;
        reportHesPhysicalProgressBar.textContent = `${hesPhysicalPercentage.toFixed(1)}%`;

        // Avance Financiero de la HES: Simplemente el porcentaje del total de la HES respecto al total del contrato.
        const hesFinancialPercentage = (contract && contract.montoTotalContrato > 0) ? (hes.totalHes / contract.montoTotalContrato) * 100 : 0;
        reportHesFinancialPercentage.textContent = `${hesFinancialPercentage.toFixed(1)}%`;
        reportHesFinancialProgressBar.style.width = `${hesFinancialPercentage}%`;
        reportHesFinancialProgressBar.textContent = `${hesFinancialPercentage.toFixed(1)}%`;

        // Listar partidas de la HES
        reportHesPartidasBody.innerHTML = '';
        if (hesPartidas.length === 0) {
            reportHesPartidasBody.innerHTML = `<tr><td colspan="5" class="text-center">Esta HES no tiene partidas registradas.</td></tr>`;
        }

        hesPartidas.forEach(hp => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${hp.descripcion}</td>
                <td>${hp.cantidadEjecutada.toFixed(2)}</td>
                <td>${hp.umd || '-'}</td>
                <td>${hp.precioUnitario.toFixed(2)}</td>
                <td>${hp.totalPartidaHes.toFixed(2)}</td>
            `;
            reportHesPartidasBody.appendChild(row);
        });
    });


    // --- Funcionalidades de Exportación ---

    exportExcelBtn.addEventListener('click', async () => {
        try {
            const contracts = await db.contracts.toArray();
            const data = [];
            data.push([
                "N° Proveedor", "N° SICAC", "Fecha Firma Contrato", "Fecha Creación", "Fecha Inicio", "Fecha Terminación",
                "Período Culminación (Días)", "División/Área", "EEMN", "Región", "Naturaleza Contratación",
                "Línea de Servicio", "No. Petición Oferta", "Modalidad Contratación", "Régimen Laboral",
                "Objeto Contractual", "Fecha Cambio Alcance", "Monto Original", "Monto Modificado",
                "Monto Total Contrato", "Moneda", "N° Contrato Interno", "Observaciones", "Estatus Contrato",
                "Avance Físico Global (%)", "Avance Financiero Global (%)"
            ]);

            for (const contract of contracts) {
                const { physicalAdvancePercentage, financialAdvancePercentage } = await calculateContractAdvances(contract.id);
                data.push([
                    contract.numeroProveedor || '',
                    contract.numeroSICAC || '',
                    contract.fechaFirmaContrato || '',
                    contract.fechaCreado || '',
                    contract.fechaInicio || '',
                    contract.fechaTerminacion || '',
                    contract.periodoCulminacion || 0,
                    contract.divisionArea || '',
                    contract.eemn || '',
                    contract.region || '',
                    contract.naturalezaContratacion || '',
                    contract.lineaServicio || '',
                    contract.noPeticionOferta || '',
                    contract.modalidadContratacion || '',
                    contract.regimenLaboral || '',
                    contract.objetoContractual || '',
                    contract.fechaCambioAlcance || '',
                    (contract.montoOriginal || 0).toFixed(2),
                    (contract.montoModificado || 0).toFixed(2),
                    (contract.montoTotalContrato || 0).toFixed(2),
                    contract.moneda || 'USD',
                    contract.numeroContratoInterno || '',
                    contract.observaciones || '',
                    contract.estatusContrato || '',
                    physicalAdvancePercentage.toFixed(1),
                    financialAdvancePercentage.toFixed(1)
                ]);

                // Añadir partidas del contrato
                const partidas = await db.partidas.where({ contractId: contract.id }).toArray();
                if (partidas.length > 0) {
                    data.push(["", "", "--- Partidas del Contrato ---"]);
                    data.push(["", "", "Descripción", "Cantidad", "UMD", "Precio Unitario", "Total Partida"]);
                    partidas.forEach(p => {
                        data.push([
                            "", "",
                            p.descripcion || '',
                            p.cantidad || 0,
                            p.umd || '',
                            (p.precioUnitario || 0).toFixed(2),
                            (p.total || 0).toFixed(2)
                        ]);
                    });
                    data.push(["", ""]); // Línea en blanco para separar contratos
                }

                // Añadir HES del contrato
                const hesList = await db.hes.where({ contractId: contract.id }).toArray();
                if (hesList.length > 0) {
                    data.push(["", "", "--- HES del Contrato ---"]);
                    data.push(["", "", "N° HES", "Fecha Inicio HES", "Fecha Final HES", "Aprobado", "Ejecutada", "Texto Breve", "Total HES"]);
                    for (const hes of hesList) {
                        data.push([
                            "", "",
                            hes.noHes || '',
                            hes.fechaInicioHes || '',
                            hes.fechaFinalHes || '',
                            hes.aprobado || '',
                            hes.ejecutada ? 'Sí' : 'No',
                            hes.textoBreveHes || '',
                            (hes.totalHes || 0).toFixed(2)
                        ]);

                        // Añadir partidas de la HES
                        const hesPartidas = await db.hesPartidas.where({ hesId: hes.id }).toArray();
                        if (hesPartidas.length > 0) {
                            data.push(["", "", "", "--- Partidas de la HES ---"]);
                            data.push(["", "", "", "Descripción", "Cant. Ejecutada", "UMD", "Precio Unitario", "Total Partida HES"]);
                            hesPartidas.forEach(hp => {
                                data.push([
                                    "", "", "",
                                    hp.descripcion || '',
                                    hp.cantidadEjecutada || 0,
                                    hp.umd || '',
                                    (hp.precioUnitario || 0).toFixed(2),
                                    (hp.totalPartidaHes || 0).toFixed(2)
                                ]);
                            });
                        }
                    }
                    data.push(["", ""]); // Línea en blanco para separar contratos
                }
            }

            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Contratos_Sigescon");
            XLSX.writeFile(wb, "Contratos_Sigescon.xlsx");
            showToast("Datos exportados a Excel exitosamente.", "success");
        } catch (error) {
            console.error("Error al exportar a Excel:", error);
            showToast("Error al exportar a Excel: " + error.message, "error");
        }
    });

    exportPdfBtn.addEventListener('click', async () => {
        try {
            const contracts = await db.contracts.toArray();
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'pt', 'letter');
            let y = 40;
            const margin = 40;
            const lineHeight = 12;

            doc.setFontSize(18);
            doc.text("Informe de Contratos Sigescon", margin, y);
            y += 30;

            for (const contract of contracts) {
                doc.setFontSize(14);
                doc.text(`Contrato: ${contract.numeroSICAC || '-'} (N° Proveedor: ${contract.numeroProveedor || '-'})`, margin, y);
                y += 20;

                const contractDetails = [
                    [`Fecha Firma: ${contract.fechaFirmaContrato || '-'}`, `Fecha Inicio: ${contract.fechaInicio || '-'}`],
                    [`Fecha Terminación: ${contract.fechaTerminacion || '-'}`, `Período Culminación: ${contract.periodoCulminacion || 0} días`],
                    [`Monto Original: ${contract.montoOriginal ? contract.montoOriginal.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`, `Monto Modificado: ${contract.montoModificado ? contract.montoModificado.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`],
                    [`Monto Total: ${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`, `Estatus: ${contract.estatusContrato || '-'}`],
                    [`Objeto Contractual: ${contract.objetoContractual || '-'}`, '']
                ];

                doc.autoTable({
                    startY: y,
                    head: [],
                    body: contractDetails,
                    theme: 'grid',
                    styles: { fontSize: 10, cellPadding: 5 },
                    columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 'auto' } }
                });
                y = doc.autoTable.previous.finalY + 10;

                // Partidas del Contrato
                const partidas = await db.partidas.where({ contractId: contract.id }).toArray();
                if (partidas.length > 0) {
                    doc.setFontSize(12);
                    doc.text("Partidas del Contrato:", margin, y);
                    y += 15;

                    const partidaData = partidas.map(p => [
                        p.descripcion || '',
                        p.cantidad || 0,
                        p.umd || '',
                        (p.precioUnitario || 0).toFixed(2),
                        (p.total || 0).toFixed(2)
                    ]);
                    doc.autoTable({
                        startY: y,
                        head: [['Descripción', 'Cantidad', 'UMD', 'Precio Unitario', 'Total']],
                        body: partidaData,
                        theme: 'grid',
                        styles: { fontSize: 9, cellPadding: 4 },
                        headStyles: { fillColor: [0, 123, 255] }
                    });
                    y = doc.autoTable.previous.finalY + 10;
                }

                // HES del Contrato
                const hesList = await db.hes.where({ contractId: contract.id }).toArray();
                if (hesList.length > 0) {
                    doc.setFontSize(12);
                    doc.text("HES Registradas:", margin, y);
                    y += 15;

                    const hesData = hesList.map(hes => [
                        hes.noHes || '',
                        hes.fechaInicioHes || '',
                        hes.fechaFinalHes || '',
                        hes.aprobado || '',
                        hes.ejecutada ? 'Sí' : 'No',
                        (hes.totalHes || 0).toFixed(2)
                    ]);
                    doc.autoTable({
                        startY: y,
                        head: [['N° HES', 'Fecha Inicio', 'Fecha Final', 'Aprobado', 'Ejecutada', 'Total HES']],
                        body: hesData,
                        theme: 'grid',
                        styles: { fontSize: 9, cellPadding: 4 },
                        headStyles: { fillColor: [0, 123, 255] }
                    });
                    y = doc.autoTable.previous.finalY + 10;

                    for (const hes of hesList) {
                        const hesPartidas = await db.hesPartidas.where({ hesId: hes.id }).toArray();
                        if (hesPartidas.length > 0) {
                            doc.setFontSize(10);
                            doc.text(`Partidas de HES ${hes.noHes}:`, margin + 10, y);
                            y += 15;

                            const hesPartidaData = hesPartidas.map(hp => [
                                hp.descripcion || '',
                                hp.cantidadEjecutada || 0,
                                hp.umd || '',
                                (hp.precioUnitario || 0).toFixed(2),
                                (hp.totalPartidaHes || 0).toFixed(2)
                            ]);
                            doc.autoTable({
                                startY: y,
                                head: [['Descripción', 'Cant. Ejecutada', 'UMD', 'Precio Unitario', 'Total Partida']],
                                body: hesPartidaData,
                                theme: 'striped',
                                styles: { fontSize: 8, cellPadding: 3 },
                                headStyles: { fillColor: [173, 216, 230], textColor: [0,0,0] } // Light blue for sub-table headers
                            });
                            y = doc.autoTable.previous.finalY + 10;
                        }
                    }
                }
                // Añadir salto de página si hay más contratos y espacio limitado
                if (contracts.indexOf(contract) < contracts.length - 1) {
                    if (y > doc.internal.pageSize.height - margin - 50) { // If less than 50pt remaining space, add new page
                        doc.addPage();
                        y = margin;
                    } else {
                        y += 20; // Add some space between contracts if no new page
                    }
                }
            }
            doc.save("Informe_Contratos_Sigescon.pdf");
            showToast("Informe PDF generado exitosamente.", "success");

        } catch (error) {
            console.error("Error al exportar a PDF:", error);
            showToast("Error al exportar a PDF: " + error.message, "error");
        }
    });


    // --- Inicialización al cargar la página ---
    // Activa la primera pestaña por defecto
    tabButtons[0].click();
    updateSummaryCards(); // Asegura que el resumen se carga al inicio

document.addEventListener("DOMContentLoaded", function () {
  const selectModalidad = document.getElementById("modalidad-contratacion");
  const btnGuardar = document.getElementById("btn-guardar");
  const btnCancelar = document.getElementById("btn-cancelar");

});