// js/script.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicialización de la base de datos (Dexie.js)
    const db = new Dexie('ContractManagementDB');
    db.version(1).stores({
        contracts: '++id,numeroProveedor,nSicac,fechaInicio,fechaTerminacion,montoTotalContrato,estatusContrato',
        partidas: '++id,contractId,descripcion,cantidad,umd,precioUnitario,totalPartida',
        hes: '++id,contractId,hesDate,hesAmount,hesStatus',
        physicalAdvances: '++id,contractId,advanceDate,advancePercentage,comments' // Nueva tabla para Avances Físicos
    });
    await db.open();

    // 2. Elementos del DOM (cachear para mejor rendimiento)
    const tabButtons = document.querySelectorAll('.tab-btn');
    const contentSections = document.querySelectorAll('.content-section');
    
    // Contratos
    const contractForm = document.getElementById('contract-form');
    const contractDbIdInput = document.getElementById('contract-db-id');
    const addPartidaBtn = document.getElementById('add-partida-btn');
    const partidasTableBody = document.getElementById('partidas-table-body');
    const clearContractFormBtn = document.getElementById('clear-contract-form-btn');
    const montoOriginalInput = document.getElementById('monto-original');
    const montoModificadoInput = document.getElementById('monto-modificado');
    const montoTotalContratoInput = document.getElementById('monto-total-contrato');
    const fechaInicioInput = document.getElementById('fecha-inicio');
    const fechaTerminacionInput = document.getElementById('fecha-terminacion');
    const periodoCulminacionDiasInput = document.getElementById('periodo-culminacion-dias'); // Nuevo
    
    // Lista de Contratos
    const contractsTableBody = document.getElementById('contracts-table-body');
    const filterContractNumber = document.getElementById('filter-contract-number'); // N° Proveedor
    const filterSicac = document.getElementById('filter-sicac'); // N° SICAC
    const filterFechaInicio = document.getElementById('filter-fecha-inicio'); // Nueva
    const filterFechaFinal = document.getElementById('filter-fecha-final'); // Nueva
    const filterModalidad = document.getElementById('filter-modalidad'); // Nueva
    const filterStatus = document.getElementById('filter-status');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    // HES
    const hesForm = document.getElementById('hes-form');
    const hesDbIdInput = document.getElementById('hes-db-id');
    const hesContractIdSelect = document.getElementById('hes-contract-id');
    const hesTableBody = document.getElementById('hes-table-body');
    const clearHesFormBtn = document.getElementById('clear-hes-form-btn');

    // Avance Físico (Antes Advance Management)
    const physicalAdvanceForm = document.getElementById('physical-advance-form');
    const physicalAdvanceDbIdInput = document.getElementById('physical-advance-db-id');
    const physicalAdvanceContractIdSelect = document.getElementById('physical-advance-contract-id');
    const physicalAdvanceDateInput = document.getElementById('physical-advance-date');
    const physicalAdvancePercentageInput = document.getElementById('physical-advance-percentage');
    const physicalAdvanceCommentsInput = document.getElementById('physical-advance-comments');
    const physicalAdvancesTableBody = document.getElementById('physical-advances-table-body');
    const clearPhysicalAdvanceFormBtn = document.getElementById('clear-physical-advance-form-btn');

    // Dashboard
    const totalContractsCard = document.getElementById('total-contracts');
    const totalContractedAmountCard = document.getElementById('total-contracted-amount');
    const pendingAdvancesCard = document.getElementById('pending-advances'); // Ahora reflejará anticipos registrados si no hay una tabla específica
    const pendingHesCard = document.getElementById('pending-hes');
    const dashboardPhysicalAdvanceChartCanvas = document.getElementById('dashboardPhysicalAdvanceChart');
    const dashboardContractStatusChartCanvas = document.getElementById('dashboardContractStatusChart');
    let dashboardPhysicalAdvanceChartInstance;
    let dashboardContractStatusChartInstance;

    // Reportes / Resumen Gráfico
    const exportGraphicPdfBtn = document.getElementById('exportGraphicPdfBtn');
    const exportGraphicImageBtn = document.getElementById('exportGraphicImageBtn');
    const reportsPhysicalAdvanceChartCanvas = document.getElementById('reportsPhysicalAdvanceChart');
    const reportsContractModalitiesChartCanvas = document.getElementById('reportsContractModalitiesChart');
    const reportsContractStatusChartCanvas = document.getElementById('reportsContractStatusChart');
    const reportsContractRegionChartCanvas = document.getElementById('reportsContractRegionChart');
    let reportsPhysicalAdvanceChartInstance;
    let reportsContractModalitiesChartInstance;
    let reportsContractStatusChartInstance;
    let reportsContractRegionChartInstance;


    let currentEditContractId = null;
    let currentEditHesId = null;
    let currentEditPhysicalAdvanceId = null; // Para Avance Físico

    // 3. Funciones de Utilidad
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.className = toast.className.replace('show', '');
        }, 3000);
    }

    // Calcula duración en días
    function calculatePeriodoCulminacionDias() {
        const fechaInicio = new Date(fechaInicioInput.value);
        const fechaTerminacion = new Date(fechaTerminacionInput.value);

        if (fechaInicioInput.value && fechaTerminacionInput.value && fechaTerminacion >= fechaInicio) {
            const diffTime = Math.abs(fechaTerminacion - fechaInicio);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            periodoCulminacionDiasInput.value = diffDays;
        } else if (fechaInicioInput.value && fechaTerminacionInput.value) {
            periodoCulminacionDiasInput.value = '';
            showToast('La fecha de terminación no puede ser anterior a la fecha de inicio.', 'warning');
        } else {
            periodoCulminacionDiasInput.value = '';
        }
    }

    // Calcula montos del contrato (original, modificado, total)
    function calculateContractAmounts() {
        let montoOriginal = 0;
        const partidaRows = partidasTableBody.querySelectorAll('tr');
        partidaRows.forEach(row => {
            const totalPartidaInput = row.querySelector('.total-partida');
            if (totalPartidaInput && !isNaN(parseFloat(totalPartidaInput.value))) {
                montoOriginal += parseFloat(totalPartidaInput.value);
            }
        });
        montoOriginalInput.value = montoOriginal.toFixed(2);

        const montoModificado = parseFloat(montoModificadoInput.value) || 0;
        montoTotalContratoInput.value = (montoOriginal + montoModificado).toFixed(2);
    }

    // Función para calcular el total de una partida
    function calculatePartidaTotal(row) {
        const cantidad = parseFloat(row.querySelector('.partida-cantidad').value) || 0;
        const precioUnitario = parseFloat(row.querySelector('.partida-precio-unitario').value) || 0;
        const totalPartida = cantidad * precioUnitario;
        row.querySelector('.total-partida').value = totalPartida.toFixed(2);
        calculateContractAmounts(); // Recalcular el monto total del contrato
    }

    // Función para añadir una nueva fila de partida
    function addPartidaRow(partida = {}, index = 0) {
        const newRow = partidasTableBody.insertRow();
        newRow.innerHTML = `
            <td>${index + 1}</td>
            <td><input type="text" class="form-control partida-descripcion" value="${partida.descripcion || ''}" required></td>
            <td><input type="number" class="form-control partida-cantidad" step="0.01" value="${partida.cantidad || '0.00'}" required></td>
            <td><input type="text" class="form-control partida-umd" value="${partida.umd || ''}" required></td>
            <td><input type="number" class="form-control partida-precio-unitario" step="0.01" value="${partida.precioUnitario || '0.00'}" required></td>
            <td><input type="number" class="form-control total-partida" step="0.01" value="${partida.totalPartida || '0.00'}" readonly></td>
            <td class="actions-cell">
                <button type="button" class="btn btn-danger btn-sm remove-partida-btn"><i class="fas fa-trash"></i></button>
            </td>
        `;

        const cantidadInput = newRow.querySelector('.partida-cantidad');
        const precioUnitarioInput = newRow.querySelector('.partida-precio-unitario');
        const removeButton = newRow.querySelector('.remove-partida-btn');

        const updateHandler = () => calculatePartidaTotal(newRow);
        cantidadInput.addEventListener('input', updateHandler);
        precioUnitarioInput.addEventListener('input', updateHandler);

        removeButton.addEventListener('click', () => {
            newRow.remove();
            calculateContractAmounts(); // Recalcular al eliminar
            showToast('Partida eliminada.', 'info');
            // Re-numerar las partidas
            partidasTableBody.querySelectorAll('tr').forEach((row, i) => {
                row.querySelector('td:first-child').textContent = i + 1;
            });
        });
        calculateContractAmounts(); // Recalcular al añadir
    }

    // Funciones para cargar y guardar contratos
    async function loadContracts() {
        contractsTableBody.innerHTML = '';
        let contracts = await db.contracts.toArray();

        // Aplicar filtros
        const filterNumProveedor = filterContractNumber.value.toLowerCase();
        const filterSicacVal = filterSicac.value.toLowerCase();
        const filterEstado = filterStatus.value;
        const filterFechaInicioVal = filterFechaInicio.value;
        const filterFechaFinalVal = filterFechaFinal.value;
        const filterModalidadVal = filterModalidad.value.toLowerCase();


        contracts = contracts.filter(contract => {
            const matchProveedor = contract.numeroProveedor.toLowerCase().includes(filterNumProveedor);
            const matchSicac = contract.nSicac.toLowerCase().includes(filterSicacVal);
            const matchEstado = filterEstado === '' || contract.estatusContrato === filterEstado;
            const matchModalidad = contract.modalidadContratacion?.toLowerCase().includes(filterModalidadVal) || filterModalidadVal === '';

            let matchFechaInicio = true;
            if (filterFechaInicioVal) {
                matchFechaInicio = new Date(contract.fechaInicio) >= new Date(filterFechaInicioVal);
            }

            let matchFechaFinal = true;
            if (filterFechaFinalVal) {
                matchFechaFinal = new Date(contract.fechaTerminacion) <= new Date(filterFechaFinalVal);
            }

            return matchProveedor && matchSicac && matchEstado && matchFechaInicio && matchFechaFinal && matchModalidad;
        });


        for (const contract of contracts) {
            const newRow = contractsTableBody.insertRow();
            newRow.innerHTML = `
                <td>${contract.numeroProveedor || ''}</td>
                <td>${contract.nSicac || ''}</td>
                <td>${contract.fechaInicio || ''}</td>
                <td>${contract.fechaTerminacion || ''}</td>
                <td>${contract.periodoCulminacionDias || ''}</td>
                <td>${contract.tipoMoneda || ''} ${parseFloat(contract.montoTotalContrato).toFixed(2) || '0.00'}</td>
                <td class="actions-cell">
                    ${contract.adjuntarArchivos ? `<a href="${contract.adjuntarArchivos}" target="_blank" class="btn btn-info btn-sm" title="Ver Archivo"><i class="fas fa-file-alt"></i></a>` : 'N/A'}
                </td>
                <td class="actions-cell">
                    <button type="button" class="btn btn-primary btn-sm edit-contract-btn" data-id="${contract.id}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button type="button" class="btn btn-danger btn-sm delete-contract-btn" data-id="${contract.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            `;
        }

        document.querySelectorAll('.edit-contract-btn').forEach(button => {
            button.addEventListener('click', (e) => editContract(parseInt(e.currentTarget.dataset.id)));
        });

        document.querySelectorAll('.delete-contract-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteContract(parseInt(e.currentTarget.dataset.id)));
        });
    }

    async function handleContractFormSubmit(e) {
        e.preventDefault();

        const contractData = {
            numeroProveedor: document.getElementById('numero-proveedor').value,
            fechaFirmaContrato: document.getElementById('fecha-firma-contrato').value,
            fechaCreado: document.getElementById('fecha-creado').value,
            fechaInicio: document.getElementById('fecha-inicio').value,
            fechaTerminacion: document.getElementById('fecha-terminacion').value,
            periodoCulminacionDias: parseInt(document.getElementById('periodo-culminacion-dias').value) || 0,
            nSicac: document.getElementById('n-sicac').value,
            divisionArea: document.getElementById('division-area').value,
            eemn: document.getElementById('eemn').value,
            region: document.getElementById('region').value,
            naturalezaContratacion: document.getElementById('naturaleza-contratacion').value,
            lineaServicio: document.getElementById('linea-servicio').value,
            noPeticionOferta: document.getElementById('no-peticion-oferta').value,
            modalidadContratacion: document.getElementById('modalidad-contratacion').value,
            regimenLaboral: document.getElementById('regimen-laboral').value,
            descripcionContrato: document.getElementById('descripcion-contrato').value,
            fechaCambioAlcance: document.getElementById('fecha-cambio-alcance').value,
            montoOriginal: parseFloat(document.getElementById('monto-original').value),
            montoModificado: parseFloat(document.getElementById('monto-modificado').value) || 0,
            montoTotalContrato: parseFloat(document.getElementById('monto-total-contrato').value),
            noContratoInterno: document.getElementById('no-contrato-interno').value,
            observaciones: document.getElementById('observaciones').value,
            estatusContrato: document.getElementById('estatus-contrato').value,
            tipoMoneda: document.getElementById('tipo-moneda').value,
            // adjuntarArchivos: se maneja aparte si se carga un nuevo archivo
        };

        const fileInput = document.getElementById('adjuntar-archivos');
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = async (event) => {
                contractData.adjuntarArchivos = event.target.result; // Guarda el archivo como Base64
                await saveOrUpdateContract(contractData);
            };
            reader.readAsDataURL(file);
        } else {
            await saveOrUpdateContract(contractData);
        }
    }

    async function saveOrUpdateContract(contractData) {
        try {
            let contractId;
            if (currentEditContractId) {
                contractId = await db.contracts.update(currentEditContractId, contractData);
                showToast('Contrato actualizado con éxito.', 'success');
            } else {
                contractId = await db.contracts.add(contractData);
                showToast('Contrato guardado con éxito.', 'success');
            }

            // Guardar partidas
            await db.partidas.where({ contractId: currentEditContractId || contractId }).delete(); // Borra las antiguas
            const partidaRows = partidasTableBody.querySelectorAll('tr');
            for (const row of partidaRows) {
                const partida = {
                    contractId: contractId,
                    descripcion: row.querySelector('.partida-descripcion').value,
                    cantidad: parseFloat(row.querySelector('.partida-cantidad').value),
                    umd: row.querySelector('.partida-umd').value,
                    precioUnitario: parseFloat(row.querySelector('.partida-precio-unitario').value),
                    totalPartida: parseFloat(row.querySelector('.total-partida').value)
                };
                await db.partidas.add(partida);
            }

            clearContractForm();
            loadContracts();
            updateDashboardCards();
            populateHesContractSelect(); // Actualizar selects de HES
            populatePhysicalAdvanceContractSelect(); // Actualizar selects de Avance Físico

        } catch (error) {
            console.error('Error al guardar/actualizar contrato:', error);
            showToast('Error al guardar/actualizar contrato. Revisa la consola.', 'error');
        }
    }

    async function editContract(id) {
        const contract = await db.contracts.get(id);
        if (contract) {
            currentEditContractId = id;
            document.getElementById('numero-proveedor').value = contract.numeroProveedor || '';
            document.getElementById('fecha-firma-contrato').value = contract.fechaFirmaContrato || '';
            document.getElementById('fecha-creado').value = contract.fechaCreado || '';
            document.getElementById('fecha-inicio').value = contract.fechaInicio || '';
            document.getElementById('fecha-terminacion').value = contract.fechaTerminacion || '';
            document.getElementById('periodo-culminacion-dias').value = contract.periodoCulminacionDias || '';
            document.getElementById('n-sicac').value = contract.nSicac || '';
            document.getElementById('division-area').value = contract.divisionArea || '';
            document.getElementById('eemn').value = contract.eemn || '';
            document.getElementById('region').value = contract.region || '';
            document.getElementById('naturaleza-contratacion').value = contract.naturalezaContratacion || '';
            document.getElementById('linea-servicio').value = contract.lineaServicio || '';
            document.getElementById('no-peticion-oferta').value = contract.noPeticionOferta || '';
            document.getElementById('modalidad-contratacion').value = contract.modalidadContratacion || '';
            document.getElementById('regimen-laboral').value = contract.regimenLaboral || '';
            document.getElementById('descripcion-contrato').value = contract.descripcionContrato || '';
            document.getElementById('fecha-cambio-alcance').value = contract.fechaCambioAlcance || '';
            montoOriginalInput.value = (contract.montoOriginal || 0).toFixed(2);
            montoModificadoInput.value = (contract.montoModificado || 0).toFixed(2);
            montoTotalContratoInput.value = (contract.montoTotalContrato || 0).toFixed(2);
            document.getElementById('no-contrato-interno').value = contract.noContratoInterno || '';
            document.getElementById('observaciones').value = contract.observaciones || '';
            document.getElementById('estatus-contrato').value = contract.estatusContrato || 'Activo';
            document.getElementById('tipo-moneda').value = contract.tipoMoneda || 'USD';
            // No se puede pre-establecer el valor de un input type="file" por seguridad

            // Cargar partidas asociadas
            partidasTableBody.innerHTML = '';
            const partidas = await db.partidas.where({ contractId: id }).toArray();
            partidas.forEach((p, index) => addPartidaRow(p, index));
            calculateContractAmounts(); // Asegurar que los montos se calculen si hay partidas

            // Cambiar a la pestaña de gestión de contratos
            document.querySelector('.tab-btn[data-tab="contract-management-section"]').click();
            showToast('Contrato cargado para edición.', 'info');
        }
    }

    async function deleteContract(id) {
        if (confirm('¿Está seguro de que desea eliminar este contrato y todas sus partidas, HES y avances físicos asociados?')) {
            try {
                await db.contracts.delete(id);
                await db.partidas.where({ contractId: id }).delete();
                await db.hes.where({ contractId: id }).delete();
                await db.physicalAdvances.where({ contractId: id }).delete();
                showToast('Contrato eliminado con éxito.', 'success');
                loadContracts();
                updateDashboardCards();
                populateHesContractSelect(); // Actualizar selects de HES
                populatePhysicalAdvanceContractSelect(); // Actualizar selects de Avance Físico
            } catch (error) {
                console.error('Error al eliminar contrato:', error);
                showToast('Error al eliminar contrato. Revisa la consola.', 'error');
            }
        }
    }

    function clearContractForm() {
        contractForm.reset();
        partidasTableBody.innerHTML = '';
        currentEditContractId = null;
        montoOriginalInput.value = '0.00';
        montoModificadoInput.value = '0.00';
        montoTotalContratoInput.value = '0.00';
        document.getElementById('adjuntar-archivos').value = ''; // Limpiar el input de archivo
        showToast('Formulario de contrato limpiado.', 'info');
    }

    // Funciones para HES
    async function populateHesContractSelect() {
        hesContractIdSelect.innerHTML = '<option value="">Seleccione un contrato</option>';
        const contracts = await db.contracts.toArray();
        contracts.forEach(contract => {
            const option = document.createElement('option');
            option.value = contract.id;
            option.textContent = `${contract.numeroProveedor} - ${contract.nSicac || 'N/A'}`;
            hesContractIdSelect.appendChild(option);
        });
    }

    async function loadHes() {
        hesTableBody.innerHTML = '';
        const hesEntries = await db.hes.toArray();
        for (const hes of hesEntries) {
            const contract = await db.contracts.get(hes.contractId);
            const newRow = hesTableBody.insertRow();
            newRow.innerHTML = `
                <td>${hes.id}</td>
                <td>${contract ? `${contract.numeroProveedor} - ${contract.nSicac}` : 'Contrato Eliminado'}</td>
                <td>${hes.hesDate}</td>
                <td>${hes.hesDescription}</td>
                <td>${parseFloat(hes.hesAmount).toFixed(2)}</td>
                <td>${hes.hesStatus}</td>
                <td class="actions-cell">
                    <button type="button" class="btn btn-primary btn-sm edit-hes-btn" data-id="${hes.id}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button type="button" class="btn btn-danger btn-sm delete-hes-btn" data-id="${hes.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            `;
        }

        document.querySelectorAll('.edit-hes-btn').forEach(button => {
            button.addEventListener('click', (e) => editHes(parseInt(e.currentTarget.dataset.id)));
        });
        document.querySelectorAll('.delete-hes-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteHes(parseInt(e.currentTarget.dataset.id)));
        });
    }

    async function editHes(id) {
        const hes = await db.hes.get(id);
        if (hes) {
            currentEditHesId = id;
            hesDbIdInput.value = hes.id;
            hesContractIdSelect.value = hes.contractId;
            document.getElementById('hes-date').value = hes.hesDate;
            document.getElementById('hes-description').value = hes.hesDescription;
            document.getElementById('hes-amount').value = hes.hesAmount.toFixed(2);
            document.getElementById('hes-status').value = hes.hesStatus;
            document.getElementById('hes-notes').value = hes.hesNotes || '';
            // No se puede pre-establecer el valor de un input type="file" por seguridad
            showToast('HES cargado para edición.', 'info');
        }
    }

    async function deleteHes(id) {
        if (confirm('¿Está seguro de que desea eliminar este HES?')) {
            try {
                await db.hes.delete(id);
                showToast('HES eliminado con éxito.', 'success');
                loadHes();
                updateDashboardCards();
            } catch (error) {
                console.error('Error al eliminar HES:', error);
                showToast('Error al eliminar HES. Revisa la consola.', 'error');
            }
        }
    }

    function clearHesForm() {
        hesForm.reset();
        currentEditHesId = null;
        hesDbIdInput.value = '';
        document.getElementById('hes-attach-document').value = '';
        showToast('Formulario de HES limpiado.', 'info');
    }

    // --- NUEVAS FUNCIONES PARA AVANCE FÍSICO ---
    async function populatePhysicalAdvanceContractSelect() {
        physicalAdvanceContractIdSelect.innerHTML = '<option value="">Seleccione un contrato</option>';
        const contracts = await db.contracts.toArray();
        contracts.forEach(contract => {
            const option = document.createElement('option');
            option.value = contract.id;
            option.textContent = `${contract.numeroProveedor} - ${contract.nSicac || 'N/A'}`;
            physicalAdvanceContractIdSelect.appendChild(option);
        });
    }

    async function loadPhysicalAdvances() {
        physicalAdvancesTableBody.innerHTML = '';
        const advances = await db.physicalAdvances.toArray();
        for (const advance of advances) {
            const contract = await db.contracts.get(advance.contractId);
            const newRow = physicalAdvancesTableBody.insertRow();
            newRow.innerHTML = `
                <td>${contract ? `${contract.numeroProveedor} - ${contract.nSicac}` : 'Contrato Eliminado'}</td>
                <td>${advance.advanceDate}</td>
                <td>${advance.advancePercentage.toFixed(2)}%</td>
                <td>${advance.comments || ''}</td>
                <td class="actions-cell">
                    <button type="button" class="btn btn-primary btn-sm edit-physical-advance-btn" data-id="${advance.id}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button type="button" class="btn btn-danger btn-sm delete-physical-advance-btn" data-id="${advance.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            `;
        }

        document.querySelectorAll('.edit-physical-advance-btn').forEach(button => {
            button.addEventListener('click', (e) => editPhysicalAdvance(parseInt(e.currentTarget.dataset.id)));
        });
        document.querySelectorAll('.delete-physical-advance-btn').forEach(button => {
            button.addEventListener('click', (e) => deletePhysicalAdvance(parseInt(e.currentTarget.dataset.id)));
        });
    }

    async function handlePhysicalAdvanceFormSubmit(e) {
        e.preventDefault();
        const advanceData = {
            contractId: parseInt(physicalAdvanceContractIdSelect.value),
            advanceDate: physicalAdvanceDateInput.value,
            advancePercentage: parseFloat(physicalAdvancePercentageInput.value),
            comments: physicalAdvanceCommentsInput.value
        };

        try {
            if (currentEditPhysicalAdvanceId) {
                await db.physicalAdvances.update(currentEditPhysicalAdvanceId, advanceData);
                showToast('Avance físico actualizado con éxito.', 'success');
            } else {
                await db.physicalAdvances.add(advanceData);
                showToast('Avance físico guardado con éxito.', 'success');
            }
            clearPhysicalAdvanceForm();
            loadPhysicalAdvances();
            updateDashboardCards();
            renderDashboardCharts(); // Actualizar gráficos del dashboard
            renderReportsCharts(); // Actualizar gráficos de reportes
        } catch (error) {
            console.error('Error al guardar/actualizar avance físico:', error);
            showToast('Error al guardar/actualizar avance físico. Revisa la consola.', 'error');
        }
    }

    async function editPhysicalAdvance(id) {
        const advance = await db.physicalAdvances.get(id);
        if (advance) {
            currentEditPhysicalAdvanceId = id;
            physicalAdvanceDbIdInput.value = advance.id;
            physicalAdvanceContractIdSelect.value = advance.contractId;
            physicalAdvanceDateInput.value = advance.advanceDate;
            physicalAdvancePercentageInput.value = advance.advancePercentage;
            physicalAdvanceCommentsInput.value = advance.comments;
            showToast('Avance físico cargado para edición.', 'info');
        }
    }

    async function deletePhysicalAdvance(id) {
        if (confirm('¿Está seguro de que desea eliminar este avance físico?')) {
            try {
                await db.physicalAdvances.delete(id);
                showToast('Avance físico eliminado con éxito.', 'success');
                loadPhysicalAdvances();
                updateDashboardCards();
                renderDashboardCharts(); // Actualizar gráficos del dashboard
                renderReportsCharts(); // Actualizar gráficos de reportes
            } catch (error) {
                console.error('Error al eliminar avance físico:', error);
                showToast('Error al eliminar avance físico. Revisa la consola.', 'error');
            }
        }
    }

    function clearPhysicalAdvanceForm() {
        physicalAdvanceForm.reset();
        currentEditPhysicalAdvanceId = null;
        physicalAdvanceDbIdInput.value = '';
        physicalAdvanceContractIdSelect.value = ''; // Limpiar select
        showToast('Formulario de avance físico limpiado.', 'info');
    }

    // --- DASHBOARD ---
    async function updateDashboardCards() {
        const totalContracts = await db.contracts.count();
        totalContractsCard.textContent = totalContracts;

        const allContracts = await db.contracts.toArray();
        const totalAmount = allContracts.reduce((sum, contract) => sum + (parseFloat(contract.montoTotalContrato) || 0), 0);
        totalContractedAmountCard.textContent = `$${totalAmount.toFixed(2)}`;

        // Para anticipos pendientes, necesitamos una tabla o campo de estado en el contrato si no hay una tabla dedicada.
        // Aquí simulamos que si no hay tabla de 'advances', solo mostramos '0.00'
        // Si tuvieras una tabla de 'advances' con un campo 'status', lo sumarías aquí.
        // Por ahora, como eliminamos 'advances', lo dejamos en $0.00 o podrías mostrar "N/A"
        pendingAdvancesCard.textContent = `$0.00`; // Placeholder, ajusta si implementas tabla de anticipos

        const pendingHes = await db.hes.where({ hesStatus: 'Pendiente' }).count();
        pendingHesCard.textContent = pendingHes;
    }

    async function renderDashboardCharts() {
        const contracts = await db.contracts.toArray();
        const physicalAdvances = await db.physicalAdvances.toArray();

        // Avance Físico General (Dashboard)
        if (dashboardPhysicalAdvanceChartInstance) {
            dashboardPhysicalAdvanceChartInstance.destroy();
        }
        const contractAdvanceData = contracts.map(contract => {
            const relevantAdvances = physicalAdvances.filter(pa => pa.contractId === contract.id);
            if (relevantAdvances.length > 0) {
                // Tomar el último avance registrado para ese contrato
                const latestAdvance = relevantAdvances.sort((a, b) => new Date(b.advanceDate) - new Date(a.advanceDate))[0];
                return latestAdvance.advancePercentage;
            }
            return 0; // Si no hay avances, 0%
        });
        const contractLabels = contracts.map(c => `${c.numeroProveedor} - ${c.nSicac}`);
        
        dashboardPhysicalAdvanceChartInstance = new Chart(dashboardPhysicalAdvanceChartCanvas, {
            type: 'bar',
            data: {
                labels: contractLabels,
                datasets: [{
                    label: 'Porcentaje de Avance Físico',
                    data: contractAdvanceData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Porcentaje (%)' }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Avance Físico por Contrato'
                    }
                }
            }
        });

        // Distribución de Contratos por Estado (Dashboard)
        if (dashboardContractStatusChartInstance) {
            dashboardContractStatusChartInstance.destroy();
        }
        const statusCounts = contracts.reduce((acc, contract) => {
            acc[contract.estatusContrato] = (acc[contract.estatusContrato] || 0) + 1;
            return acc;
        }, {});
        const statusLabels = Object.keys(statusCounts);
        const statusData = Object.values(statusCounts);

        dashboardContractStatusChartInstance = new Chart(dashboardContractStatusChartCanvas, {
            type: 'pie',
            data: {
                labels: statusLabels,
                datasets: [{
                    label: 'Número de Contratos',
                    data: statusData,
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.6)', // Activo (verde)
                        'rgba(255, 193, 7, 0.6)', // En Revisión (amarillo)
                        'rgba(0, 123, 255, 0.6)', // Finalizado (azul)
                        'rgba(108, 117, 125, 0.6)', // Suspendido (gris)
                        'rgba(220, 53, 69, 0.6)'  // Cancelado (rojo)
                    ],
                    borderColor: '#fff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribución de Contratos por Estado'
                    }
                }
            }
        });
    }


    // --- REPORTES / RESUMEN GRÁFICO ---
    async function renderReportsCharts() {
        const contracts = await db.contracts.toArray();
        const physicalAdvances = await db.physicalAdvances.toArray();

        // 1. Avance Físico de Contratos (Reportes)
        if (reportsPhysicalAdvanceChartInstance) {
            reportsPhysicalAdvanceChartInstance.destroy();
        }
        const reportsContractAdvanceData = contracts.map(contract => {
            const relevantAdvances = physicalAdvances.filter(pa => pa.contractId === contract.id);
            if (relevantAdvances.length > 0) {
                const latestAdvance = relevantAdvances.sort((a, b) => new Date(b.advanceDate) - new Date(a.advanceDate))[0];
                return latestAdvance.advancePercentage;
            }
            return 0;
        });
        const reportsContractLabels = contracts.map(c => `${c.numeroProveedor} - ${c.nSicac}`);
        
        reportsPhysicalAdvanceChartInstance = new Chart(reportsPhysicalAdvanceChartCanvas, {
            type: 'bar', // Opciones: 'bar', 'line', 'pie'
            data: {
                labels: reportsContractLabels,
                datasets: [{
                    label: 'Porcentaje de Avance Físico',
                    data: reportsContractAdvanceData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Porcentaje (%)' }
                    },
                    x: {
                         // Evita etiquetas superpuestas si hay muchos contratos
                        ticks: {
                            autoSkip: true,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Avance Físico por Contrato'
                    }
                }
            }
        });

        // 2. Montos por Modalidad de Contratación (Avance Financiero)
        if (reportsContractModalitiesChartInstance) {
            reportsContractModalitiesChartInstance.destroy();
        }
        const modalitiesData = contracts.reduce((acc, contract) => {
            const modality = contract.modalidadContratacion || 'Sin Modalidad';
            acc[modality] = (acc[modality] || 0) + (parseFloat(contract.montoTotalContrato) || 0);
            return acc;
        }, {});
        const modalityLabels = Object.keys(modalitiesData);
        const modalityAmounts = Object.values(modalitiesData);

        reportsContractModalitiesChartInstance = new Chart(reportsContractModalitiesChartCanvas, {
            type: 'pie', // Puede ser 'bar' también
            data: {
                labels: modalityLabels,
                datasets: [{
                    label: 'Monto Total Contratado',
                    data: modalityAmounts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)'
                    ],
                    borderColor: '#fff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Montos por Modalidad de Contratación'
                    }
                }
            }
        });

        // 3. Estado de Contratos (Reportes - similar al dashboard, pero si quieres uno dedicado)
        if (reportsContractStatusChartInstance) {
            reportsContractStatusChartInstance.destroy();
        }
        const reportsStatusCounts = contracts.reduce((acc, contract) => {
            acc[contract.estatusContrato] = (acc[contract.estatusContrato] || 0) + 1;
            return acc;
        }, {});
        const reportsStatusLabels = Object.keys(reportsStatusCounts);
        const reportsStatusData = Object.values(reportsStatusCounts);

        reportsContractStatusChartInstance = new Chart(reportsContractStatusChartCanvas, {
            type: 'doughnut', // Otra opción visual
            data: {
                labels: reportsStatusLabels,
                datasets: [{
                    label: 'Número de Contratos',
                    data: reportsStatusData,
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.6)', // Activo (verde)
                        'rgba(255, 193, 7, 0.6)', // En Revisión (amarillo)
                        'rgba(0, 123, 255, 0.6)', // Finalizado (azul)
                        'rgba(108, 117, 125, 0.6)', // Suspendido (gris)
                        'rgba(220, 53, 69, 0.6)'  // Cancelado (rojo)
                    ],
                    borderColor: '#fff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribución de Contratos por Estado'
                    }
                }
            }
        });

        // 4. Contratos por Región
        if (reportsContractRegionChartInstance) {
            reportsContractRegionChartInstance.destroy();
        }
        const regionCounts = contracts.reduce((acc, contract) => {
            const region = contract.region || 'Sin Región';
            acc[region] = (acc[region] || 0) + 1;
            return acc;
        }, {});
        const regionLabels = Object.keys(regionCounts);
        const regionData = Object.values(regionCounts);

        reportsContractRegionChartInstance = new Chart(reportsContractRegionChartCanvas, {
            type: 'bar',
            data: {
                labels: regionLabels,
                datasets: [{
                    label: 'Número de Contratos',
                    data: regionData,
                    backgroundColor: 'rgba(255, 159, 64, 0.6)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Número de Contratos' }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Contratos por Región'
                    }
                }
            }
        });
    }

    // Funciones de Exportación (generalizadas para gráficos)
    async function exportFirstChartToImage() {
        const activeSection = document.querySelector('.content-section.active');
        let canvasToExport = null;

        // Determinar qué canvas exportar basado en la sección activa
        if (activeSection.id === 'dashboard-section' && dashboardPhysicalAdvanceChartCanvas) {
            canvasToExport = dashboardPhysicalAdvanceChartCanvas;
        } else if (activeSection.id === 'reports-section' && reportsPhysicalAdvanceChartCanvas) {
            // Puedes elegir qué gráfico exportar si hay varios, aquí tomamos el primero como "primer gráfico"
            canvasToExport = reportsPhysicalAdvanceChartCanvas;
        } else {
            showToast('No hay un gráfico visible para exportar en esta sección.', 'warning');
            return;
        }

        if (canvasToExport) {
            const dataURL = canvasToExport.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'grafico.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Gráfico exportado como imagen.', 'success');
        } else {
            showToast('No se encontró el canvas del gráfico para exportar.', 'error');
        }
    }

    async function exportAllChartsToPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('portrait', 'pt', 'letter'); // Tamaño carta, vertical

        const chartsToExport = [];
        const activeSection = document.querySelector('.content-section.active');

        if (activeSection.id === 'dashboard-section') {
            if (dashboardPhysicalAdvanceChartCanvas) chartsToExport.push(dashboardPhysicalAdvanceChartCanvas);
            if (dashboardContractStatusChartCanvas) chartsToExport.push(dashboardContractStatusChartCanvas);
        } else if (activeSection.id === 'reports-section') {
            if (reportsPhysicalAdvanceChartCanvas) chartsToExport.push(reportsPhysicalAdvanceChartCanvas);
            if (reportsContractModalitiesChartCanvas) chartsToExport.push(reportsContractModalitiesChartCanvas);
            if (reportsContractStatusChartCanvas) chartsToExport.push(reportsContractStatusChartCanvas);
            if (reportsContractRegionChartCanvas) chartsToExport.push(reportsContractRegionChartCanvas);
        }

        if (chartsToExport.length === 0) {
            showToast('No hay gráficos para exportar en esta sección.', 'warning');
            return;
        }

        let yPos = 50; // Posición inicial Y en el PDF

        for (let i = 0; i < chartsToExport.length; i++) {
            const canvas = chartsToExport[i];
            const imgData = await html2canvas(canvas, { scale: 2 }).then(canvas => canvas.toDataURL('image/png'));
            const imgWidth = 550; // Ancho fijo para la imagen en el PDF
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Verificar si hay suficiente espacio en la página
            if (yPos + imgHeight > doc.internal.pageSize.height - 50 && i > 0) { // -50 para un margen inferior
                doc.addPage();
                yPos = 50; // Reiniciar posición Y en la nueva página
            }

            doc.addImage(imgData, 'PNG', 30, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 20; // Espacio entre gráficos
        }

        doc.save('graficos.pdf');
        showToast('Gráficos exportados a PDF.', 'success');
    }

    // Funciones de exportación de tablas (Existentes, solo confirmamos su presencia)
    async function exportContractsToExcel() {
        const contracts = await db.contracts.toArray();
        const data = contracts.map(c => ({
            'N° Proveedor': c.numeroProveedor,
            'N° SICAC': c.nSicac,
            'Nombre Contrato': c.descripcionContrato, // Usamos la descripción como nombre del contrato
            'Fecha Firma': c.fechaFirmaContrato,
            'Fecha Inicio': c.fechaInicio,
            'Fecha Terminación': c.fechaTerminacion,
            'Duración (Días)': c.periodoCulminacionDias,
            'Monto Original': c.montoOriginal,
            'Monto Modificado': c.montoModificado,
            'Monto Total Contrato': c.montoTotalContrato,
            'Estado': c.estatusContrato,
            'Moneda': c.tipoMoneda,
            'Observaciones': c.observaciones
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Contratos");
        XLSX.writeFile(wb, "contratos.xlsx");
        showToast('Datos de contratos exportados a Excel.', 'success');
    }

    async function exportContractsToPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape'); // Orientación horizontal

        const contracts = await db.contracts.toArray();
        const head = [['N° PROVEEDOR', 'N° SICAC', 'FECHA INICIO', 'FECHA FINAL', 'DURACIÓN (DÍAS)', 'MONTO TOTAL', 'ESTADO']];
        const body = contracts.map(c => [
            c.numeroProveedor,
            c.nSicac,
            c.fechaInicio,
            c.fechaTerminacion,
            c.periodoCulminacionDias,
            `${c.tipoMoneda} ${parseFloat(c.montoTotalContrato).toFixed(2)}`,
            c.estatusContrato
        ]);

        doc.autoTable({
            head: head,
            body: body,
            startY: 20,
            theme: 'striped',
            styles: {
                fontSize: 8,
                cellPadding: 2,
                halign: 'center'
            },
            headStyles: {
                fillColor: [0, 123, 255], // Color de tu primary-color
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [242, 242, 242]
            }
        });

        doc.save('lista_contratos.pdf');
        showToast('Lista de contratos exportada a PDF.', 'success');
    }


    // 4. Manejadores de Eventos

    // Navegación de pestañas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            contentSections.forEach(section => {
                if (section.id === targetTab) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });

            // Lógica específica al cambiar de pestaña
            if (targetTab === 'contract-list-section') {
                loadContracts();
            } else if (targetTab === 'hes-management-section') {
                populateHesContractSelect();
                loadHes();
            } else if (targetTab === 'advance-management-section') { // Ahora es Avance Físico
                populatePhysicalAdvanceContractSelect();
                loadPhysicalAdvances();
            } else if (targetTab === 'reports-section') { // Ahora es Resumen Gráfico
                renderReportsCharts(); // Renderiza todos los gráficos de reportes
            } else if (targetTab === 'dashboard-section') {
                updateDashboardCards();
                renderDashboardCharts();
            }
        });
    });

    // Eventos para el formulario de contratos
    addPartidaBtn.addEventListener('click', () => addPartidaRow(null, partidasTableBody.rows.length)); // Pasa el índice para N°
    fechaInicioInput.addEventListener('change', calculatePeriodoCulminacionDias);
    fechaTerminacionInput.addEventListener('change', calculatePeriodoCulminacionDias);
    montoModificadoInput.addEventListener('input', calculateContractAmounts); // Recalcular monto total al modificar este campo

    contractForm.addEventListener('submit', handleContractFormSubmit);
    clearContractFormBtn.addEventListener('click', clearContractForm);

    // Eventos para filtros de contratos
    applyFiltersBtn.addEventListener('click', loadContracts);
    clearFiltersBtn.addEventListener('click', () => {
        filterContractNumber.value = '';
        filterSicac.value = '';
        filterFechaInicio.value = '';
        filterFechaFinal.value.value = '';
        filterModalidad.value = '';
        filterStatus.value = '';
        loadContracts();
    });

    // Eventos para HES
    hesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const hesData = {
            contractId: parseInt(hesContractIdSelect.value),
            hesDate: document.getElementById('hes-date').value,
            hesDescription: document.getElementById('hes-description').value,
            hesAmount: parseFloat(document.getElementById('hes-amount').value),
            hesStatus: document.getElementById('hes-status').value,
            hesNotes: document.getElementById('hes-notes').value
        };

        try {
            if (currentEditHesId) {
                await db.hes.update(currentEditHesId, hesData);
                showToast('HES actualizado con éxito.', 'success');
            } else {
                await db.hes.add(hesData);
                showToast('HES guardado con éxito.', 'success');
            }
            clearHesForm();
            loadHes();
            updateDashboardCards();
        } catch (error) {
            console.error('Error al guardar/actualizar HES:', error);
            showToast('Error al guardar/actualizar HES. Revisa la consola.', 'error');
        }
    });
    clearHesFormBtn.addEventListener('click', clearHesForm);

    // Eventos para Avance Físico
    physicalAdvanceForm.addEventListener('submit', handlePhysicalAdvanceFormSubmit);
    clearPhysicalAdvanceFormBtn.addEventListener('click', clearPhysicalAdvanceForm);

    // Eventos de exportación (tablas)
    exportExcelBtn.addEventListener('click', exportContractsToExcel);
    exportPdfBtn.addEventListener('click', exportContractsToPdf);

    // Eventos de exportación (gráficos)
    exportGraphicPdfBtn.addEventListener('click', exportAllChartsToPdf);
    exportGraphicImageBtn.addEventListener('click', exportFirstChartToImage);


    // 5. Carga inicial de datos y UI
    updateDashboardCards();
    renderDashboardCharts();
    // Asegurarse de que la primera pestaña (Dashboard) esté activa al cargar
    document.querySelector('.tab-btn[data-tab="dashboard-section"]').click();

    // Llama a populatePhysicalAdvanceContractSelect para cargar los contratos en el select de avance físico
    // Esto es importante para que el select esté lleno cuando se navegue a esa pestaña.
    populatePhysicalAdvanceContractSelect();
});