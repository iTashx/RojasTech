// Inicialización de Dexie.js
const db = new Dexie('ContractsDB');
db.version(1).stores({
    contracts: '++id, numeroProveedor, sicacNumber, fechaInicio, fechaTerminacion, fechaFirma, totalContractAmount, status', // index fields
    modalities: '++id, name',
    hes: '++id, contractId, hesNumber, hesDate',
    advances: '++id, contractId, advanceDate'
});

// Variables globales para la gestión de partidas y contratos
let partidaCounter = 0;
let editingContractId = null; // Para saber si estamos editando o creando un nuevo contrato

// --- Toast Notification Function ---
function showToast(message, type = 'info') {
    const toast = document.getElementById('liveToast');
    const toastBody = toast.querySelector('.toast-body');
    toastBody.textContent = message;

    // Reset and add appropriate classes for styling (optional, depends on your CSS)
    toast.className = 'toast hide'; // Reset classes
    if (type === 'success') {
        toast.classList.add('bg-success', 'text-white');
    } else if (type === 'error') {
        toast.classList.add('bg-danger', 'text-white');
    } else if (type === 'warning') {
        toast.classList.add('bg-warning', 'text-dark');
    } else { // info
        toast.classList.add('bg-info', 'text-white');
    }

    const bootstrapToast = new bootstrap.Toast(toast);
    bootstrapToast.show();
}

// --- DOMContentLoaded: Carga inicial y Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
    // Toggle sidebar
    const menuToggle = document.getElementById('menu-toggle');
    const wrapper = document.getElementById('wrapper');
    if (menuToggle && wrapper) {
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            wrapper.classList.toggle('toggled');
        });
    }

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', async function() {
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

            const targetId = this.dataset.target;
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            this.classList.add('active');

            // Specific actions for each tab
            if (targetId === 'general-summary') {
                updateDashboardStats();
                loadModalities('modalidad-contratacion'); // Ensure modalities are loaded for the form
            } else if (targetId === 'list-contracts') {
                loadContractsTable();
                loadModalities('filter-modalidad'); // Load modalities for filters
            } else if (targetId === 'new-edit-contract') {
                loadModalities('modalidad-contratacion'); // Load modalities for the contract form
                clearContractForm(); // Ensure a clean form when entering
            } else if (targetId === 'hes-management') {
                loadContractsForHES();
            } else if (targetId === 'advance-physical') {
                loadContractsForAdvance();
            } else if (targetId === 'graphic-summary') {
                renderCharts(); // Render all charts
            } else if (targetId === 'reports-view') {
                loadContractsForReports();
            }
        });
    });

    // --- Contract Form Event Listeners ---
    const contractForm = document.getElementById('contract-form');
    if (contractForm) {
        contractForm.addEventListener('submit', handleContractFormSubmit);
    }

    const limpiarFormularioBtn = document.getElementById('limpiar-formulario');
    if (limpiarFormularioBtn) {
        limpiarFormularioBtn.addEventListener('click', clearContractForm);
    }

    // Duración (Días) calculation
    const fechaInicioInput = document.getElementById('fecha-inicio');
    const fechaTerminacionInput = document.getElementById('fecha-terminacion');
    const duracionDiasInput = document.getElementById('duracion-dias');

    if (fechaInicioInput && fechaTerminacionInput && duracionDiasInput) {
        fechaInicioInput.addEventListener('change', updateDuracionDias);
        fechaTerminacionInput.addEventListener('change', updateDuracionDias);
    }

    function updateDuracionDias() {
        const startDate = new Date(fechaInicioInput.value);
        const endDate = new Date(fechaTerminacionInput.value);

        if (fechaInicioInput.value && fechaTerminacionInput.value && startDate <= endDate) {
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            duracionDiasInput.value = diffDays;
        } else {
            duracionDiasInput.value = ''; // Clear if dates are invalid or incomplete
            if (fechaInicioInput.value && fechaTerminacionInput.value && startDate > endDate) {
                showToast('La fecha de término debe ser posterior o igual a la fecha de inicio.', 'warning');
            }
        }
    }

    // Monto Modificado event listener
    const montoModificadoInput = document.getElementById('monto-modificado');
    if (montoModificadoInput) {
        montoModificadoInput.addEventListener('input', updateMontoOriginalAndTotal);
    }

    // --- Partidas del Contrato (Add/Remove) ---
    const addPartidaBtn = document.getElementById('add-partida-btn');
    const partidasTableBody = document.getElementById('partidas-table-body');

    if (addPartidaBtn && partidasTableBody) {
        addPartidaBtn.addEventListener('click', () => {
            partidaCounter++;
            const row = document.createElement('tr');
            row.id = `partida-row-${partidaCounter}`;

            row.innerHTML = `
                <td>${partidaCounter}</td>
                <td><input type="text" class="form-control" name="descripcion" data-partida-id="${partidaCounter}" required></td>
                <td><input type="number" class="form-control partida-qty" name="cantidad" data-partida-id="${partidaCounter}" min="0" step="any" value="0" required></td>
                <td><input type="text" class="form-control" name="umd" data-partida-id="${partidaCounter}"></td>
                <td><input type="number" class="form-control partida-price" name="precio-unitario" data-partida-id="${partidaCounter}" min="0" step="0.01" value="0.00" required></td>
                <td><input type="number" class="form-control partida-total" name="total" data-partida-id="${partidaCounter}" value="0.00" readonly></td>
                <td>
                    <button type="button" class="btn btn-danger btn-sm remove-partida-btn" data-partida-id="${partidaCounter}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            partidasTableBody.appendChild(row);

            const newQtyInput = row.querySelector(`.partida-qty[data-partida-id="${partidaCounter}"]`);
            const newPriceInput = row.querySelector(`.partida-price[data-partida-id="${partidaCounter}"]`);
            const newRemoveBtn = row.querySelector(`.remove-partida-btn[data-partida-id="${partidaCounter}"]`);

            if (newQtyInput) newQtyInput.addEventListener('input', updatePartidaTotal);
            if (newPriceInput) newPriceInput.addEventListener('input', updatePartidaTotal);
            if (newRemoveBtn) {
                newRemoveBtn.addEventListener('click', function() {
                    this.closest('tr').remove();
                    updateMontoOriginalAndTotal();
                    // Re-index row numbers if needed after removal (more complex)
                });
            }
            updateMontoOriginalAndTotal();
        });
    }

    function updatePartidaTotal(event) {
        const partidaId = event.target.dataset.partidaId;
        const row = document.getElementById(`partida-row-${partidaId}`);
        if (row) {
            const cantidad = parseFloat(row.querySelector(`.partida-qty[data-partida-id="${partidaId}"]`).value) || 0;
            const precioUnitario = parseFloat(row.querySelector(`.partida-price[data-partida-id="${partidaId}"]`).value) || 0;
            const totalInput = row.querySelector(`.partida-total[data-partida-id="${partidaId}"]`);
            if (totalInput) {
                totalInput.value = (cantidad * precioUnitario).toFixed(2);
                updateMontoOriginalAndTotal();
            }
        }
    }

    function updateMontoOriginalAndTotal() {
        const partidaTotalInputs = document.querySelectorAll('.partida-total');
        let calculatedMontoOriginal = 0;
        partidaTotalInputs.forEach(input => {
            calculatedMontoOriginal += parseFloat(input.value) || 0;
        });

        const montoOriginalInput = document.getElementById('monto-original');
        if (montoOriginalInput) {
            montoOriginalInput.value = calculatedMontoOriginal.toFixed(2);
        }

        const montoModificadoInput = document.getElementById('monto-modificado');
        const montoTotalContratoInput = document.getElementById('monto-total-contrato');

        let montoModificado = parseFloat(montoModificadoInput?.value) || 0;
        if (montoTotalContratoInput) {
            montoTotalContratoInput.value = (calculatedMontoOriginal + montoModificado).toFixed(2);
        }
    }

    // --- Modality Management (Add/Remove) ---
    const saveNewModalityBtn = document.getElementById('save-new-modality-btn');
    const newModalityNameInput = document.getElementById('new-modality-name');
    const modalityToRemoveSelect = document.getElementById('modality-to-remove-select');
    const confirmRemoveModalityBtn = document.getElementById('confirm-remove-modality-btn');

    if (saveNewModalityBtn && newModalityNameInput) {
        saveNewModalityBtn.addEventListener('click', async () => {
            const modalityName = newModalityNameInput.value.trim();
            if (modalityName) {
                try {
                    await db.modalities.add({ name: modalityName });
                    showToast('Modalidad añadida con éxito.', 'success');
                    newModalityNameInput.value = '';
                    bootstrap.Modal.getInstance(document.getElementById('addModalityModal'))?.hide();
                    loadModalities('modalidad-contratacion'); // Refresh dropdowns
                    loadModalities('filter-modalidad');
                } catch (error) {
                    showToast('Error al añadir modalidad: ' + error.message, 'error');
                    console.error('Error adding modality:', error);
                }
            } else {
                showToast('El nombre de la modalidad no puede estar vacío.', 'warning');
            }
        });
    }

    // Populate remove modality select on modal open
    const removeModalityModal = document.getElementById('removeModalityModal');
    if (removeModalityModal) {
        removeModalityModal.addEventListener('show.bs.modal', () => {
            loadModalities('modality-to-remove-select');
        });
    }

    if (confirmRemoveModalityBtn && modalityToRemoveSelect) {
        confirmRemoveModalityBtn.addEventListener('click', async () => {
            const modalityId = parseInt(modalityToRemoveSelect.value);
            if (!isNaN(modalityId)) {
                try {
                    await db.modalities.delete(modalityId);
                    showToast('Modalidad eliminada con éxito.', 'success');
                    bootstrap.Modal.getInstance(document.getElementById('removeModalityModal'))?.hide();
                    loadModalities('modalidad-contratacion'); // Refresh dropdowns
                    loadModalities('filter-modalidad');
                } catch (error) {
                    showToast('Error al eliminar modalidad: ' + error.message, 'error');
                    console.error('Error deleting modality:', error);
                }
            } else {
                showToast('Seleccione una modalidad para eliminar.', 'warning');
            }
        });
    }

    // --- Contract List Filters ---
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', loadContractsTable);
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            document.getElementById('filter-proveedor').value = '';
            document.getElementById('filter-sicac').value = '';
            document.getElementById('filter-fecha-inicio').value = '';
            document.getElementById('filter-fecha-final').value = '';
            document.getElementById('filter-modalidad').value = 'Todas';
            document.getElementById('filter-estado').value = 'Todas';
            loadContractsTable(); // Reload table after clearing filters
        });
    }

    // --- Contract List Export Buttons ---
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportContractsToExcel);
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportContractsToPdf);

    // --- HES Management Events ---
    const saveHesBtn = document.getElementById('save-hes-btn');
    if (saveHesBtn) saveHesBtn.addEventListener('click', saveHES);
    const selectContractHes = document.getElementById('select-contract-hes');
    if (selectContractHes) selectContractHes.addEventListener('change', loadHESForContract);

    // --- Advance Physical Events ---
    const saveAdvanceBtn = document.getElementById('save-advance-btn');
    if (saveAdvanceBtn) saveAdvanceBtn.addEventListener('click', saveAdvance);
    const selectContractAdvance = document.getElementById('select-contract-advance');
    if (selectContractAdvance) selectContractAdvance.addEventListener('change', loadAdvanceHistory);

    // --- Graphic Summary Export Buttons ---
    const exportGraphicPdfBtn = document.getElementById('exportGraphicPdfBtn');
    const exportGraphicImageBtn = document.getElementById('exportGraphicImageBtn');

    if (exportGraphicPdfBtn) exportGraphicPdfBtn.addEventListener('click', exportAllChartsToPdf);
    if (exportGraphicImageBtn) exportGraphicImageBtn.addEventListener('click', exportFirstChartToImage);

    // --- Reports View Events ---
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) generateReportBtn.addEventListener('click', generateReport);

    // Initial load: Activate the first tab
    document.querySelector('.tab-btn[data-target="general-summary"])')?.click();
});

// --- Core Contract Management Functions ---

async function handleContractFormSubmit(event) {
    event.preventDefault();

    const contractData = {
        numeroProveedor: document.getElementById('numero-proveedor').value,
        fechaFirma: document.getElementById('fecha-firma-contrato').value,
        fechaCreado: document.getElementById('fecha-creado').value,
        fechaInicio: document.getElementById('fecha-inicio').value,
        fechaTerminacion: document.getElementById('fecha-terminacion').value,
        duracionDias: parseInt(document.getElementById('duracion-dias').value) || 0,
        sicacNumber: document.getElementById('numero-sicac').value,
        divisionArea: document.getElementById('division-area').value,
        eemn: document.getElementById('eemn').value,
        region: document.getElementById('region').value,
        naturalezaContratacion: document.getElementById('naturaleza-contratacion').value,
        lineaServicio: document.getElementById('linea-servicio').value,
        noPeticionOferta: document.getElementById('no-peticion-oferta').value,
        modality: document.getElementById('modalidad-contratacion').value,
        regimenLaboral: document.getElementById('regimen-laboral').value,
        descripcionContrato: document.getElementById('descripcion-contrato').value,
        fechaCambioAlcance: document.getElementById('fecha-cambio-alcance').value,
        montoOriginal: parseFloat(document.getElementById('monto-original').value) || 0,
        montoModificado: parseFloat(document.getElementById('monto-modificado').value) || 0,
        totalContractAmount: parseFloat(document.getElementById('monto-total-contrato').value) || 0,
        noContratoInterno: document.getElementById('no-contrato-interno').value,
        observaciones: document.getElementById('observaciones').value,
        status: document.getElementById('status-contrato').value,
        moneda: document.getElementById('moneda-contrato').value,
        // Archivos adjuntos (más complejo, se manejaría con File API o URL.createObjectURL)
        // Por ahora, solo guardamos el nombre si existe
        attachedFiles: [], // Placeholder for file names/data
        partidas: [], // Array to store partida objects
        physicalAdvance: 0, // Initialize physical advance for new contracts
        financialAdvance: 0 // Initialize financial advance for new contracts
    };

    // Get partidas data
    document.querySelectorAll('#partidas-table-body tr').forEach(row => {
        const partidaId = row.id.split('-')[2];
        const descripcion = row.querySelector(`input[name="descripcion"][data-partida-id="${partidaId}"]`).value;
        const cantidad = parseFloat(row.querySelector(`input[name="cantidad"][data-partida-id="${partidaId}"]`).value) || 0;
        const umd = row.querySelector(`input[name="umd"][data-partida-id="${partidaId}"]`).value;
        const precioUnitario = parseFloat(row.querySelector(`input[name="precio-unitario"][data-partida-id="${partidaId}"]`).value) || 0;
        const total = parseFloat(row.querySelector(`input[name="total"][data-partida-id="${partidaId}"]`).value) || 0;
        contractData.partidas.push({ descripcion, cantidad, umd, precioUnitario, total });
    });

    try {
        if (editingContractId) {
            await db.contracts.update(editingContractId, contractData);
            showToast('Contrato actualizado con éxito.', 'success');
            editingContractId = null; // Clear editing state
        } else {
            // Check for duplicate SICAC number
            const existingContract = await db.contracts.where({ sicacNumber: contractData.sicacNumber }).first();
            if (existingContract) {
                showToast('Error: Ya existe un contrato con este número SICAC.', 'error');
                return;
            }
            await db.contracts.add(contractData);
            showToast('Contrato guardado con éxito.', 'success');
        }
        clearContractForm();
        updateDashboardStats(); // Refresh summary stats
    } catch (error) {
        showToast('Error al guardar el contrato: ' + error.message, 'error');
        console.error('Error saving contract:', error);
    }
}

function clearContractForm() {
    document.getElementById('contract-form')?.reset();
    document.getElementById('partidas-table-body').innerHTML = ''; // Clear partidas
    partidaCounter = 0; // Reset counter
    editingContractId = null;
    document.getElementById('guardar-actualizar-contrato').textContent = 'Guardar/Actualizar Contrato'; // Reset button text
    showToast('Formulario limpiado.', 'info');
}

async function loadModalities(selectId) {
    const selectElement = document.getElementById(selectId);
    if (selectElement) {
        selectElement.innerHTML = '';
        if (selectId === 'filter-modalidad') {
            selectElement.innerHTML = '<option value="Todas">Todas</option>';
        } else {
            selectElement.innerHTML = '<option value="">Selecciona una modalidad</option>';
        }
        const modalities = await db.modalities.toArray();
        modalities.forEach(modality => {
            const option = document.createElement('option');
            option.value = modality.id; // Store ID for removal
            option.textContent = modality.name;
            selectElement.appendChild(option);
        });
    }
}

async function loadContractsTable() {
    const contractsTableBody = document.getElementById('contracts-table-body');
    if (!contractsTableBody) return;

    let contracts = await db.contracts.toArray();

    // Apply filters
    const filterProveedor = document.getElementById('filter-proveedor')?.value.toLowerCase() || '';
    const filterSicac = document.getElementById('filter-sicac')?.value.toLowerCase() || '';
    const filterFechaInicio = document.getElementById('filter-fecha-inicio')?.value;
    const filterFechaFinal = document.getElementById('filter-fecha-final')?.value;
    const filterModalidad = document.getElementById('filter-modalidad')?.value;
    const filterEstado = document.getElementById('filter-estado')?.value;

    contracts = contracts.filter(contract => {
        const matchesProveedor = filterProveedor ? contract.numeroProveedor.toLowerCase().includes(filterProveedor) : true;
        const matchesSicac = filterSicac ? contract.sicacNumber.toLowerCase().includes(filterSicac) : true;
        const matchesFechaInicio = filterFechaInicio ? contract.fechaInicio >= filterFechaInicio : true;
        const matchesFechaFinal = filterFechaFinal ? contract.fechaTerminacion <= filterFechaFinal : true; // Assuming fechaTerminacion
        const matchesModalidad = filterModalidad && filterModalidad !== 'Todas' ? (contract.modality === (filterModalidad)) : true; // Compare with modality ID
        const matchesEstado = filterEstado && filterEstado !== 'Todas' ? contract.status === filterEstado : true;

        return matchesProveedor && matchesSicac && matchesFechaInicio && matchesFechaFinal && matchesModalidad && matchesEstado;
    });

    contractsTableBody.innerHTML = ''; // Clear existing rows

    for (const contract of contracts) {
        const row = document.createElement('tr');
        const modalityName = contract.modality ? (await db.modalities.get(parseInt(contract.modality)))?.name || 'N/A' : 'N/A';

        // Calculate physical and financial advance for display
        const { physicalAdvance, financialAdvance } = calculateContractAdvances(contract);
        contract.physicalAdvance = physicalAdvance; // Update in object for potential export/charts
        contract.financialAdvance = financialAdvance;

        row.innerHTML = `
            <td>${contract.numeroProveedor}</td>
            <td>${contract.sicacNumber}</td>
            <td>${contract.fechaInicio}</td>
            <td>${contract.fechaTerminacion}</td>
            <td>${contract.duracionDias}</td>
            <td>${contract.moneda} ${contract.totalContractAmount.toFixed(2)}</td>
            <td>${physicalAdvance.toFixed(2)}%</td>
            <td>${financialAdvance.toFixed(2)}%</td>
            <td>${contract.attachedFiles.length > 0 ? `<a href="#" data-files="${JSON.stringify(contract.attachedFiles)}">Ver Archivos</a>` : 'N/A'}</td>
            <td>
                <button class="btn btn-warning btn-sm edit-contract-btn me-1" data-id="${contract.id}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm delete-contract-btn" data-id="${contract.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        contractsTableBody.appendChild(row);
    }

    // Add event listeners for edit/delete buttons
    document.querySelectorAll('.edit-contract-btn').forEach(button => {
        button.addEventListener('click', (e) => editContract(parseInt(e.currentTarget.dataset.id)));
    });
    document.querySelectorAll('.delete-contract-btn').forEach(button => {
        button.addEventListener('click', (e) => deleteContract(parseInt(e.currentTarget.dataset.id)));
    });
}

async function editContract(id) {
    const contract = await db.contracts.get(id);
    if (contract) {
        editingContractId = id;

        document.getElementById('numero-proveedor').value = contract.numeroProveedor;
        document.getElementById('fecha-firma-contrato').value = contract.fechaFirma;
        document.getElementById('fecha-creado').value = contract.fechaCreado;
        document.getElementById('fecha-inicio').value = contract.fechaInicio;
        document.getElementById('fecha-terminacion').value = contract.fechaTerminacion;
        document.getElementById('duracion-dias').value = contract.duracionDias; // Should be calculated but can be pre-filled
        document.getElementById('numero-sicac').value = contract.sicacNumber;
        document.getElementById('division-area').value = contract.divisionArea;
        document.getElementById('eemn').value = contract.eemn;
        document.getElementById('region').value = contract.region;
        document.getElementById('naturaleza-contratacion').value = contract.naturalezaContratacion;
        document.getElementById('linea-servicio').value = contract.lineaServicio;
        document.getElementById('no-peticion-oferta').value = contract.noPeticionOferta;
        document.getElementById('modalidad-contratacion').value = contract.modality;
        document.getElementById('regimen-laboral').value = contract.regimenLaboral;
        document.getElementById('descripcion-contrato').value = contract.descripcionContrato;
        document.getElementById('fecha-cambio-alcance').value = contract.fechaCambioAlcance;
        document.getElementById('monto-original').value = contract.montoOriginal.toFixed(2);
        document.getElementById('monto-modificado').value = contract.montoModificado.toFixed(2);
        document.getElementById('monto-total-contrato').value = contract.totalContractAmount.toFixed(2);
        document.getElementById('no-contrato-interno').value = contract.noContratoInterno;
        document.getElementById('observaciones').value = contract.observaciones;
        document.getElementById('status-contrato').value = contract.status;
        document.getElementById('moneda-contrato').value = contract.moneda;

        // Load partidas
        const partidasTableBody = document.getElementById('partidas-table-body');
        partidasTableBody.innerHTML = '';
        partidaCounter = 0;
        if (contract.partidas && contract.partidas.length > 0) {
            contract.partidas.forEach(p => {
                partidaCounter++;
                const row = document.createElement('tr');
                row.id = `partida-row-${partidaCounter}`;
                row.innerHTML = `
                    <td>${partidaCounter}</td>
                    <td><input type="text" class="form-control" name="descripcion" data-partida-id="${partidaCounter}" value="${p.descripcion || ''}" required></td>
                    <td><input type="number" class="form-control partida-qty" name="cantidad" data-partida-id="${partidaCounter}" min="0" step="any" value="${p.cantidad || 0}" required></td>
                    <td><input type="text" class="form-control" name="umd" data-partida-id="${partidaCounter}" value="${p.umd || ''}"></td>
                    <td><input type="number" class="form-control partida-price" name="precio-unitario" data-partida-id="${partidaCounter}" min="0" step="0.01" value="${p.precioUnitario || 0.00}" required></td>
                    <td><input type="number" class="form-control partida-total" name="total" data-partida-id="${partidaCounter}" value="${p.total || 0.00}" readonly></td>
                    <td>
                        <button type="button" class="btn btn-danger btn-sm remove-partida-btn" data-partida-id="${partidaCounter}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                partidasTableBody.appendChild(row);

                const newQtyInput = row.querySelector(`.partida-qty[data-partida-id="${partidaCounter}"]`);
                const newPriceInput = row.querySelector(`.partida-price[data-partida-id="${partidaCounter}"]`);
                const newRemoveBtn = row.querySelector(`.remove-partida-btn[data-partida-id="${partidaCounter}"]`);

                if (newQtyInput) newQtyInput.addEventListener('input', updatePartidaTotal);
                if (newPriceInput) newPriceInput.addEventListener('input', updatePartidaTotal);
                if (newRemoveBtn) {
                    newRemoveBtn.addEventListener('click', function() {
                        this.closest('tr').remove();
                        updateMontoOriginalAndTotal();
                    });
                }
            });
            updateMontoOriginalAndTotal(); // Ensure totals are correct after loading
        }

        // Change button text
        document.getElementById('guardar-actualizar-contrato').textContent = 'Actualizar Contrato';

        // Switch to the New/Edit Contract tab
        document.querySelector('.tab-btn[data-target="new-edit-contract"])')?.click();
        showToast(`Editando contrato con SICAC: ${contract.sicacNumber}`, 'info');

    } else {
        showToast('Contrato no encontrado para editar.', 'error');
    }
}

async function deleteContract(id) {
    if (confirm('¿Está seguro de que desea eliminar este contrato? Esta acción es irreversible.')) {
        try {
            await db.contracts.delete(id);
            showToast('Contrato eliminado con éxito.', 'success');
            loadContractsTable(); // Refresh table
            updateDashboardStats(); // Refresh summary stats
        } catch (error) {
            showToast('Error al eliminar el contrato: ' + error.message, 'error');
            console.error('Error deleting contract:', error);
        }
    }
}

async function updateDashboardStats() {
    const contracts = await db.contracts.toArray();
    const totalContracts = contracts.length;
    const totalContractedAmount = contracts.reduce((sum, c) => sum + (parseFloat(c.totalContractAmount) || 0), 0);
    const activeContracts = contracts.filter(c => c.status === 'Activo').length;
    const pendingContracts = contracts.filter(c => c.status === 'Activo' && new Date(c.fechaTerminacion) > new Date()).length; // Basic logic
    const expiringContracts = contracts.filter(c => {
        const endDate = new Date(c.fechaTerminacion);
        const today = new Date();
        const diffTime = Math.abs(endDate.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return c.status === 'Activo' && endDate > today && diffDays <= 30; // Expiring within 30 days
    }).length;
    const totalPhysicalAdvance = contracts.reduce((sum, c) => sum + (c.physicalAdvance || 0), 0);
    const avgPhysicalAdvance = totalContracts > 0 ? (totalPhysicalAdvance / totalContracts) : 0;

    document.getElementById('total-contracts').textContent = totalContracts;
    document.getElementById('total-contracted-amount').textContent = `USD ${totalContractedAmount.toFixed(2)}`;
    document.getElementById('active-contracts').textContent = activeContracts;
    document.getElementById('pending-contracts').textContent = pendingContracts;
    document.getElementById('expiring-contracts').textContent = expiringContracts;
    document.getElementById('avg-physical-advance').textContent = `${avgPhysicalAdvance.toFixed(2)}%`;
}

// --- HES Management Functions ---
async function loadContractsForHES() {
    const selectContractHes = document.getElementById('select-contract-hes');
    if (!selectContractHes) return;

    selectContractHes.innerHTML = '<option value="">Seleccione un contrato</option>';
    const contracts = await db.contracts.toArray();
    contracts.forEach(contract => {
        const option = document.createElement('option');
        option.value = contract.id;
        option.textContent = `${contract.sicacNumber} - ${contract.numeroProveedor}`;
        selectContractHes.appendChild(option);
    });
    // Clear HES table when changing contract selection
    document.getElementById('hes-table-body').innerHTML = '';
}

async function saveHES() {
    const contractId = parseInt(document.getElementById('select-contract-hes').value);
    const hesNumber = document.getElementById('hes-number').value;
    const hesDate = document.getElementById('hes-date').value;
    const hesAmount = parseFloat(document.getElementById('hes-amount').value) || 0;
    const hesDescription = document.getElementById('hes-description').value;

    if (!contractId || !hesNumber || !hesDate || isNaN(hesAmount)) {
        showToast('Por favor, complete todos los campos de HES.', 'warning');
        return;
    }

    try {
        await db.hes.add({
            contractId: contractId,
            hesNumber: hesNumber,
            hesDate: hesDate,
            hesAmount: hesAmount,
            hesDescription: hesDescription
        });
        showToast('HES guardado con éxito.', 'success');
        document.getElementById('hes-number').value = '';
        document.getElementById('hes-date').value = '';
        document.getElementById('hes-amount').value = '0.00';
        document.getElementById('hes-description').value = '';
        loadHESForContract(); // Refresh HES list for the selected contract
        updateDashboardStats(); // Potentially update financial advance stats
    } catch (error) {
        showToast('Error al guardar HES: ' + error.message, 'error');
        console.error('Error saving HES:', error);
    }
}

async function loadHESForContract() {
    const contractId = parseInt(document.getElementById('select-contract-hes').value);
    const hesTableBody = document.getElementById('hes-table-body');
    if (!hesTableBody) return;

    hesTableBody.innerHTML = '';
    if (!isNaN(contractId)) {
        const allHES = await db.hes.where({ contractId: contractId }).toArray();
        allHES.forEach(hes => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${hes.hesNumber}</td>
                <td>${hes.hesDate}</td>
                <td>USD ${hes.hesAmount.toFixed(2)}</td>
                <td>${hes.hesDescription}</td>
                <td>
                    <button class="btn btn-danger btn-sm delete-hes-btn" data-id="${hes.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            hesTableBody.appendChild(row);
        });
        document.querySelectorAll('.delete-hes-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteHES(parseInt(e.currentTarget.dataset.id), contractId));
        });
    }
}

async function deleteHES(hesId, contractId) {
    if (confirm('¿Está seguro de que desea eliminar este HES?')) {
        try {
            await db.hes.delete(hesId);
            showToast('HES eliminado con éxito.', 'success');
            loadHESForContract(); // Refresh HES list
            updateDashboardStats(); // Potentially update financial advance stats
        } catch (error) {
            showToast('Error al eliminar HES: ' + error.message, 'error');
            console.error('Error deleting HES:', error);
        }
    }
}

// --- Advance Physical Management Functions ---
async function loadContractsForAdvance() {
    const selectContractAdvance = document.getElementById('select-contract-advance');
    if (!selectContractAdvance) return;

    selectContractAdvance.innerHTML = '<option value="">Seleccione un contrato</option>';
    const contracts = await db.contracts.toArray();
    contracts.forEach(contract => {
        const option = document.createElement('option');
        option.value = contract.id;
        option.textContent = `${contract.sicacNumber} - ${contract.numeroProveedor}`;
        selectContractAdvance.appendChild(option);
    });
    // Clear advance history table when changing contract selection
    document.getElementById('advance-history-table-body').innerHTML = '';
}

async function saveAdvance() {
    const contractId = parseInt(document.getElementById('select-contract-advance').value);
    const advanceDate = document.getElementById('advance-date').value;
    const advancePercentage = parseFloat(document.getElementById('advance-percentage').value) || 0;
    const advanceComments = document.getElementById('advance-comments').value;

    if (!contractId || !advanceDate || isNaN(advancePercentage)) {
        showToast('Por favor, complete todos los campos de avance físico.', 'warning');
        return;
    }

    try {
        await db.advances.add({
            contractId: contractId,
            advanceDate: advanceDate,
            percentage: advancePercentage,
            comments: advanceComments
        });

        // Update the contract's overall physical advance
        await db.contracts.update(contractId, { physicalAdvance: advancePercentage });

        showToast('Avance físico guardado con éxito.', 'success');
        document.getElementById('advance-date').value = '';
        document.getElementById('advance-percentage').value = '0';
        document.getElementById('advance-comments').value = '';
        loadAdvanceHistory(); // Refresh advance history for the selected contract
        updateDashboardStats(); // Refresh summary stats
        loadContractsTable(); // Update advance column in list
    } catch (error) {
        showToast('Error al guardar avance físico: ' + error.message, 'error');
        console.error('Error saving advance:', error);
    }
}

async function loadAdvanceHistory() {
    const contractId = parseInt(document.getElementById('select-contract-advance').value);
    const advanceHistoryTableBody = document.getElementById('advance-history-table-body');
    if (!advanceHistoryTableBody) return;

    advanceHistoryTableBody.innerHTML = '';
    if (!isNaN(contractId)) {
        const allAdvances = await db.advances.where({ contractId: contractId }).toArray();
        allAdvances.forEach(advance => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${advance.advanceDate}</td>
                <td>${advance.percentage.toFixed(2)}%</td>
                <td>${advance.comments}</td>
                <td>
                    <button class="btn btn-danger btn-sm delete-advance-btn" data-id="${advance.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            advanceHistoryTableBody.appendChild(row);
        });
        document.querySelectorAll('.delete-advance-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteAdvance(parseInt(e.currentTarget.dataset.id), contractId));
        });
    }
}

async function deleteAdvance(advanceId, contractId) {
    if (confirm('¿Está seguro de que desea eliminar este registro de avance?')) {
        try {
            await db.advances.delete(advanceId);
            showToast('Avance eliminado con éxito.', 'success');
            loadAdvanceHistory(); // Refresh list
            // Recalculate contract's physical advance (e.g., take the latest remaining advance or reset)
            const remainingAdvances = await db.advances.where({ contractId: contractId }).toArray();
            const latestAdvance = remainingAdvances.length > 0 ? remainingAdvances.reduce((prev, current) => (prev.advanceDate > current.advanceDate) ? prev : current) : null;
            await db.contracts.update(contractId, { physicalAdvance: latestAdvance ? latestAdvance.percentage : 0 });
            updateDashboardStats();
            loadContractsTable();
        } catch (error) {
            showToast('Error al eliminar avance: ' + error.message, 'error');
            console.error('Error deleting advance:', error);
        }
    }
}

// --- Chart Rendering Functions ---
let charts = {}; // Store chart instances to destroy and re-create them

async function renderCharts() {
    const contracts = await db.contracts.toArray();

    // Destroy existing charts to prevent issues on re-render
    for (const chartId in charts) {
        if (charts[chartId]) {
            charts[chartId].destroy();
        }
    }
    charts = {}; // Reset charts object

    // 1. Gráfico de Avance Físico
    const physicalAdvanceCtx = document.getElementById('physicalAdvanceChart')?.getContext('2d');
    if (physicalAdvanceCtx) {
        const labels = contracts.map(c => c.sicacNumber || c.noContratoInterno || `Contrato ${c.id}`);
        const data = contracts.map(c => c.physicalAdvance || 0);

        charts.physicalAdvanceChart = new Chart(physicalAdvanceCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Avance Físico (%)',
                    data: data,
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
                        max: 100
                    }
                }
            }
        });
    }

    // 2. Gráfico de Montos por Modalidad de Contratación
    const modalityAmountsCtx = document.getElementById('modalityAmountsChart')?.getContext('2d');
    if (modalityAmountsCtx) {
        const modalityMap = new Map();
        for (const contract of contracts) {
            const modalityName = contract.modality ? (await db.modalities.get(parseInt(contract.modality)))?.name || 'Sin Modalidad' : 'Sin Modalidad';
            const totalAmount = parseFloat(contract.totalContractAmount || 0);
            modalityMap.set(modalityName, (modalityMap.get(modalityName) || 0) + totalAmount);
        }

        const labels = Array.from(modalityMap.keys());
        const data = Array.from(modalityMap.values());

        charts.modalityAmountsChart = new Chart(modalityAmountsCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Monto Total por Modalidad',
                    data: data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
                        'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
                        'rgba(199, 199, 199, 1)', 'rgba(83, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    }

    // 3. Gráfico de Estado de Contratos
    const contractStatusCtx = document.getElementById('contractStatusChart')?.getContext('2d');
    if (contractStatusCtx) {
        const statusMap = new Map();
        contracts.forEach(c => {
            const status = c.status || 'Desconocido';
            statusMap.set(status, (statusMap.get(status) || 0) + 1);
        });

        const labels = Array.from(statusMap.keys());
        const data = Array.from(statusMap.values());

        charts.contractStatusChart = new Chart(contractStatusCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Número de Contratos',
                    data: data,
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.6)', // Activo (green)
                        'rgba(220, 53, 69, 0.6)', // Inactivo (red)
                        'rgba(0, 123, 255, 0.6)', // Completado (blue)
                        'rgba(255, 193, 7, 0.6)', // Terminado Anticipado (yellow)
                        'rgba(108, 117, 125, 0.6)' // Desconocido (grey)
                    ],
                    borderColor: [
                        'rgba(40, 167, 69, 1)',
                        'rgba(220, 53, 69, 1)',
                        'rgba(0, 123, 255, 1)',
                        'rgba(255, 193, 7, 1)',
                        'rgba(108, 117, 125, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    }

    // 4. Gráfico de Contratos por Región
    const contractsByRegionCtx = document.getElementById('contractsByRegionChart')?.getContext('2d');
    if (contractsByRegionCtx) {
        const regionMap = new Map();
        contracts.forEach(c => {
            const region = c.region || 'Sin Región';
            regionMap.set(region, (regionMap.get(region) || 0) + 1);
        });

        const labels = Array.from(regionMap.keys());
        const data = Array.from(regionMap.values());

        charts.contractsByRegionChart = new Chart(contractsByRegionCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Número de Contratos por Región',
                    data: data,
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        precision: 0 // Ensure integer ticks
                    }
                }
            }
        });
    }
}

// --- Export Functions ---

async function exportContractsToExcel() {
    const contracts = await db.contracts.toArray();
    const data = contracts.map(contract => ({
        'N° Proveedor': contract.numeroProveedor,
        'N° SICAC': contract.sicacNumber,
        'Fecha Firma': contract.fechaFirma,
        'Fecha Creado': contract.fechaCreado,
        'Fecha Inicio': contract.fechaInicio,
        'Fecha Terminación': contract.fechaTerminacion,
        'Duración (Días)': contract.duracionDias,
        'División/Área': contract.divisionArea,
        'EEMN': contract.eemn,
        'Región': contract.region,
        'Naturaleza Contratación': contract.naturalezaContratacion,
        'Línea Servicio': contract.lineaServicio,
        'No. Petición Oferta': contract.noPeticionOferta,
        'Modalidad': contract.modality ? (db.modalities.get(parseInt(contract.modality)))?.name || 'N/A' : 'N/A', // Get name
        'Régimen Laboral': contract.regimenLaboral,
        'Descripción Contrato': contract.descripcionContrato,
        'Fecha Cambio Alcance': contract.fechaCambioAlcance,
        'Monto Original': contract.montoOriginal,
        'Monto Modificado': contract.montoModificado,
        'Monto Total Contrato': contract.totalContractAmount,
        'Moneda': contract.moneda,
        'N° Contrato Interno': contract.noContratoInterno,
        'Observaciones': contract.observaciones,
        'Estatus': contract.status,
        'Avance Físico (%)': contract.physicalAdvance,
        'Avance Financiero (%)': contract.financialAdvance,
        'Partidas': contract.partidas.map(p => `${p.descripcion} (${p.cantidad} ${p.umd} @${p.precioUnitario})`).join('; ')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contratos");
    XLSX.writeFile(wb, "contratos.xlsx");
    showToast('Datos exportados a Excel.', 'success');
}

async function exportContractsToPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape'); // Use landscape for wider table

    const contractsTable = document.getElementById('contracts-table-body');
    if (!contractsTable) {
        showToast('No se encontró la tabla de contratos.', 'error');
        return;
    }

    const tableHeaders = ['N° PROVEEDOR', 'N° SICAC', 'FECHA INICIO', 'FECHA FINAL', 'DURACIÓN (DÍAS)', 'MONTO TOTAL', 'AVANCE FÍSICO', 'AVANCE FINANCIERO', 'ESTATUS'];
    const tableData = [];

    const contracts = await db.contracts.toArray(); // Get current filtered contracts for export
    for (const contract of contracts) {
        const { physicalAdvance, financialAdvance } = calculateContractAdvances(contract);
        tableData.push([
            contract.numeroProveedor,
            contract.sicacNumber,
            contract.fechaInicio,
            contract.fechaTerminacion,
            contract.duracionDias,
            `${contract.moneda} ${contract.totalContractAmount.toFixed(2)}`,
            `${physicalAdvance.toFixed(2)}%`,
            `${financialAdvance.toFixed(2)}%`,
            contract.status
        ]);
    }

    doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 20,
        styles: {
            fontSize: 8,
            cellPadding: 1,
            halign: 'center'
        },
        headStyles: {
            fillColor: [33, 37, 41], // Dark header
            textColor: [255, 255, 255]
        },
        columnStyles: {
            // Optional: specify column widths
            0: { cellWidth: 20 },
            1: { cellWidth: 25 },
            // ... adjust as needed
        },
        margin: { top: 15, right: 10, bottom: 10, left: 10 }
    });

    doc.save('lista_contratos.pdf');
    showToast('Lista de contratos exportada a PDF.', 'success');
}

async function exportFirstChartToImage() {
    const physicalAdvanceChartCanvas = document.getElementById('physicalAdvanceChart');
    if (physicalAdvanceChartCanvas) {
        const image = physicalAdvanceChartCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = image;
        a.download = 'grafico_avance_fisico.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Gráfico de avance físico exportado como imagen.', 'success');
    } else {
        showToast('No se encontró el gráfico de avance físico para exportar.', 'error');
    }
}

async function exportAllChartsToPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('portrait', 'mm', 'a4'); // A4 portrait
    let yPos = 10;
    const margin = 10;
    const chartHeight = 100; // Fixed height for each chart in PDF

    const chartsToExport = [
        { id: 'physicalAdvanceChart', title: 'Avance Físico de Contratos' },
        { id: 'modalityAmountsChart', title: 'Montos por Modalidad de Contratación' },
        { id: 'contractStatusChart', title: 'Estado de Contratos' },
        { id: 'contractsByRegionChart', title: 'Contratos por Región' }
    ];

    for (const chartInfo of chartsToExport) {
        const canvas = document.getElementById(chartInfo.id);
        if (canvas) {
            try {
                const imgData = await html2canvas(canvas, {
                    scale: 2, // Higher scale for better quality
                    useCORS: true,
                    backgroundColor: '#ffffff' // Ensure white background for PDF
                }).then(canvas => canvas.toDataURL('image/png'));

                const imgWidth = 180; // Standard width for A4 (210 - 2*margin)
                const imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain aspect ratio

                if (yPos + imgHeight + 20 > doc.internal.pageSize.height) { // Check if new page is needed
                    doc.addPage();
                    yPos = 10;
                }

                doc.setFontSize(12);
                doc.text(chartInfo.title, margin, yPos);
                yPos += 5; // Space after title
                doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 10; // Space after image
            } catch (error) {
                console.error(`Error exporting chart ${chartInfo.id} to PDF:`, error);
                showToast(`Error al exportar gráfico "${chartInfo.title}" a PDF.`, 'error');
            }
        }
    }

    doc.save('resumen_grafico.pdf');
    showToast('Resumen gráfico exportado a PDF.', 'success');
}

// --- Report Generation Functions ---
async function loadContractsForReports() {
    // This function can be used to populate any contract selectors in the reports view
    // For now, it's just a placeholder if needed.
}

async function generateReport() {
    const reportType = document.getElementById('report-type')?.value;
    const reportOutputDiv = document.getElementById('report-output');
    if (!reportOutputDiv) return;

    reportOutputDiv.innerHTML = '<p class="text-muted">Generando informe...</p>';

    let reportContent = '';
    const contracts = await db.contracts.toArray();

    switch (reportType) {
        case 'all-contracts':
            reportContent += '<h3>Informe de Todos los Contratos</h3>';
            reportContent += '<table class="table table-bordered table-striped"><thead><tr><th>SICAC</th><th>Proveedor</th><th>Monto Total</th><th>Estado</th><th>Avance Físico</th></tr></thead><tbody>';
            contracts.forEach(c => {
                reportContent += `<tr><td>${c.sicacNumber}</td><td>${c.numeroProveedor}</td><td>${c.moneda} ${c.totalContractAmount.toFixed(2)}</td><td>${c.status}</td><td>${c.physicalAdvance.toFixed(2)}%</td></tr>`;
            });
            reportContent += '</tbody></table>';
            break;
        case 'active-contracts':
            reportContent += '<h3>Informe de Contratos Activos</h3>';
            const activeContracts = contracts.filter(c => c.status === 'Activo');
            reportContent += '<table class="table table-bordered table-striped"><thead><tr><th>SICAC</th><th>Proveedor</th><th>Fecha Fin</th><th>Avance Físico</th></tr></thead><tbody>';
            activeContracts.forEach(c => {
                reportContent += `<tr><td>${c.sicacNumber}</td><td>${c.numeroProveedor}</td><td>${c.fechaTerminacion}</td><td>${c.physicalAdvance.toFixed(2)}%</td></tr>`;
            });
            reportContent += '</tbody></table>';
            break;
        case 'expiring-contracts':
            reportContent += '<h3>Informe de Contratos Próximos a Vencer (30 Días)</h3>';
            const expiringContracts = contracts.filter(c => {
                const endDate = new Date(c.fechaTerminacion);
                const today = new Date();
                const diffTime = Math.abs(endDate.getTime() - today.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return c.status === 'Activo' && endDate > today && diffDays <= 30;
            });
            reportContent += '<table class="table table-bordered table-striped"><thead><tr><th>SICAC</th><th>Proveedor</th><th>Fecha Fin</th><th>Días Restantes</th></tr></thead><tbody>';
            expiringContracts.forEach(c => {
                const endDate = new Date(c.fechaTerminacion);
                const today = new Date();
                const diffTime = Math.abs(endDate.getTime() - today.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                reportContent += `<tr><td>${c.sicacNumber}</td><td>${c.numeroProveedor}</td><td>${c.fechaTerminacion}</td><td>${diffDays}</td></tr>`;
            });
            reportContent += '</tbody></table>';
            break;
        case 'hes-summary':
            reportContent += '<h3>Resumen de HES por Contrato</h3>';
            reportContent += '<table class="table table-bordered table-striped"><thead><tr><th>Contrato (SICAC)</th><th>Total HES Registrados</th><th>Monto Total HES</th></tr></thead><tbody>';
            const hesSummary = new Map();
            const allHES = await db.hes.toArray();
            for (const hes of allHES) {
                if (!hesSummary.has(hes.contractId)) {
                    hesSummary.set(hes.contractId, { count: 0, totalAmount: 0 });
                }
                const current = hesSummary.get(hes.contractId);
                hesSummary.set(hes.contractId, {
                    count: current.count + 1,
                    totalAmount: current.totalAmount + hes.hesAmount
                });
            }
            for (const [contractId, data] of hesSummary.entries()) {
                const contract = await db.contracts.get(contractId);
                reportContent += `<tr><td>${contract?.sicacNumber || 'N/A'}</td><td>${data.count}</td><td>USD ${data.totalAmount.toFixed(2)}</td></tr>`;
            }
            reportContent += '</tbody></table>';
            break;
        case 'advance-summary':
            reportContent += '<h3>Resumen de Avances Físicos por Contrato</h3>';
            reportContent += '<table class="table table-bordered table-striped"><thead><tr><th>Contrato (SICAC)</th><th>Último Avance (%)</th><th>Fecha Último Avance</th></tr></thead><tbody>';
            for (const contract of contracts) {
                const latestAdvance = await db.advances.where({ contractId: contract.id }).sortBy('advanceDate').then(adv => adv.reverse()[0]); // Get latest by date
                reportContent += `<tr><td>${contract.sicacNumber}</td><td>${contract.physicalAdvance.toFixed(2)}%</td><td>${latestAdvance?.advanceDate || 'N/A'}</td></tr>`;
            }
            reportContent += '</tbody></table>';
            break;
        default:
            reportContent = '<p class="text-muted">Seleccione un tipo de informe para generar.</p>';
            break;
    }
    reportOutputDiv.innerHTML = reportContent;
    showToast('Informe generado.', 'success');
}

// --- Utility Functions ---

function calculateContractAdvances(contract) {
    let physicalAdvance = parseFloat(contract.physicalAdvance || 0); // Assuming physicalAdvance is stored on contract
    let financialAdvance = 0;

    // Calculate financial advance based on HES and total contract amount
    const totalContractAmount = parseFloat(contract.totalContractAmount || 0);
    if (totalContractAmount > 0) {
        // Need to fetch HES for this contract
        db.hes.where({ contractId: contract.id }).toArray().then(hesRecords => {
            const totalHesAmount = hesRecords.reduce((sum, h) => sum + (h.hesAmount || 0), 0);
            financialAdvance = (totalHesAmount / totalContractAmount) * 100;
        }).catch(error => {
            console.error('Error calculating financial advance for contract:', contract.id, error);
            financialAdvance = 0;
        });
    }

    return { physicalAdvance: physicalAdvance, financialAdvance: financialAdvance };
}