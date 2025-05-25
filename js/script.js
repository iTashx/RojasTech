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
    const montoOriginalInput = document.getElementById('monto-original');
    const montoModificadoInput = document.getElementById('monto-modificado');
    const montoTotalContratoInput = document.getElementById('monto-total-contrato');

    // NUEVOS ELEMENTOS DEL DOM PARA EL SELECTOR DE CONTRATOS
    const existingContractSelect = document.getElementById('existing-contract-select');
    const loadContractBtn = document.getElementById('load-contract-btn');

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

    // Botones de exportación de informes
    const generateIndividualReportPdfBtn = document.getElementById('generate-individual-report-pdf-btn');
    const generateGeneralReportPdfBtn = document.getElementById('generate-general-report-pdf-btn');

    // Elementos de la Modalidad de Contratación (Modal)
    const addModalidadBtn = document.getElementById('add-modalidad-btn');
    const removeModalidadBtn = document.getElementById('remove-modalidad-btn');
    const newModalidadInput = document.getElementById('new-modalidad-input');
    const addModalidadToListBtn = document.getElementById('add-modalidad-to-list-btn');
    const modalidadesList = document.getElementById('modalidades-list');

    // --- Elementos para la integración con Gemini API ---
    const generateSummaryBtn = document.getElementById('generate-summary-btn');
    const objetoContractualTextarea = document.getElementById('objeto-contractual');
    const generatedSummaryTextarea = document.getElementById('generated-summary');
    const summaryLoadingIndicator = document.getElementById('summary-loading-indicator');

    let currentContractId = null; // Para edición de contratos
    let currentHesId = null; // Para edición de HES

    // --- Función para mostrar mensajes emergentes (Toasts) ---
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        // Si no existe, crea un contenedor de toasts simple para depuración
        if (!toastContainer) {
            const body = document.body;
            const newToastContainer = document.createElement('div');
            newToastContainer.id = 'toast-container';
            newToastContainer.style.position = 'fixed';
            newToastContainer.style.bottom = '20px';
            newToastContainer.style.right = '20px';
            newToastContainer.style.zIndex = '1050'; // Bootstrap modal z-index is 1050
            newToastContainer.style.display = 'flex';
            newToastContainer.style.flexDirection = 'column';
            newToastContainer.style.gap = '10px';
            body.appendChild(newToastContainer);
            // Vuelve a obtener la referencia después de crearla
            const toastContainer = document.getElementById('toast-container');
        }

        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`; // Clase CSS para el estilo del toast
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
                // Al entrar en la pestaña de Nuevo/Editar Contrato
                await populateExistingContractsSelect(); 
                if (!currentContractId) {
                    clearContractFormBtn.click(); 
                }
            } else if (targetId === 'hes-management') {
                await populateContractSelect(hesContractSelect);
                await loadHesList();
                if (!currentHesId) { 
                    hesFechaCreadoInput.value = new Date().toISOString().split('T')[0];
                }
            } else if (targetId === 'trash-can') {
                await loadTrashCan();
            } else if (targetId === 'physical-advance') {
                await populateContractSelect(physicalAdvanceContractSelect);
                physicalAdvanceDetails.style.display = 'none'; 
            } else if (targetId === 'financial-advance') {
                await populateContractSelect(financialAdvanceContractSelect);
                financialAdvanceDetails.style.display = 'none'; 
            } else if (targetId === 'graphic-summary') {
                await renderCharts();
            } else if (targetId === 'reports') {
                await populateContractSelect(reportContractSelect);
                reportDetails.style.display = 'none';
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
            const start = new Date(fechaInicio + 'T00:00:00'); 
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
        montoOriginalInput.value = '0.00'; 
        montoModificadoInput.value = '0.00'; 
        montoTotalContratoInput.value = '0.00'; 
        existingContractSelect.value = ''; 
        generatedSummaryTextarea.value = ''; // Limpiar el resumen generado por IA
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
            modalidadContratacion: modalityContratacionSelect.value,
            regimenLaboral: document.getElementById('regimen-laboral').value,
            objetoContractual: objetoContractualTextarea.value, // Usar la referencia correcta
            generatedSummary: generatedSummaryTextarea.value, // Guardar el resumen generado por IA
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
            await db.partidas.where({ contractId: contractId }).delete(); // Eliminar partidas antiguas
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
            populateExistingContractsSelect(); 
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

    // --- NUEVAS FUNCIONES PARA EL SELECTOR DE CONTRATOS EXISTENTES ---

    // Función para poblar el selector de contratos existentes
    async function populateExistingContractsSelect() {
        existingContractSelect.innerHTML = '<option value="">-- Seleccione un Contrato --</option>';
        try {
            const contracts = await db.contracts.toArray();
            contracts.forEach(contract => {
                const option = document.createElement('option');
                option.value = contract.id;
                option.textContent = `${contract.numeroSICAC || 'N/A'} - ${contract.numeroProveedor || 'Sin Proveedor'}`;
                existingContractSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al poblar el selector de contratos existentes:", error);
            showToast("Error al cargar contratos para selección.", "error");
        }
    }

    // Event listener para el botón "Cargar Contrato"
    loadContractBtn.addEventListener('click', async () => {
        const selectedContractId = parseInt(existingContractSelect.value);
        if (!selectedContractId) {
            showToast("Por favor, seleccione un contrato de la lista.", "warning");
            clearContractFormBtn.click(); 
            return;
        }

        try {
            const contract = await db.contracts.get(selectedContractId);
            if (contract) {
                fillContractForm(contract);
                currentContractId = selectedContractId; 
                showToast(`Contrato ${contract.numeroSICAC || contract.numeroProveedor} cargado para edición.`, "info");
            } else {
                showToast("Contrato no encontrado.", "error");
                clearContractFormBtn.click();
            }
        } catch (error) {
            console.error("Error al cargar el contrato para edición:", error);
            showToast("Error al cargar el contrato: " + error.message, "error");
        }
    });

    // Función auxiliar para rellenar el formulario de contrato
    async function fillContractForm(contract) {
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
        modalidadContratacionSelect.value = contract.modalidadContratacion || ''; 
        document.getElementById('regimen-laboral').value = contract.regimenLaboral || '';
        objetoContractualTextarea.value = contract.objetoContractual || ''; // Usar la referencia correcta
        generatedSummaryTextarea.value = contract.generatedSummary || ''; // Cargar el resumen generado por IA
        document.getElementById('fecha-cambio-alcance').value = contract.fechaCambioAlcance || '';
        montoOriginalInput.value = contract.montoOriginal !== undefined ? contract.montoOriginal.toFixed(2) : '0.00';
        montoModificadoInput.value = contract.montoModificado !== undefined ? contract.montoModificado.toFixed(2) : '0.00';
        montoTotalContratoInput.value = contract.montoTotalContrato !== undefined ? contract.montoTotalContrato.toFixed(2) : '0.00';
        document.getElementById('numero-contrato-interno').value = contract.numeroContratoInterno || '';
        document.getElementById('observaciones').value = contract.observaciones || '';
        document.getElementById('estatus-contrato').value = contract.estatusContrato || 'Activo';
        document.getElementById('moneda').value = contract.moneda || 'USD';

        // Cargar y mostrar las partidas asociadas
        partidasTableBody.innerHTML = '';
        const partidas = await db.partidas.where({ contractId: contract.id }).toArray();
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

        existingContractSelect.value = contract.id;
    }


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
                fillContractForm(contract); 
                currentContractId = contractId;
                showToast("Contrato cargado para edición.", "info");
                tabButtons.forEach(btn => {
                    if (btn.getAttribute('data-target') === 'new-edit-contract') {
                        btn.click();
                    }
                });
            }
        } else if (targetBtn.classList.contains('delete-contract-btn')) {
            showConfirmModal('¿Está seguro de que desea enviar este contrato a la papelera?', async () => {
                try {
                    const contractToDelete = await db.contracts.get(contractId);
                    await db.trash.add({
                        originalId: contractId,
                        type: 'contract',
                        data: contractToDelete,
                        deletedAt: new Date().toISOString()
                    });
                    await db.contracts.delete(contractId);
                    
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
                    await db.partidas.where({ contractId: contractId }).delete(); 

                    showToast("Contrato enviado a la papelera exitosamente.", "success");
                    loadContractList();
                    updateSummaryCards();
                } catch (error) {
                    console.error("Error al enviar contrato a la papelera:", error);
                    showToast("Error al enviar el contrato a la papelera: " + error.message, "error");
                }
            });
        }
    });

    // --- Lógica de Gestión de HES ---

    // Poblar select de contratos para HES y otros selectores de contrato
    async function populateContractSelect(selectElement) {
        selectElement.innerHTML = '<option value="">Seleccione un Contrato</option>';
        try {
            const contracts = await db.contracts.toArray();
            contracts.forEach(contract => {
                const option = document.createElement('option');
                option.value = contract.id;
                option.textContent = `${contract.numeroSICAC} (${contract.numeroProveedor})`;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error("Error al poblar el selector de contratos:", error);
            showToast("Error al cargar contratos para selección.", "error");
        }
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

        const { physicalAdvancePercentage, financialAdvancePercentage } = await calculateContractAdvances(contractId);

        if (physicalAdvancePercentage >= 100 && financialAdvancePercentage >= 100) {
            hesPartidasInfo.textContent = '¡Este contrato ya ha alcanzado el 100% de avance físico y financiero!';
            hesPartidasInfo.classList.remove('alert-info');
            hesPartidasInfo.classList.add('alert-warning');
            clearHesPartidaTotals();
            return;
        } else {
            hesPartidasInfo.classList.remove('alert-warning');
            hesPartidasInfo.classList.add('alert-info');
            hesPartidasInfo.style.display = 'none'; 
        }

        try {
            const contractPartidas = await db.partidas.where({ contractId: contractId }).toArray();
            if (contractPartidas.length === 0) {
                hesPartidasInfo.textContent = 'No hay partidas registradas para este contrato.';
                hesPartidasInfo.style.display = 'block';
                clearHesPartidaTotals();
                return;
            }

            const existingHesForContract = await db.hes.where({ contractId: contractId }).toArray();
            const hesPartidasForContract = await db.hesPartidas.filter(hp => 
                existingHesForContract.some(hes => hes.id === hp.hesId)
            ).toArray();

            const executedQuantities = {};
            hesPartidasForContract.forEach(hp => {
                executedQuantities[hp.contractPartidaId] = (executedQuantities[hp.contractPartidaId] || 0) + hp.cantidadEjecutada;
            });

            contractPartidas.forEach(partida => {
                const cantidadEjecutadaEnOtrasHes = executedQuantities[partida.id] || 0;
                const cantidadDisponible = partida.cantidad - cantidadEjecutadaEnOtrasHes;

                const row = document.createElement('tr');
                row.dataset.partidaId = partida.id; 
                row.innerHTML = `
                    <td>${partida.id}</td>
                    <td>${partida.descripcion}</td>
                    <td>${partida.umd}</td>
                    <td>${partida.precioUnitario.toFixed(2)}</td>
                    <td>${partida.cantidad.toFixed(2)}</td>
                    <td>${cantidadEjecutadaEnOtrasHes.toFixed(2)}</td>
                    <td>${cantidadDisponible.toFixed(2)}</td>
                    <td><input type="number" class="form-control hes-cantidad-ejecutar" value="0.00" step="0.01" min="0" max="${cantidadDisponible}"></td>
                    <td><span class="hes-total-partida">0.00</span></td>
                `;
                hesPartidasTableBody.appendChild(row);
            });
            updateHesPartidaTotals(); 
        } catch (error) {
            console.error("Error al cargar partidas del contrato para HES:", error);
            showToast("Error al cargar partidas para HES.", "error");
        }
    });

    // Delegación de eventos para input en tabla de HES
    hesPartidasTableBody.addEventListener('input', (e) => {
        if (e.target.classList.contains('hes-cantidad-ejecutar')) {
            updateHesPartidaTotals(e.target.closest('tr'));
        }
    });

    function updateHesPartidaTotals(row = null) {
        let subtotalHes = 0;
        const rows = row ? [row] : hesPartidasTableBody.children;

        Array.from(rows).forEach(r => {
            const cantidadEjecutar = parseFloat(r.querySelector('.hes-cantidad-ejecutar').value) || 0;
            const precioUnitario = parseFloat(r.children[3].textContent) || 0; 
            const totalPartidaHes = cantidadEjecutar * precioUnitario;
            r.querySelector('.hes-total-partida').textContent = totalPartidaHes.toFixed(2);
            subtotalHes += totalPartidaHes;
        });

        hesSubtotalInput.value = subtotalHes.toFixed(2);
        const gastosAdministrativos = subtotalHes * 0.05;
        hesGastosAdministrativosInput.value = gastosAdministrativos.toFixed(2);
        hesTotalInput.value = (subtotalHes + gastosAdministrativos).toFixed(2);
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
        hesAnexosInfoSpan.textContent = 'Ningún archivo seleccionado';
        currentHesId = null;
        hesPartidasInfo.style.display = 'block';
        hesPartidasInfo.textContent = 'Seleccione un contrato para cargar sus partidas.';
        hesPartidasInfo.classList.remove('alert-warning');
        hesPartidasInfo.classList.add('alert-info');
        clearHesPartidaTotals();
        populateContractSelect(hesContractSelect); 
        hesFechaCreadoInput.value = new Date().toISOString().split('T')[0]; 
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
            lugarPrestacionService: hesLugarPrestacionServicioInput.value,
            responsableSdo: hesResponsableSdoInput.value,
            subTotalHes: parseFloat(hesSubtotalInput.value) || 0,
            gastosAdministrativosHes: parseFloat(hesGastosAdministrativosInput.value) || 0,
            totalHes: parseFloat(hesTotalInput.value) || 0,
        };

        if (!hesData.noHes || !hesData.fechaInicioHes || !hesData.fechaFinalHes) {
            showToast("Por favor, complete los campos obligatorios de HES: N° HES, Fecha Inicio HES y Fecha Final HES.", "warning");
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

            // Guardar partidas de la HES
            await db.hesPartidas.where({ hesId: hesId }).delete(); 
            const hesPartidaRows = hesPartidasTableBody.querySelectorAll('tr');
            for (const row of hesPartidaRows) {
                const contractPartidaId = parseInt(row.dataset.partidaId);
                const cantidadEjecutada = parseFloat(row.querySelector('.hes-cantidad-ejecutar').value) || 0;
                const totalPartidaHes = parseFloat(row.querySelector('.hes-total-partida').textContent) || 0;

                const hesPartida = {
                    hesId: hesId,
                    contractPartidaId: contractPartidaId,
                    descripcion: row.children[1].textContent, 
                    cantidadOriginal: parseFloat(row.children[4].textContent) || 0, 
                    cantidadEjecutada: cantidadEjecutada,
                    umd: row.children[2].textContent,
                    precioUnitario: parseFloat(row.children[3].textContent) || 0,
                    totalPartidaHes: totalPartidaHes
                };
                await db.hesPartidas.add(hesPartida);
            }

            clearHesFormBtn.click();
            loadHesList();
            updateSummaryCards(); 
        } catch (error) {
            console.error("Error al guardar/actualizar la HES:", error);
            showToast("Error al guardar/actualizar la HES: " + error.message, "error");
        }
    });

    // Cargar lista de HES
    async function loadHesList() {
        hesListBody.innerHTML = '';
        try {
            const hesList = await db.hes.toArray();
            if (hesList.length === 0) {
                hesListBody.innerHTML = `<tr><td colspan="7" class="text-center">No hay HES registradas.</td></tr>`;
                return;
            }

            for (const hes of hesList) {
                const contract = await db.contracts.get(hes.contractId);
                const contractDisplay = contract ? `${contract.numeroSICAC || '-'} (${contract.numeroProveedor || 'Sin Proveedor'})` : 'Contrato Eliminado';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${contractDisplay}</td>
                    <td>${hes.noHes}</td>
                    <td>${hes.fechaInicioHes}</td>
                    <td>${hes.fechaFinalHes}</td>
                    <td>${hes.totalHes ? hes.totalHes.toFixed(2) : '0.00'}</td>
                    <td>${hes.aprobado}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-hes-btn" data-id="${hes.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger delete-hes-btn" data-id="${hes.id}"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                hesListBody.appendChild(row);
            }
        } catch (error) {
            console.error("Error al cargar la lista de HES:", error);
            showToast("Error al cargar la lista de HES.", "error");
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
                hesContractSelect.value = hes.contractId;
                hesContractSelect.dispatchEvent(new Event('change'));

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
                hesSubtotalInput.value = hes.subTotalHes !== undefined ? hes.subTotalHes.toFixed(2) : '0.00';
                hesGastosAdministrativosInput.value = hes.gastosAdministrativosHes !== undefined ? hes.gastosAdministrativosHes.toFixed(2) : '0.00';
                hesTotalInput.value = hes.totalHes !== undefined ? hes.totalHes.toFixed(2) : '0.00';
                hesValuadoCheckbox.checked = hes.valuado || false; 
                
                setTimeout(async () => {
                    const hesPartidas = await db.hesPartidas.where({ hesId: hesId }).toArray();
                    hesPartidas.forEach(hp => {
                        const row = hesPartidasTableBody.querySelector(`tr[data-partida-id="${hp.contractPartidaId}"]`);
                        if (row) {
                            row.querySelector('.hes-cantidad-ejecutar').value = hp.cantidadEjecutada.toFixed(2);
                        }
                    });
                    updateHesPartidaTotals(); 
                }, 100); 

                currentHesId = hesId;
                showToast("HES cargada para edición.", "info");
                tabButtons.forEach(btn => {
                    if (btn.getAttribute('data-target') === 'hes-management') {
                        btn.click();
                    }
                });
            }
        } else if (targetBtn.classList.contains('delete-hes-btn')) {
            showConfirmModal('¿Está seguro de que desea enviar esta HES a la papelera?', async () => {
                try {
                    const hesToDelete = await db.hes.get(hesId);
                    await db.trash.add({
                        originalId: hesId,
                        type: 'hes',
                        data: hesToDelete,
                        deletedAt: new Date().toISOString()
                    });
                    await db.hes.delete(hesId);
                    await db.hesPartidas.where({ hesId: hesId }).delete(); 
                    showToast("HES enviada a la papelera exitosamente.", "success");
                    loadHesList();
                    updateSummaryCards();
                } catch (error) {
                    console.error("Error al enviar HES a la papelera:", error);
                    showToast("Error al enviar la HES a la papelera: " + error.message, "error");
                }
            });
        }
    });

    // --- Lógica de Avance Físico y Financiero ---

    // Calcula el avance físico y financiero para un contrato
    async function calculateContractAdvances(contractId) {
        let physicalAdvancePercentage = 0;
        let financialAdvancePercentage = 0;

        try {
            const contract = await db.contracts.get(contractId);
            if (!contract) return { physicalAdvancePercentage: 0, financialAdvancePercentage: 0 };

            const contractPartidas = await db.partidas.where({ contractId: contractId }).toArray();
            const hesList = await db.hes.where({ contractId: contractId }).toArray();
            const hesPartidasList = await db.hesPartidas.filter(hp => hesList.some(hes => hes.id === hp.hesId)).toArray();

            // Cálculo de Avance Físico
            let totalContractQuantity = 0;
            let totalExecutedQuantity = 0;

            contractPartidas.forEach(partida => {
                totalContractQuantity += partida.cantidad;
                const executedForPartida = hesPartidasList
                    .filter(hp => hp.contractPartidaId === partida.id)
                    .reduce((sum, hp) => sum + hp.cantidadEjecutada, 0);
                totalExecutedQuantity += executedForPartida;
            });

            if (totalContractQuantity > 0) {
                physicalAdvancePercentage = (totalExecutedQuantity / totalContractQuantity) * 100;
            }

            // Cálculo de Avance Financiero
            let totalContractAmount = contract.montoTotalContrato || 0;
            let totalHesAmount = hesList.reduce((sum, hes) => sum + hes.totalHes, 0);

            if (totalContractAmount > 0) {
                financialAdvancePercentage = (totalHesAmount / totalContractAmount) * 100;
            }

        } catch (error) {
            console.error(`Error al calcular avances para el contrato ${contractId}:`, error);
            showToast("Error al calcular avances del contrato.", "error");
        }

        return { physicalAdvancePercentage, financialAdvancePercentage };
    }

    physicalAdvanceContractSelect.addEventListener('change', async () => {
        const contractId = parseInt(physicalAdvanceContractSelect.value);
        if (!contractId) {
            physicalAdvanceDetails.style.display = 'none';
            return;
        }

        try {
            const contract = await db.contracts.get(contractId);
            if (!contract) {
                showToast("Contrato no encontrado para avance físico.", "error");
                physicalAdvanceDetails.style.display = 'none';
                return;
            }

            paContractSicac.textContent = contract.numeroSICAC || '-';
            paContractTotal.textContent = `${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`;

            const { physicalAdvancePercentage } = await calculateContractAdvances(contractId);
            paPhysicalGlobalPercentage.textContent = `${physicalAdvancePercentage.toFixed(1)}%`;
            paPhysicalGlobalProgressBar.style.width = `${physicalAdvancePercentage}%`;
            paPhysicalGlobalProgressBar.setAttribute('aria-valuenow', physicalAdvancePercentage);

            paPartidasBody.innerHTML = '';
            const contractPartidas = await db.partidas.where({ contractId: contractId }).toArray();
            const hesList = await db.hes.where({ contractId: contractId }).toArray();
            const hesPartidasList = await db.hesPartidas.filter(hp => hesList.some(hes => hes.id === hp.hesId)).toArray();

            contractPartidas.forEach(partida => {
                const executedForPartida = hesPartidasList
                    .filter(hp => hp.contractPartidaId === partida.id)
                    .reduce((sum, hp) => sum + hp.cantidadEjecutada, 0);
                const partidaAdvance = partida.cantidad > 0 ? (executedForPartida / partida.cantidad) * 100 : 0;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${partida.descripcion}</td>
                    <td>${partida.cantidad.toFixed(2)}</td>
                    <td>${executedForPartida.toFixed(2)}</td>
                    <td>${partidaAdvance.toFixed(1)}%</td>
                `;
                paPartidasBody.appendChild(row);
            });

            physicalAdvanceDetails.style.display = 'block';

        } catch (error) {
            console.error("Error al cargar avance físico:", error);
            showToast("Error al cargar avance físico.", "error");
            physicalAdvanceDetails.style.display = 'none';
        }
    });

    financialAdvanceContractSelect.addEventListener('change', async () => {
        const contractId = parseInt(financialAdvanceContractSelect.value);
        if (!contractId) {
            financialAdvanceDetails.style.display = 'none';
            return;
        }

        try {
            const contract = await db.contracts.get(contractId);
            if (!contract) {
                showToast("Contrato no encontrado para avance financiero.", "error");
                financialAdvanceDetails.style.display = 'none';
                return;
            }

            faContractSicac.textContent = contract.numeroSICAC || '-';
            faContractTotal.textContent = `${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`;

            const hesList = await db.hes.where({ contractId: contractId }).toArray();
            const totalHesAmount = hesList.reduce((sum, hes) => sum + hes.totalHes, 0);
            faExecutedAmount.textContent = `${totalHesAmount.toFixed(2)} ${contract.moneda || 'USD'}`;

            const { financialAdvancePercentage } = await calculateContractAdvances(contractId);
            faFinancialGlobalPercentage.textContent = `${financialAdvancePercentage.toFixed(1)}%`;
            faFinancialGlobalProgressBar.style.width = `${financialAdvancePercentage}%`;
            faFinancialGlobalProgressBar.setAttribute('aria-valuenow', financialAdvancePercentage);

            faHesListBody.innerHTML = '';
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

            financialAdvanceDetails.style.display = 'block';

        } catch (error) {
            console.error("Error al cargar avance financiero:", error);
            showToast("Error al cargar avance financiero.", "error");
            financialAdvanceDetails.style.display = 'none';
        }
    });

    // --- Lógica de Resumen Gráfico ---
    async function renderCharts() {
        try {
            const allContracts = await db.contracts.toArray();

            // Gráfico de Estatus de Contratos
            const statusCounts = allContracts.reduce((acc, contract) => {
                const status = contract.estatusContrato || 'Desconocido';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});

            const statusLabels = Object.keys(statusCounts);
            const statusData = Object.values(statusCounts);
            const statusColors = ['#4CAF50', '#FFC107', '#F44336', '#2196F3', '#9E9E9E']; // Verde, Amarillo, Rojo, Azul, Gris

            if (contractStatusChartInstance) {
                contractStatusChartInstance.destroy();
            }
            contractStatusChartInstance = new Chart(contractStatusChartCanvas, {
                type: 'pie',
                data: {
                    labels: statusLabels,
                    datasets: [{
                        data: statusData,
                        backgroundColor: statusLabels.map((_, i) => statusColors[i % statusColors.length]),
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
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
            const modalityCounts = allContracts.reduce((acc, contract) => {
                const modality = contract.modalidadContratacion || 'Desconocido';
                acc[modality] = (acc[modality] || 0) + 1;
                return acc;
            }, {});

            const modalityLabels = Object.keys(modalityCounts);
            const modalityData = Object.values(modalityCounts);
            const modalityColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

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
                        backgroundColor: modalityLabels.map((_, i) => modalityColors[i % modalityColors.length]),
                        borderColor: modalityLabels.map((_, i) => modalityColors[i % modalityColors.length]).map(color => color.replace('0.2', '1')),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
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
                                precision: 0
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error("Error al renderizar gráficos:", error);
            showToast("Error al cargar los gráficos de resumen.", "error");
        }
    }

    // --- Lógica de Informes ---

    reportContractSelect.addEventListener('change', async () => {
        const contractId = parseInt(reportContractSelect.value);
        if (!contractId) {
            reportDetails.style.display = 'none';
            return;
        }

        try {
            const contract = await db.contracts.get(contractId);
            if (!contract) {
                showToast("Contrato no encontrado para informe.", "error");
                reportDetails.style.display = 'none';
                return;
            }

            reportContractSicac.textContent = contract.numeroSICAC || '-';
            reportContractTotal.textContent = `${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`;

            const contractPartidas = await db.partidas.where({ contractId: contractId }).toArray();
            const hesList = await db.hes.where({ contractId: contractId }).toArray();
            const hesPartidasList = await db.hesPartidas.filter(hp => hesList.some(hes => hes.id === hp.hesId)).toArray();

            let totalConsumedAmount = 0;
            reportPartidasConsumoBody.innerHTML = '';

            for (const partida of contractPartidas) {
                const consumedQuantity = hesPartidasList
                    .filter(hp => hp.contractPartidaId === partida.id)
                    .reduce((sum, hp) => sum + hp.cantidadEjecutada, 0);
                
                const remainingQuantity = partida.cantidad - consumedQuantity;
                const consumedAmount = consumedQuantity * partida.precioUnitario;
                const remainingAmount = remainingQuantity * partida.precioUnitario;

                totalConsumedAmount += consumedAmount;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${partida.descripcion}</td>
                    <td>${partida.cantidad.toFixed(2)} ${partida.umd}</td>
                    <td>${consumedQuantity.toFixed(2)} ${partida.umd}</td>
                    <td>${remainingQuantity.toFixed(2)} ${partida.umd}</td>
                    <td>${consumedAmount.toFixed(2)} ${contract.moneda || 'USD'}</td>
                    <td>${remainingAmount.toFixed(2)} ${contract.moneda || 'USD'}</td>
                `;
                reportPartidasConsumoBody.appendChild(row);
            }

            reportConsumedAmount.textContent = `${totalConsumedAmount.toFixed(2)} ${contract.moneda || 'USD'}`;
            reportRemainingAmount.textContent = `${(contract.montoTotalContrato - totalConsumedAmount).toFixed(2)} ${contract.moneda || 'USD'}`;

            // Mostrar HES asociadas
            reportHesListBody.innerHTML = '';
            if (hesList.length > 0) {
                hesList.forEach(hes => {
                    const hesRow = document.createElement('tr');
                    hesRow.innerHTML = `
                        <td>${hes.noHes}</td>
                        <td>${hes.fechaInicioHes}</td>
                        <td>${hes.fechaFinalHes}</td>
                        <td>${hes.totalHes.toFixed(2)}</td>
                        <td>${hes.aprobado}</td>
                        <td><button class="btn btn-sm btn-info view-hes-detail-btn" data-id="${hes.id}">Ver Detalle</button></td>
                    `;
                    reportHesListBody.appendChild(hesRow);
                });
            } else {
                reportHesListBody.innerHTML = `<tr><td colspan="6" class="text-center">No hay HES asociadas a este contrato.</td></tr>`;
            }

            reportDetails.style.display = 'block';

        } catch (error) {
            console.error("Error al cargar informe individual:", error);
            showToast("Error al cargar informe individual.", "error");
            reportDetails.style.display = 'none';
        }
    });

    // --- Funciones de Exportación (Excel y PDF) ---

    // Exportar a Excel (Lista de Contratos)
    exportExcelBtn.addEventListener('click', async () => {
        try {
            const contracts = await db.contracts.toArray();
            if (contracts.length === 0) {
                showToast("No hay contratos para exportar a Excel.", "warning");
                return;
            }

            const data = [];
            // Encabezados
            data.push([
                'N° Proveedor', 'N° SICAC', 'Fecha Firma Contrato', 'Fecha Creado', 'Fecha Inicio',
                'Fecha Terminación', 'Periodo Culminación (Días)', 'División/Área', 'EEMN', 'Región',
                'Naturaleza Contratación', 'Línea de Servicio', 'No. Petición de Oferta',
                'Modalidad Contratación', 'Régimen Laboral', 'Objeto Contractual', 'Fecha Cambio Alcance',
                'Monto Original', 'Monto Modificado', 'Monto Total Contrato', 'N° Contrato Interno',
                'Observaciones', 'Estatus', 'Moneda', 'Avance Físico (%)', 'Avance Financiero (%)', 'Resumen Generado por IA'
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
                    contract.montoOriginal || 0,
                    contract.montoModificado || 0,
                    contract.montoTotalContrato || 0,
                    contract.numeroContratoInterno || '',
                    contract.observaciones || '',
                    contract.estatusContrato || '',
                    contract.moneda || '',
                    physicalAdvancePercentage.toFixed(1),
                    financialAdvancePercentage.toFixed(1),
                    contract.generatedSummary || '' // Incluir el resumen generado por IA
                ]);
            }

            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Contratos");
            XLSX.writeFile(wb, "Sigescon_Contratos.xlsx");
            showToast("Datos de contratos exportados a Excel.", "success");

        } catch (error) {
            console.error("Error al exportar a Excel:", error);
            showToast("Error al exportar a Excel: " + error.message, "error");
        }
    });

    // Exportar a PDF (Lista de Contratos)
    exportPdfBtn.addEventListener('click', async () => {
        try {
            const contracts = await db.contracts.toArray();
            if (contracts.length === 0) {
                showToast("No hay contratos para exportar a PDF.", "warning");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape'); 

            const tableColumn = [
                "N° Proveedor", "N° SICAC", "Fecha Inicio", "Monto Total",
                "Avance Físico (%)", "Avance Financiero (%)", "Estatus"
            ];
            const tableRows = [];

            for (const contract of contracts) {
                const { physicalAdvancePercentage, financialAdvancePercentage } = await calculateContractAdvances(contract.id);
                tableRows.push([
                    contract.numeroProveedor || '',
                    contract.numeroSICAC || '',
                    contract.fechaInicio || '',
                    `${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`,
                    physicalAdvancePercentage.toFixed(1),
                    financialAdvancePercentage.toFixed(1),
                    contract.estatusContrato || ''
                ]);
            }

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 25 }, 
                    1: { cellWidth: 25 }, 
                    2: { cellWidth: 25 }, 
                    3: { cellWidth: 30 }, 
                    4: { cellWidth: 30 }, 
                    5: { cellWidth: 35 }, 
                    6: { cellWidth: 25 }, 
                },
                didDrawPage: function (data) {
                    doc.text("Lista de Contratos SIGESCON", data.settings.margin.left, 15);
                }
            });

            doc.save('Sigescon_Contratos.pdf');
            showToast("Datos de contratos exportados a PDF.", "success");

        } catch (error) {
            console.error("Error al exportar a PDF:", error);
            showToast("Error al exportar a PDF: " + error.message, "error");
        }
    });


    // --- Papelera de Reciclaje ---
    async function loadTrashCan() {
        deletedContractsBody.innerHTML = '';
        deletedHesBody.innerHTML = '';

        try {
            const deletedItems = await db.trash.toArray();

            const deletedContracts = deletedItems.filter(item => item.type === 'contract');
            if (deletedContracts.length === 0) {
                deletedContractsBody.innerHTML = `<tr><td colspan="5" class="text-center">No hay contratos eliminados.</td></tr>`;
            } else {
                deletedContracts.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><input type="checkbox" class="delete-checkbox" data-id="${item.id}" data-type="contract"></td>
                        <td>${item.data.numeroProveedor || '-'}</td>
                        <td>${item.data.numeroSICAC || '-'}</td>
                        <td>${new Date(item.deletedAt).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-success restore-item-btn" data-id="${item.id}" data-type="contract"><i class="fas fa-undo"></i></button>
                            <button class="btn btn-sm btn-danger delete-item-permanent-btn" data-id="${item.id}" data-type="contract"><i class="fas fa-fire"></i></button>
                        </td>
                    `;
                    deletedContractsBody.appendChild(row);
                });
            }

            const deletedHes = deletedItems.filter(item => item.type === 'hes');
            if (deletedHes.length === 0) {
                deletedHesBody.innerHTML = `<tr><td colspan="5" class="text-center">No hay HES eliminadas.</td></tr>`;
            } else {
                deletedHes.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><input type="checkbox" class="delete-checkbox" data-id="${item.id}" data-type="hes"></td>
                        <td>${item.data.contractId ? `ID:${item.data.contractId}` : '-'}</td>
                        <td>${item.data.noHes || '-'}</td>
                        <td>${new Date(item.deletedAt).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-success restore-item-btn" data-id="${item.id}" data-type="hes"><i class="fas fa-undo"></i></button>
                            <button class="btn btn-sm btn-danger delete-item-permanent-btn" data-id="${item.id}" data-type="hes"><i class="fas fa-fire"></i></button>
                        </td>
                    `;
                    deletedHesBody.appendChild(row);
                });
            }

        } catch (error) {
            console.error("Error al cargar la papelera de reciclaje:", error);
            showToast("Error al cargar la papelera de reciclaje.", "error");
        }
    }

    // Restaurar y Eliminar Permanentemente (Delegación de eventos en papelera)
    document.getElementById('trash-can').addEventListener('click', async (e) => {
        const targetBtn = e.target.closest('button');
        if (!targetBtn) return;

        const itemId = parseInt(targetBtn.dataset.id);
        const itemType = targetBtn.dataset.type;

        if (targetBtn.classList.contains('restore-item-btn')) {
            showConfirmModal(`¿Está seguro de que desea restaurar este ${itemType}?`, async () => {
                try {
                    const itemToRestore = await db.trash.get(itemId);
                    if (itemToRestore) {
                        if (itemToRestore.type === 'contract') {
                            await db.contracts.add(itemToRestore.data);
                            const originalPartidas = await db.partidas.where({ contractId: itemToRestore.originalId }).toArray();
                            for (const p of originalPartidas) {
                                await db.partidas.add({ ...p, contractId: itemToRestore.data.id }); 
                            }
                            const relatedHesInTrash = await db.trash.where({ type: 'hes', 'data.contractId': itemToRestore.originalId }).toArray();
                            for (const hesItem of relatedHesInTrash) {
                                await db.hes.add(hesItem.data);
                                const originalHesPartidas = await db.hesPartidas.where({ hesId: hesItem.originalId }).toArray();
                                for (const hp of originalHesPartidas) {
                                    await db.hesPartidas.add({ ...hp, hesId: hesItem.data.id });
                                }
                                await db.trash.delete(hesItem.id); 
                            }
                        } else if (itemToRestore.type === 'hes') {
                            await db.hes.add(itemToRestore.data);
                            const originalHesPartidas = await db.hesPartidas.where({ hesId: itemToRestore.originalId }).toArray();
                            for (const hp of originalHesPartidas) {
                                await db.hesPartidas.add({ ...hp, hesId: itemToRestore.data.id });
                            }
                        }
                        await db.trash.delete(itemId);
                        showToast(`${itemType === 'contract' ? 'Contrato' : 'HES'} restaurado exitosamente.`, "success");
                        loadTrashCan();
                        loadContractList(); 
                        loadHesList();
                        updateSummaryCards();
                    }
                } catch (error) {
                    console.error(`Error al restaurar ${itemType}:`, error);
                    showToast(`Error al restaurar ${itemType}: ` + error.message, "error");
                }
            });
        } else if (targetBtn.classList.contains('delete-item-permanent-btn')) {
            showConfirmModal(`¿Está seguro de que desea ELIMINAR PERMANENTEMENTE este ${itemType}? Esta acción no se puede deshacer.`, async () => {
                try {
                    await db.trash.delete(itemId);
                    showToast(`${itemType === 'contract' ? 'Contrato' : 'HES'} eliminado permanentemente.`, "success");
                    loadTrashCan();
                } catch (error) {
                    console.error(`Error al eliminar permanentemente ${itemType}:`, error);
                    showToast(`Error al eliminar permanentemente ${itemType}: ` + error.message, "error");
                }
            });
        }
    });

    // Seleccionar todos en la papelera
    document.getElementById('select-all-deleted-contracts').addEventListener('change', (e) => {
        const checkboxes = deletedContractsBody.querySelectorAll('.delete-checkbox[data-type="contract"]');
        checkboxes.forEach(checkbox => checkbox.checked = e.target.checked);
    });

    document.getElementById('select-all-deleted-hes').addEventListener('change', (e) => {
        const checkboxes = deletedHesBody.querySelectorAll('.delete-checkbox[data-type="hes"]');
        checkboxes.forEach(checkbox => checkbox.checked = e.target.checked);
    });

    // Restaurar seleccionados
    document.getElementById('restore-selected-btn').addEventListener('click', async (e) => { 
        const selectedContractCheckboxes = deletedContractsBody.querySelectorAll('.delete-checkbox[data-type="contract"]:checked');
        const selectedHesCheckboxes = deletedHesBody.querySelectorAll('.delete-checkbox[data-type="hes']:checked');

        const clickedButtonType = e.target.closest('button').dataset.type;

        let itemsToRestore = [];
        if (clickedButtonType === 'contract') {
            selectedContractCheckboxes.forEach(checkbox => itemsToRestore.push({ id: parseInt(checkbox.dataset.id), type: 'contract' }));
        } else if (clickedButtonType === 'hes') {
            selectedHesCheckboxes.forEach(checkbox => itemsToRestore.push({ id: parseInt(checkbox.dataset.id), type: 'hes' }));
        }


        if (itemsToRestore.length === 0) {
            showToast("No hay elementos seleccionados para restaurar.", "warning");
            return;
        }

        showConfirmModal('¿Está seguro de que desea restaurar los elementos seleccionados?', async () => {
            try {
                for (const item of itemsToRestore) {
                    const itemId = item.id;
                    const itemToRestore = await db.trash.get(itemId);
                    if (itemToRestore) {
                        if (itemToRestore.type === 'contract') {
                            await db.contracts.add(itemToRestore.data);
                            const originalPartidas = await db.partidas.where({ contractId: itemToRestore.originalId }).toArray();
                            for (const p of originalPartidas) {
                                await db.partidas.add({ ...p, contractId: itemToRestore.data.id });
                            }
                            const relatedHesInTrash = await db.trash.where({ type: 'hes', 'data.contractId': itemToRestore.originalId }).toArray();
                            for (const hesItem of relatedHesInTrash) {
                                await db.hes.add(hesItem.data);
                                const originalHesPartidas = await db.hesPartidas.where({ hesId: hesItem.originalId }).toArray();
                                for (const hp of originalHesPartidas) {
                                    await db.hesPartidas.add({ ...hp, hesId: hesItem.data.id });
                                }
                                await db.trash.delete(hesItem.id);
                            }
                        } else if (itemToRestore.type === 'hes') {
                            await db.hes.add(itemToRestore.data);
                            const originalHesPartidas = await db.hesPartidas.where({ hesId: itemToRestore.originalId }).toArray();
                            for (const hp of originalHesPartidas) {
                                await db.hesPartidas.add({ ...hp, hesId: itemToRestore.data.id });
                            }
                        }
                        await db.trash.delete(itemId);
                    }
                }
                showToast("Elementos seleccionados restaurados exitosamente.", "success");
                loadTrashCan();
                loadContractList();
                loadHesList();
                updateSummaryCards();
            } catch (error) {
                console.error("Error al restaurar elementos seleccionados:", error);
                showToast("Error al restaurar elementos seleccionados: " + error.message, "error");
            }
        });
    });

    // Eliminar permanentemente seleccionados
    document.getElementById('delete-selected-permanent-btn').addEventListener('click', async (e) => { 
        const selectedContractCheckboxes = deletedContractsBody.querySelectorAll('.delete-checkbox[data-type="contract"]:checked');
        const selectedHesCheckboxes = deletedHesBody.querySelectorAll('.delete-checkbox[data-type="hes"]:checked');

        const clickedButtonType = e.target.closest('button').dataset.type;

        let itemsToDelete = [];
        if (clickedButtonType === 'contract') {
            selectedContractCheckboxes.forEach(checkbox => itemsToDelete.push({ id: parseInt(checkbox.dataset.id), type: 'contract' }));
        } else if (clickedButtonType === 'hes') {
            selectedHesCheckboxes.forEach(checkbox => itemsToDelete.push({ id: parseInt(checkbox.dataset.id), type: 'hes' }));
        }

        if (itemsToDelete.length === 0) {
            showToast("No hay elementos seleccionados para eliminar permanentemente.", "warning");
            return;
        }

        showConfirmModal('¿Está seguro de que desea ELIMINAR PERMANENTEMENTE los elementos seleccionados? Esta acción no se puede deshacer.', async () => {
            try {
                for (const item of itemsToDelete) {
                    const itemId = item.id;
                    await db.trash.delete(itemId);
                }
                showToast("Elementos seleccionados eliminados permanentemente.", "success");
                loadTrashCan();
            } catch (error) {
                console.error("Error al eliminar permanentemente elementos seleccionados:", error);
                showToast("Error al eliminar permanentemente elementos seleccionados: " + error.message, "error");
            }
        });
    });


    // --- Lógica de Modalidades de Contratación (Modal) ---
    const addEditModalidadModal = new bootstrap.Modal(document.getElementById('addEditModalidadModal'));

    addModalidadBtn.addEventListener('click', async () => {
        await populateModalidadesList();
        addEditModalidadModal.show();
    });

    addModalidadToListBtn.addEventListener('click', async () => {
        const newModalidad = newModalidadInput.value.trim();
        if (newModalidad) {
            try {
                const existingModalidades = await db.contracts.orderBy('modalidadContratacion').uniqueKeys();
                if (!existingModalidades.includes(newModalidad)) {
                    showToast(`Modalidad "${newModalidad}" añadida a la lista temporal. Guarde un contrato con ella para persistirla.`, "info");
                    const option = document.createElement('option');
                    option.value = newModalidad;
                    option.textContent = newModalidad;
                    modalidadContratacionSelect.appendChild(option);
                    populateModalidadesList(); 
                    newModalidadInput.value = '';
                } else {
                    showToast("La modalidad ya existe.", "warning");
                }
            } catch (error) {
                console.error("Error al añadir modalidad:", error);
                showToast("Error al añadir modalidad.", "error");
            }
        } else {
            showToast("Por favor, ingrese una modalidad.", "warning");
        }
    });

    modalidadesList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('remove-modalidad-item-btn')) {
            const modalidadToRemove = e.target.dataset.modalidad;
            showConfirmModal(`¿Está seguro de que desea eliminar la modalidad "${modalidadToRemove}"? Esto no eliminará contratos que la usen.`, async () => {
                try {
                    const contractsUsingModality = await db.contracts.where('modalidadContratacion').equals(modalidadToRemove).count();
                    if (contractsUsingModality > 0) {
                        showToast(`No se puede eliminar la modalidad "${modalidadToRemove}" porque ${contractsUsingModality} contrato(s) la utilizan.`, "error");
                    } else {
                        const optionToRemove = modalityContratacionSelect.querySelector(`option[value="${modalidadToRemove}"]`);
                        if (optionToRemove) {
                            optionToRemove.remove();
                        }
                        populateModalidadesList(); 
                        showToast(`Modalidad "${modalidadToRemove}" eliminada.`, "success");
                    }
                } catch (error) {
                    console.error("Error al eliminar modalidad:", error);
                    showToast("Error al eliminar modalidad.", "error");
                }
            });
        }
    });

    async function populateModalidadesList() {
        modalidadesList.innerHTML = '';
        try {
            const allModalidades = await db.contracts.orderBy('modalidadContratacion').uniqueKeys();
            
            if (allModalidades.length === 0) {
                modalidadesList.innerHTML = '<li class="list-group-item text-muted">No hay modalidades registradas.</li>';
                return;
            }

            allModalidades.filter(Boolean).forEach(modalidad => { 
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                listItem.innerHTML = `
                    ${modalidad}
                    <button type="button" class="btn btn-danger btn-sm remove-modalidad-item-btn" data-modalidad="${modalidad}">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                modalidadesList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Error al poblar la lista de modalidades:", error);
            showToast("Error al cargar la lista de modalidades.", "error");
        }
    }

    // --- Funciones de Reportes ---

    // Generar PDF de Informe Individual
    generateIndividualReportPdfBtn.addEventListener('click', async () => {
        const contractId = parseInt(reportContractSelect.value);
        if (!contractId) {
            showToast("Seleccione un contrato para generar el informe PDF.", "warning");
            return;
        }

        try {
            const contract = await db.contracts.get(contractId);
            if (!contract) {
                showToast("Contrato no encontrado para informe PDF.", "error");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Título
            doc.setFontSize(18);
            doc.text(`Informe de Contrato: ${contract.numeroSICAC || 'N/A'}`, 14, 22);
            doc.setFontSize(10);
            doc.text(`Proveedor: ${contract.numeroProveedor || 'N/A'}`, 14, 28);
            doc.text(`Objeto Contractual: ${contract.objetoContractual || 'N/A'}`, 14, 34);
            doc.text(`Monto Total Contratado: ${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`, 14, 40);

            // Detalles de Avance
            const contractPartidas = await db.partidas.where({ contractId: contractId }).toArray();
            const hesList = await db.hes.where({ contractId: contractId }).toArray();
            const hesPartidasList = await db.hesPartidas.filter(hp => hesList.some(hes => hes.id === hp.hesId)).toArray();

            let totalConsumedAmount = 0;
            for (const partida of contractPartidas) {
                const consumedQuantity = hesPartidasList
                    .filter(hp => hp.contractPartidaId === partida.id)
                    .reduce((sum, hp) => sum + hp.cantidadEjecutada, 0);
                totalConsumedAmount += (consumedQuantity * partida.precioUnitario);
            }
            const remainingAmount = (contract.montoTotalContrato || 0) - totalConsumedAmount;

            doc.text(`Monto Consumido por HES: ${totalConsumedAmount.toFixed(2)} ${contract.moneda || 'USD'}`, 14, 46);
            doc.text(`Monto Restante del Contrato: ${remainingAmount.toFixed(2)} ${contract.moneda || 'USD'}`, 14, 52);

            // Tabla de Partidas del Contrato y Consumo
            const partidaColumns = ["Descripción", "Cant. Original", "Cant. Consumida", "Cant. Restante", "Monto Consumido", "Monto Restante"];
            const partidaRows = [];

            for (const partida of contractPartidas) {
                const consumedQuantity = hesPartidasList
                    .filter(hp => hp.contractPartidaId === partida.id)
                    .reduce((sum, hp) => sum + hp.cantidadEjecutada, 0);
                
                const remainingQuantity = partida.cantidad - consumedQuantity;
                const consumedAmount = consumedQuantity * partida.precioUnitario;
                const remainingAmountPartida = remainingQuantity * partida.precioUnitario;

                partidaRows.push([
                    partida.descripcion || '',
                    `${partida.cantidad.toFixed(2)} ${partida.umd || ''}`,
                    `${consumedQuantity.toFixed(2)} ${partida.umd || ''}`,
                    `${remainingQuantity.toFixed(2)} ${partida.umd || ''}`,
                    `${consumedAmount.toFixed(2)} ${contract.moneda || 'USD'}`,
                    `${remainingAmountPartida.toFixed(2)} ${contract.moneda || 'USD'}`
                ]);
            }

            doc.autoTable({
                head: [partidaColumns],
                body: partidaRows,
                startY: 60,
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                headStyles: { fillColor: [66, 133, 244], textColor: 255, fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 40 },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 30 },
                    5: { cellWidth: 30 }
                },
                didDrawPage: function (data) {
                    doc.text("Partidas del Contrato y Consumo", data.settings.margin.left, data.cursor.y + 10);
                }
            });

            // Tabla de HES Asociadas
            if (hesList.length > 0) {
                const hesColumns = ["No. HES", "Fecha Inicio", "Fecha Final", "Total HES", "Estatus"];
                const hesRows = [];
                hesList.forEach(hes => {
                    hesRows.push([
                        hes.noHes || '',
                        hes.fechaInicioHes || '',
                        hes.fechaFinalHes || '',
                        `${hes.totalHes.toFixed(2)} ${contract.moneda || 'USD'}`,
                        hes.aprobado || ''
                    ]);
                });

                doc.autoTable({
                    head: [hesColumns],
                    body: hesRows,
                    startY: doc.autoTable.previous.finalY + 10,
                    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                    headStyles: { fillColor: [255, 152, 0], textColor: 255, fontStyle: 'bold' },
                    didDrawPage: function (data) {
                        doc.text("HES Asociadas", data.settings.margin.left, data.cursor.y + 10);
                    }
                });
            }


            doc.save(`Informe_Contrato_${contract.numeroSICAC || contract.id}.pdf`);
            showToast("Informe individual generado exitosamente.", "success");

        } catch (error) {
            console.error("Error al generar informe individual PDF:", error);
            showToast("Error al generar informe individual PDF: " + error.message, "error");
        }
    });

    // Generar PDF de Informe General
    generateGeneralReportPdfBtn.addEventListener('click', async () => {
        try {
            const contracts = await db.contracts.toArray();
            if (contracts.length === 0) {
                showToast("No hay contratos para generar el informe general PDF.", "warning");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape'); 

            const tableColumn = [
                "N° Proveedor", "N° SICAC", "Fecha Inicio", "Fecha Fin", "Monto Total",
                "Avance Físico (%)", "Avance Financiero (%)", "Estatus", "Modalidad"
            ];
            const tableRows = [];

            for (const contract of contracts) {
                const { physicalAdvancePercentage, financialAdvancePercentage } = await calculateContractAdvances(contract.id);
                tableRows.push([
                    contract.numeroProveedor || '',
                    contract.numeroSICAC || '-',
                    contract.fechaInicio || '',
                    contract.fechaTerminacion || '',
                    `${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}`,
                    physicalAdvancePercentage.toFixed(1),
                    financialAdvancePercentage.toFixed(1),
                    contract.estatusContrato || '',
                    contract.modalidadContratacion || ''
                ]);
            }

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
                headStyles: { fillColor: [52, 73, 94], textColor: 255, fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 25 },
                    5: { cellWidth: 25 },
                    6: { cellWidth: 25 },
                    7: { cellWidth: 20 },
                    8: { cellWidth: 25 }
                },
                didDrawPage: function (data) {
                    doc.text("Informe General de Contratos SIGESCON", data.settings.margin.left, 15);
                }
            });

            doc.save('Sigescon_Informe_General_Contratos.pdf');
            showToast("Informe general generado exitosamente.", "success");

        } catch (error) {
            console.error("Error al generar informe general PDF:", error);
            showToast("Error al generar informe general PDF: " + error.message, "error");
        }
    });


    // --- Inicialización al cargar la página ---
    tabButtons[0].click(); 

    // Función para manejar el modal de confirmación (reemplaza confirm nativo)
    function showConfirmModal(message, onConfirm) {
        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal fade';
        modalDiv.id = 'customConfirmModal';
        modalDiv.setAttribute('tabindex', '-1');
        modalDiv.setAttribute('aria-labelledby', 'customConfirmModalLabel');
        modalDiv.setAttribute('aria-hidden', 'true');

        modalDiv.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="customConfirmModalLabel">Confirmación</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${message}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="confirmActionBtn">Aceptar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modalDiv);
        const customConfirmModal = new bootstrap.Modal(modalDiv);
        customConfirmModal.show();

        const confirmActionBtn = document.getElementById('confirmActionBtn');
        confirmActionBtn.onclick = () => {
            onConfirm();
            customConfirmModal.hide();
            modalDiv.remove(); 
        };

        modalDiv.addEventListener('hidden.bs.modal', () => {
            modalDiv.remove(); 
        });
    }

    // --- Funcionalidad de Gemini API ---
    generateSummaryBtn.addEventListener('click', async () => {
        const contractDescription = objetoContractualTextarea.value.trim();

        if (!contractDescription) {
            showToast("Por favor, ingrese una descripción del contrato para generar el resumen.", "warning");
            return;
        }

        summaryLoadingIndicator.style.display = 'inline-block'; // Mostrar spinner
        generateSummaryBtn.disabled = true; // Deshabilitar botón
        generatedSummaryTextarea.value = 'Generando resumen y cláusulas clave...';

        try {
            const prompt = `Genera un resumen conciso y extrae las 5 cláusulas clave o puntos importantes del siguiente objeto contractual. Formatea la respuesta con un encabezado "Resumen:" seguido del resumen, y luego "Cláusulas Clave:" seguido de una lista numerada de las cláusulas.

            Objeto Contractual:
            ${contractDescription}`;

            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });
            const payload = { contents: chatHistory };
            const apiKey = ""; // La clave API se inyecta automáticamente en el entorno de Canvas
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const generatedText = result.candidates[0].content.parts[0].text;
                generatedSummaryTextarea.value = generatedText;
                showToast("Resumen y cláusulas clave generados exitosamente.", "success");
            } else {
                generatedSummaryTextarea.value = 'No se pudo generar el resumen. Intente de nuevo.';
                showToast("Error al generar el resumen: Respuesta inesperada de la API.", "error");
                console.error("Respuesta inesperada de la API de Gemini:", result);
            }
        } catch (error) {
            console.error("Error al llamar a la API de Gemini:", error);
            generatedSummaryTextarea.value = 'Error al generar el resumen. Verifique su conexión o intente más tarde.';
            showToast("Error de conexión al generar el resumen. " + error.message, "error");
        } finally {
            summaryLoadingIndicator.style.display = 'none'; // Ocultar spinner
            generateSummaryBtn.disabled = false; // Habilitar botón
        }
    });

});
