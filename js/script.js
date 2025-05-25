// db.js (o al menos la configuración de Dexie al principio de script.js)
const db = new Dexie('SigesconDB');
db.version(1).stores({
    contracts: '++id,numeroProveedor,fechaFirmaContrato,fechaCreado,fechaInicio,fechaTerminacion,periodoCulminacion,numeroContratoSICAC,divisionArea,eemn,region,naturalezaContratacion,lineaServicio,numeroPeticionOferta,modalidadContratacion,regimenLaboral,descripcionContrato,fechaCambioAlcance,montoOriginal,montoModificado,montoTotalContrato,numeroContrato,observaciones,estatusContrato,archivosAdjuntos,partidas',
    advances: '++id,contractId,date,percentage,amount,description', // Avances Físicos (originales)
    hes: '++id,contractId,numeroHES,fechaInicioHES,fechaFinalHES,aprobadoHES,textoHES,ejecutadaHES,fechaCreadoHES,fechaAprobadoHES,textoBreveHES,valuacionHES,lugarPrestacionServicioHES,responsableSDOHES,anexosHES,valuadoHES,subTotalHES,gastosAdministrativosHES,totalHES,partidasHES',
    modalities: '++id,name' // Tabla para modalidades de contratación
});

// Abre la base de datos
db.open().catch(function (err) {
    console.error("Error al abrir la base de datos:", err.stack || err);
    showToast('Error al cargar la base de datos. Recargue la página.', 'error');
});


document.addEventListener('DOMContentLoaded', async () => {
    // --- Global Utility Functions ---
    const showToast = (message, type) => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.className = toast.className.replace('show', '');
        }, 3000);
    };

    const formatDateInput = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const parseDateInput = (dateString) => {
        if (!dateString) return '';
        const [day, month, year] = dateString.split('/');
        return `${year}-${month}-${day}`;
    };

    // --- Tab Switching Logic ---
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.content-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            event.target.classList.add('active');
            const targetSectionId = event.target.dataset.target;
            document.getElementById(targetSectionId).classList.add('active');

            // Special handling for sections that need refresh
            if (targetSectionId === 'list-contracts') {
                loadContractList();
                loadModalities(); // Ensure modalities are loaded for filters
            } else if (targetSectionId === 'advance-physical') {
                loadContractsForAdvance();
            } else if (targetSectionId === 'graphic-summary') {
                renderChart();
            } else if (targetSectionId === 'hes-management') { // New HES tab
                loadContractsForHES(); // Load contracts for HES selection
                loadHesList(); // Load existing HES
            } else if (targetSectionId === 'reports-view') { // New Reports tab
                loadContractsForReports(); // Load contracts for report selection
            }
        });
    });

    // Activate the default tab (Resumen General)
    document.querySelector('.tab-btn[data-target="general-summary"]').click();

    // --- Dashboard / Resumen General ---
    const updateDashboardStats = async () => {
        try {
            const contracts = await db.contracts.toArray();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const activeContracts = contracts.filter(c => new Date(c.fechaTerminacion + 'T00:00:00') >= today);
            const totalContractedAmount = activeContracts.reduce((sum, c) => sum + (c.montoTotalContrato || 0), 0);
            const contractsDueSoon = activeContracts.filter(c => {
                const endDate = new Date(c.fechaTerminacion + 'T00:00:00');
                const diffTime = endDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 30;
            }).length;

            const modalities = await db.modalities.toArray();

            document.getElementById('active-contracts-count').textContent = activeContracts.length;
            document.getElementById('total-contracted-amount').textContent = `USD ${totalContractedAmount.toFixed(2)}`;
            document.getElementById('contracts-due-soon-count').textContent = contractsDueSoon;
            document.getElementById('total-modalities-count').textContent = modalities.length;
        } catch (error) {
            console.error("Error updating dashboard stats:", error);
            showToast('Error al actualizar estadísticas del dashboard.', 'error');
        }
    };
    updateDashboardStats(); // Initial load

    // --- Modalities Management (for Contract Form) ---
    const modalitySelect = document.getElementById('modalidad-contratacion');
    const filterModalidadSelect = document.getElementById('filter-modalidad');

    const loadModalities = async () => {
        try {
            const modalities = await db.modalities.toArray();
            modalitySelect.innerHTML = '<option value="">Seleccione una modalidad</option>';
            filterModalidadSelect.innerHTML = '<option value="Todos">Todos</option>';
            modalities.forEach(mod => {
                const option = document.createElement('option');
                option.value = mod.name;
                option.textContent = mod.name;
                modalitySelect.appendChild(option);

                const filterOption = document.createElement('option');
                filterOption.value = mod.name;
                filterOption.textContent = mod.name;
                filterModalidadSelect.appendChild(filterOption);
            });
        } catch (error) {
            console.error("Error al cargar modalidades:", error);
            showToast('Error al cargar modalidades.', 'error');
        }
    };
    loadModalities(); // Initial load of modalities

    document.getElementById('add-modality-btn').addEventListener('click', async () => {
        const newModalityName = prompt('Ingrese el nombre de la nueva modalidad:');
        if (newModalityName && newModalityName.trim() !== '') {
            try {
                await db.modalities.add({ name: newModalityName.trim() });
                showToast('Modalidad agregada exitosamente.', 'success');
                loadModalities();
            } catch (error) {
                console.error("Error al agregar modalidad:", error);
                showToast('Error al agregar modalidad. Ya existe o hubo un problema.', 'error');
            }
        }
    });

    document.getElementById('remove-modality-btn').addEventListener('click', async () => {
        const selectedModality = modalitySelect.value;
        if (selectedModality) {
            if (confirm(`¿Está seguro de eliminar la modalidad "${selectedModality}"? Esto no afectará contratos existentes.`)) {
                try {
                    const modalityToDelete = await db.modalities.where({ name: selectedModality }).first();
                    if (modalityToDelete) {
                        await db.modalities.delete(modalityToDelete.id);
                        showToast('Modalidad eliminada exitosamente.', 'success');
                        loadModalities();
                    }
                } catch (error) {
                    console.error("Error al eliminar modalidad:", error);
                    showToast('Error al eliminar modalidad.', 'error');
                }
            }
        } else {
            showToast('Seleccione una modalidad para eliminar.', 'warning');
        }
    });


    // --- Contract Form Management ---
    const contractForm = document.getElementById('contract-form');
    const contractIdInput = document.getElementById('contract-id');
    const clearContractFormBtn = document.getElementById('clear-form-btn');
    const addPartidaBtn = document.getElementById('add-partida-btn');
    const partidasTableBody = document.getElementById('partidas-table-body');
    const montoTotalContratoInput = document.getElementById('monto-total-contrato');
    const montoOriginalInput = document.getElementById('monto-original');
    const montoModificadoInput = document.getElementById('monto-modificado');
    const fechaInicioInput = document.getElementById('fecha-inicio');
    const fechaTerminacionInput = document.getElementById('fecha-terminacion');
    const duracionDiasInput = document.getElementById('duracion-dias');


    // Function to calculate and update duration in days
    const updateDuracionDias = () => {
        const startDate = new Date(fechaInicioInput.value + 'T00:00:00');
        const endDate = new Date(fechaTerminacionInput.value + 'T00:00:00');

        if (startDate && endDate && startDate <= endDate) {
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day
            duracionDiasInput.value = diffDays;
        } else {
            duracionDiasInput.value = '';
        }
    };

    fechaInicioInput.addEventListener('change', updateDuracionDias);
    fechaTerminacionInput.addEventListener('change', updateDuracionDias);


    // Function to update Monto Total from Partidas
    const updateMontoOriginalAndTotal = () => {
        let totalPartidas = 0;
        document.querySelectorAll('#partidas-table-body tr').forEach(row => {
            const totalCell = row.querySelector('.partida-total');
            if (totalCell) {
                totalPartidas += parseFloat(totalCell.textContent) || 0;
            }
        });
        montoOriginalInput.value = totalPartidas.toFixed(2);

        const montoModificado = parseFloat(montoModificadoInput.value) || 0;
        montoTotalContratoInput.value = (totalPartidas + montoModificado).toFixed(2);
    };

    montoModificadoInput.addEventListener('input', updateMontoOriginalAndTotal);


    // Add Partida Row
    let partidaCounter = 0;
    addPartidaBtn.addEventListener('click', () => {
        partidaCounter++;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${partidaCounter}</td>
            <td><input type="text" class="form-control form-control-sm partida-description" required></td>
            <td><input type="number" step="0.01" class="form-control form-control-sm partida-quantity" required></td>
            <td><input type="text" class="form-control form-control-sm partida-umd" required></td>
            <td><input type="number" step="0.01" class="form-control form-control-sm partida-unit-price" required></td>
            <td class="partida-total">0.00</td>
            <td><button type="button" class="btn btn-danger btn-sm remove-partida-btn"><i class="fas fa-trash"></i></button></td>
        `;
        partidasTableBody.appendChild(row);

        // Add event listeners for new inputs
        const quantityInput = row.querySelector('.partida-quantity');
        const unitPriceInput = row.querySelector('.partida-unit-price');
        const totalCell = row.querySelector('.partida-total');
        const removeBtn = row.querySelector('.remove-partida-btn');

        const calculatePartidaTotal = () => {
            const quantity = parseFloat(quantityInput.value) || 0;
            const unitPrice = parseFloat(unitPriceInput.value) || 0;
            totalCell.textContent = (quantity * unitPrice).toFixed(2);
            updateMontoOriginalAndTotal();
        };

        quantityInput.addEventListener('input', calculatePartidaTotal);
        unitPriceInput.addEventListener('input', calculatePartidaTotal);
        removeBtn.addEventListener('click', () => {
            row.remove();
            updateMontoOriginalAndTotal(); // Recalculate total after removing a row
            partidaCounter = 0; // Reset counter, will re-index on load
            document.querySelectorAll('#partidas-table-body tr').forEach((r, idx) => {
                r.firstElementChild.textContent = idx + 1;
                partidaCounter++;
            });
        });
    });

    // Clear Contract Form
    const clearContractForm = () => {
        contractForm.reset();
        contractIdInput.value = '';
        partidasTableBody.innerHTML = ''; // Clear partidas
        montoOriginalInput.value = '0.00';
        montoModificadoInput.value = '0.00';
        montoTotalContratoInput.value = '0.00';
        duracionDiasInput.value = '';
        partidaCounter = 0; // Reset counter
        document.getElementById('attached-files-list').innerHTML = ''; // Clear file list
        showToast('Formulario de contrato limpio.', 'info');
    };
    clearContractFormBtn.addEventListener('click', clearContractForm);


    // Save Contract
    contractForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const contractData = {
            numeroProveedor: document.getElementById('numero-proveedor').value,
            fechaFirmaContrato: document.getElementById('fecha-firma-contrato').value,
            fechaCreado: document.getElementById('fecha-creacion').value, // Renamed from fechaCreacion for consistency
            fechaInicio: document.getElementById('fecha-inicio').value,
            fechaTerminacion: document.getElementById('fecha-terminacion').value, // Renamed from fechaFinal
            periodoCulminacion: document.getElementById('duracion-dias').value, // This is 'duracionDias'
            numeroContratoSICAC: document.getElementById('numero-contrato-sicac').value,
            divisionArea: document.getElementById('division-area').value, // New
            eemn: document.getElementById('eemn').value, // New
            region: document.getElementById('region').value, // New
            naturalezaContratacion: document.getElementById('naturaleza-contratacion').value, // New
            lineaServicio: document.getElementById('linea-servicio').value, // New
            numeroPeticionOferta: document.getElementById('no-peticion-oferta').value, // New
            modalidadContratacion: document.getElementById('modalidad-contratacion').value,
            regimenLaboral: document.getElementById('regimen-laboral').value, // New
            descripcionContrato: document.getElementById('objeto-contractual').value, // Renamed from objetoContractual
            fechaCambioAlcance: document.getElementById('fecha-cambio-alcance').value, // New
            montoOriginal: parseFloat(montoOriginalInput.value) || 0, // Calculated from partidas
            montoModificado: parseFloat(montoModificadoInput.value) || 0, // New, user input
            montoTotalContrato: parseFloat(montoTotalContratoInput.value) || 0, // Calculated
            numeroContrato: document.getElementById('numero-contrato').value, // New, if different from SICAC
            observaciones: document.getElementById('observaciones').value, // New
            estatusContrato: document.getElementById('estatus-contrato').value, // New
        };

        // Collect Partidas
        const partidas = [];
        document.querySelectorAll('#partidas-table-body tr').forEach(row => {
            partidas.push({
                description: row.querySelector('.partida-description').value,
                quantity: parseFloat(row.querySelector('.partida-quantity').value) || 0,
                umd: row.querySelector('.partida-umd').value,
                unitPrice: parseFloat(row.querySelector('.partida-unit-price').value) || 0,
                total: parseFloat(row.querySelector('.partida-total').textContent) || 0,
            });
        });
        contractData.partidas = partidas;

        // Collect Attached Files (only names for now)
        const filesInput = document.getElementById('adjuntar-archivos');
        const attachedFiles = [];
        for (const file of filesInput.files) {
            attachedFiles.push({ name: file.name, path: `uploads/${file.name}` }); // Placeholder path
        }
        contractData.archivosAdjuntos = attachedFiles;


        try {
            let savedContractId;
            const isNewContract = !contractIdInput.value;

            if (isNewContract) {
                savedContractId = await db.contracts.add(contractData);
                showToast('Contrato guardado exitosamente.', 'success');

                // === Avance Físico Automático (0% al Crear Contrato) ===
                await db.advances.add({
                    contractId: savedContractId,
                    date: contractData.fechaCreado,
                    percentage: 0,
                    amount: 0,
                    description: 'Avance inicial al crear el contrato.'
                });
                showToast('Avance inicial (0%) registrado automáticamente.', 'info');
                // =======================================================
            } else {
                savedContractId = parseInt(contractIdInput.value);
                await db.contracts.update(savedContractId, contractData);
                showToast('Contrato actualizado exitosamente.', 'success');
            }

            clearContractForm(); // Clear form after save/update
            loadContractList(); // Reload contract list
            updateDashboardStats(); // Update dashboard
            loadContractsForAdvance(); // Reload contracts for advance section
            loadContractsForHES(); // Reload contracts for HES section
            loadContractsForReports(); // Reload contracts for reports section
        } catch (error) {
            console.error("Error al guardar el contrato:", error);
            showToast('Error al guardar el contrato. Verifique los datos.', 'error');
        }
    });

    // Load Contract for Editing
    const loadContractForEdit = async (id) => {
        try {
            const contract = await db.contracts.get(id);
            if (contract) {
                contractIdInput.value = contract.id;
                document.getElementById('numero-proveedor').value = contract.numeroProveedor;
                document.getElementById('fecha-firma-contrato').value = contract.fechaFirmaContrato;
                document.getElementById('fecha-creacion').value = contract.fechaCreado;
                document.getElementById('fecha-inicio').value = contract.fechaInicio;
                document.getElementById('fecha-terminacion').value = contract.fechaTerminacion;
                document.getElementById('duracion-dias').value = contract.periodoCulminacion;
                document.getElementById('numero-contrato-sicac').value = contract.numeroContratoSICAC;
                document.getElementById('division-area').value = contract.divisionArea;
                document.getElementById('eemn').value = contract.eemn;
                document.getElementById('region').value = contract.region;
                document.getElementById('naturaleza-contratacion').value = contract.naturalezaContratacion;
                document.getElementById('linea-servicio').value = contract.lineaServicio;
                document.getElementById('no-peticion-oferta').value = contract.numeroPeticionOferta;
                document.getElementById('modalidad-contratacion').value = contract.modalidadContratacion;
                document.getElementById('regimen-laboral').value = contract.regimenLaboral;
                document.getElementById('objeto-contractual').value = contract.descripcionContrato;
                document.getElementById('fecha-cambio-alcance').value = contract.fechaCambioAlcance;
                document.getElementById('monto-original').value = contract.montoOriginal.toFixed(2);
                document.getElementById('monto-modificado').value = contract.montoModificado.toFixed(2);
                document.getElementById('monto-total-contrato').value = contract.montoTotalContrato.toFixed(2);
                document.getElementById('numero-contrato').value = contract.numeroContrato;
                document.getElementById('observaciones').value = contract.observaciones;
                document.getElementById('estatus-contrato').value = contract.estatusContrato;


                // Load Partidas
                partidasTableBody.innerHTML = '';
                partidaCounter = 0;
                if (contract.partidas && contract.partidas.length > 0) {
                    contract.partidas.forEach((partida, index) => {
                        partidaCounter++;
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${partidaCounter}</td>
                            <td><input type="text" class="form-control form-control-sm partida-description" value="${partida.description}" required></td>
                            <td><input type="number" step="0.01" class="form-control form-control-sm partida-quantity" value="${partida.quantity}" required></td>
                            <td><input type="text" class="form-control form-control-sm partida-umd" value="${partida.umd}" required></td>
                            <td><input type="number" step="0.01" class="form-control form-control-sm partida-unit-price" value="${partida.unitPrice}" required></td>
                            <td class="partida-total">${partida.total.toFixed(2)}</td>
                            <td><button type="button" class="btn btn-danger btn-sm remove-partida-btn"><i class="fas fa-trash"></i></button></td>
                        `;
                        partidasTableBody.appendChild(row);

                        const quantityInput = row.querySelector('.partida-quantity');
                        const unitPriceInput = row.querySelector('.partida-unit-price');
                        const totalCell = row.querySelector('.partida-total');
                        const removeBtn = row.querySelector('.remove-partida-btn');

                        const calculatePartidaTotal = () => {
                            const quantity = parseFloat(quantityInput.value) || 0;
                            const unitPrice = parseFloat(unitPriceInput.value) || 0;
                            totalCell.textContent = (quantity * unitPrice).toFixed(2);
                            updateMontoOriginalAndTotal();
                        };
                        quantityInput.addEventListener('input', calculatePartidaTotal);
                        unitPriceInput.addEventListener('input', calculatePartidaTotal);
                        removeBtn.addEventListener('click', () => {
                            row.remove();
                            updateMontoOriginalAndTotal();
                            partidaCounter = 0; // Reset counter, will re-index on load
                            document.querySelectorAll('#partidas-table-body tr').forEach((r, idx) => {
                                r.firstElementChild.textContent = idx + 1;
                                partidaCounter++;
                            });
                        });
                    });
                }
                updateMontoOriginalAndTotal(); // Ensure calculated fields are correct
                document.querySelector('.tab-btn[data-target="new-edit-contract"]').click(); // Switch to contract form tab
            } else {
                showToast('Contrato no encontrado.', 'error');
            }
        } catch (error) {
            console.error("Error al cargar contrato para edición:", error);
            showToast('Error al cargar contrato para edición.', 'error');
        }
    };


    // --- Contract List Management ---
    const contractListBody = document.getElementById('contract-list-body');
    const filterProveedor = document.getElementById('filter-proveedor');
    const filterSicac = document.getElementById('filter-sicac');
    const filterFechaInicio = document.getElementById('filter-fecha-inicio');
    const filterFechaFinal = document.getElementById('filter-fecha-final');
    const filterModalidad = document.getElementById('filter-modalidad');
    const filterEstado = document.getElementById('filter-estado');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');


    // Function to calculate Financial and Physical Advance for display
    const calculateContractAdvances = async (contractId) => {
        const contract = await db.contracts.get(contractId);
        if (!contract || !contract.montoTotalContrato) {
            return { financial: 0, physical: 0 };
        }

        const hesList = await db.hes.where({ contractId: contractId }).toArray();
        let totalExecutedAmount = 0;
        let totalWeightedPhysicalAdvance = 0;
        let totalContractPartidasOriginalAmount = 0; // Sum of original amounts of all contract partidas

        // Calculate total original amount from contract partidas
        if (contract.partidas && contract.partidas.length > 0) {
            totalContractPartidasOriginalAmount = contract.partidas.reduce((sum, p) => sum + p.total, 0);
        }

        for (const hes of hesList) {
            if (hes.ejecutadaHES || hes.aprobadoHES) { // Consider only executed/approved HES
                totalExecutedAmount += hes.totalHES || 0;

                // Calculate weighted physical advance for this HES
                if (hes.partidasHES && contract.partidas && hes.partidasHES.length > 0) {
                    let hesPhysicalProgressSum = 0;
                    let hesTotalPartidaWeight = 0; // Sum of total amount of contract partidas relevant to HES

                    for (const hesPartida of hes.partidasHES) {
                        const originalContractPartida = contract.partidas.find(p => p.description === hesPartida.description && p.umd === hesPartida.umd);

                        if (originalContractPartida && originalContractPartida.quantity > 0) {
                            const physicalAdvancePerPartida = (hesPartida.cantidadEjecutada / originalContractPartida.quantity);
                            hesPhysicalProgressSum += physicalAdvancePerPartida * originalContractPartida.total; // Weight by original partida value
                        }
                    }
                    if (totalContractPartidasOriginalAmount > 0) {
                        totalWeightedPhysicalAdvance += hesPhysicalProgressSum;
                    }
                }
            }
        }

        const financialAdvance = (totalExecutedAmount / contract.montoTotalContrato) * 100;
        const physicalAdvance = (totalContractPartidasOriginalAmount > 0) ? (totalWeightedPhysicalAdvance / totalContractPartidasOriginalAmount) * 100 : 0;


        return {
            financial: parseFloat(financialAdvance.toFixed(2)),
            physical: parseFloat(physicalAdvance.toFixed(2))
        };
    };


    // Load Contract List (main table)
    async function loadContractList() {
        const contractListBody = document.getElementById('contract-list-body');
        contractListBody.innerHTML = '';

        let contracts = await db.contracts.toArray();

        // Apply filters
        const fProveedor = filterProveedor.value.toLowerCase();
        const fSicac = filterSicac.value.toLowerCase();
        const fFechaInicio = filterFechaInicio.value;
        const fFechaFinal = filterFechaFinal.value;
        const fModalidad = filterModalidad.value;
        const fEstado = filterEstado.value;

        contracts = contracts.filter(contract => {
            const matchesProveedor = contract.numeroProveedor.toLowerCase().includes(fProveedor);
            const matchesSicac = contract.numeroContratoSICAC.toLowerCase().includes(fSicac);

            const contractStartDate = new Date(contract.fechaInicio + 'T00:00:00');
            const contractEndDate = new Date(contract.fechaTerminacion + 'T00:00:00');
            const filterStartDate = fFechaInicio ? new Date(fFechaInicio + 'T00:00:00') : null;
            const filterEndDate = fFechaFinal ? new Date(fFechaFinal + 'T00:00:00') : null;

            const matchesDate = (!filterStartDate || contractStartDate >= filterStartDate) &&
                                (!filterEndDate || contractEndDate <= filterEndDate);

            const matchesModalidad = fModalidad === 'Todos' || contract.modalidadContratacion === fModalidad;

            let matchesEstado = true;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const contractEndForStatus = new Date(contract.fechaTerminacion + 'T00:00:00');

            if (fEstado === 'Activos') {
                matchesEstado = contractEndForStatus >= today;
            } else if (fEstado === 'Por Vencer (30 días)') {
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(today.getDate() + 30);
                thirtyDaysFromNow.setHours(0, 0, 0, 0);
                matchesEstado = contractEndForStatus > today && contractEndForStatus <= thirtyDaysFromNow;
            } else if (fEstado === 'Vencidos') {
                matchesEstado = contractEndForStatus < today;
            } else if (fEstado !== 'Todos') {
                matchesEstado = contract.estatusContrato === fEstado; // Match specific status
            }

            return matchesProveedor && matchesSicac && matchesDate && matchesModalidad && matchesEstado;
        });

        if (contracts.length === 0) {
            contractListBody.innerHTML = `<tr><td colspan="11" class="text-center">No hay contratos que coincidan con los filtros.</td></tr>`;
            return;
        }

        for (const contract of contracts) {
            const advances = await calculateContractAdvances(contract.id);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contract.numeroProveedor}</td>
                <td>${contract.numeroContratoSICAC}</td>
                <td>${contract.fechaInicio}</td>
                <td>${contract.fechaTerminacion}</td>
                <td>${contract.periodoCulminacion}</td>
                <td>${contract.moneda} ${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'}</td>
                <td>${advances.financial}%</td>
                <td>${advances.physical}%</td>
                <td>${contract.archivosAdjuntos && contract.archivosAdjuntos.length > 0
                    ? contract.archivosAdjuntos.map(file =>
                        `<a href="#" class="view-file-btn" data-file-name="${file.name}"
                            title="La descarga de archivos requiere backend">${file.name}</a>`
                    ).join('<br>')
                    : 'N/A'
                }</td>
                <td class="actions-cell">
                    <button class="btn btn-primary btn-sm edit-btn" data-id="${contract.id}" title="Editar Contrato"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm delete-contract-btn" data-id="${contract.id}" title="Eliminar Contrato Permanentemente"><i class="fas fa-trash"></i></button>
                    <button class="btn btn-info btn-sm view-details-btn" data-id="${contract.id}" title="Ver Detalles"><i class="fas fa-info-circle"></i></button>
                    <button class="btn btn-success btn-sm export-single-excel-btn" data-id="${contract.id}" title="Exportar a Excel"><i class="fas fa-file-excel"></i></button>
                    <button class="btn btn-warning btn-sm export-single-pdf-btn" data-id="${contract.id}" title="Exportar a PDF"><i class="fas fa-file-pdf"></i></button>
                </td>
            `;
            contractListBody.appendChild(row);
        }

        // Add event listeners for dynamic buttons after they are added to the DOM
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (event) => loadContractForEdit(parseInt(event.currentTarget.dataset.id)));
        });

        document.querySelectorAll('.delete-contract-btn').forEach(button => {
            button.addEventListener('click', (event) => deleteContract(parseInt(event.currentTarget.dataset.id)));
        });

        document.querySelectorAll('.view-details-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const contract = await db.contracts.get(parseInt(event.currentTarget.dataset.id));
                if (contract) {
                    console.log("Detalles del contrato:", contract);
                    showToast(`Detalles del contrato ${contract.numeroContratoSICAC} disponibles en la consola (F12).`, 'info');
                }
            });
        });

        document.querySelectorAll('.export-single-excel-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const contractId = parseInt(event.currentTarget.dataset.id);
                await exportSingleContractToExcel(contractId);
            });
        });

        document.querySelectorAll('.export-single-pdf-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const contractId = parseInt(event.currentTarget.dataset.id);
                await exportSingleContractToPdf(contractId);
            });
        });

        document.querySelectorAll('.view-file-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent default link behavior
                const fileName = event.currentTarget.dataset.fileName;
                showToast(`La descarga directa de "${fileName}" (archivos subidos) no es posible sin un servidor. Solo se guardó el nombre.`, 'info');
            });
        });
    }

    applyFiltersBtn.addEventListener('click', loadContractList);
    clearFiltersBtn.addEventListener('click', () => {
        filterProveedor.value = '';
        filterSicac.value = '';
        filterFechaInicio.value = '';
        filterFechaFinal.value = '';
        filterModalidad.value = 'Todos';
        filterEstado.value = 'Todos';
        loadContractList();
    });
    loadContractList(); // Initial load of contract list


    // Delete Contract (Permanent)
    const deleteContract = async (id) => {
        if (confirm('¿Está seguro de eliminar este contrato PERMANENTEMENTE? Esta acción no se puede deshacer.')) {
            try {
                // Also delete associated advances and HES
                await db.contracts.delete(id);
                await db.advances.where({ contractId: id }).delete();
                await db.hes.where({ contractId: id }).delete();
                showToast('Contrato y sus registros asociados eliminados permanentemente.', 'success');
                loadContractList();
                updateDashboardStats();
                loadContractsForAdvance();
                loadContractsForHES();
                loadContractsForReports();
            } catch (error) {
                console.error("Error al eliminar contrato:", error);
                showToast('Error al eliminar contrato.', 'error');
            }
        }
    };


    // --- Export Functions (Global) ---
    document.getElementById('export-excel-btn').addEventListener('click', async () => {
        try {
            const contracts = await db.contracts.toArray();
            const dataToExport = contracts.map(contract => ({
                'N° Proveedor': contract.numeroProveedor,
                'N° SICAC': contract.numeroContratoSICAC,
                'Fecha Inicio': contract.fechaInicio,
                'Fecha Final': contract.fechaTerminacion,
                'Duración (Días)': contract.periodoCulminacion,
                'Monto Total': contract.montoTotalContrato,
                'Objeto Contractual': contract.descripcionContrato,
                'Moneda': contract.moneda,
                'Modalidad': contract.modalidadContratacion,
                'Fecha Creacion': contract.fechaCreado,
                'N° ODS': contract.numeroODS,
                'Fecha Firma': contract.fechaFirmaContrato,
                'División Área': contract.divisionArea,
                'EEMN': contract.eemn,
                'Región': contract.region,
                'Naturaleza Contratación': contract.naturalezaContratacion,
                'Línea Servicio': contract.lineaServicio,
                'N° Petición Oferta': contract.numeroPeticionOferta,
                'Régimen Laboral': contract.regimenLaboral,
                'Fecha Cambio Alcance': contract.fechaCambioAlcance,
                'Monto Original': contract.montoOriginal,
                'Monto Modificado': contract.montoModificado,
                'N° Contrato': contract.numeroContrato,
                'Observaciones': contract.observaciones,
                'Estatus': contract.estatusContrato,
                'Archivos Adjuntos': contract.archivosAdjuntos ? contract.archivosAdjuntos.map(f => f.name).join(', ') : '',
                'Partidas': contract.partidas ? JSON.stringify(contract.partidas.map(p => `${p.description} (${p.quantity} ${p.umd} @${p.unitPrice})`)) : ''
            }));

            if (dataToExport.length === 0) {
                showToast('No hay contratos para exportar.', 'info');
                return;
            }

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Contratos");
            XLSX.writeFile(wb, "contratos.xlsx");
            showToast('Contratos exportados a Excel.', 'success');
        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            showToast('Error al exportar a Excel.', 'error');
        }
    });

    document.getElementById('export-pdf-btn').addEventListener('click', async () => {
        try {
            const contracts = await db.contracts.toArray();
            if (contracts.length === 0) {
                showToast('No hay contratos para exportar a PDF.', 'info');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const tableColumn = [
                "N° Prov", "N° SICAC", "F. Inicio", "F. Fin", "Duración", "Monto Total",
                "Av. Fin. (%)", "Av. Fis. (%)", "Modalidad", "Estatus"
            ];
            const tableRows = [];

            for (const contract of contracts) {
                const advances = await calculateContractAdvances(contract.id);
                tableRows.push([
                    contract.numeroProveedor,
                    contract.numeroContratoSICAC,
                    contract.fechaInicio,
                    contract.fechaTerminacion,
                    contract.periodoCulminacion,
                    `${contract.moneda} ${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'}`,
                    advances.financial,
                    advances.physical,
                    contract.modalidadContratacion,
                    contract.estatusContrato
                ]);
            }

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
                headStyles: { fillColor: [52, 73, 94] },
                didDrawPage: function (data) {
                    doc.text("Lista de Contratos", data.settings.marginStart, 15);
                }
            });

            doc.save("contratos.pdf");
            showToast('Contratos exportados a PDF.', 'success');
        } catch (error) {
            console.error('Error al exportar a PDF:', error);
            showToast('Error al exportar a PDF.', 'error');
        }
    });

    // --- Export Single Contract Functions ---
    async function exportSingleContractToExcel(contractId) {
        try {
            const contract = await db.contracts.get(contractId);
            if (!contract) {
                showToast('Contrato no encontrado para exportar.', 'error');
                return;
            }

            const dataToExport = [{
                'Campo': 'N° Proveedor', 'Valor': contract.numeroProveedor
            },{
                'Campo': 'N° Contrato SICAC', 'Valor': contract.numeroContratoSICAC
            },{
                'Campo': 'Fecha Firma Contrato', 'Valor': contract.fechaFirmaContrato
            },{
                'Campo': 'Fecha Creado', 'Valor': contract.fechaCreado
            },{
                'Campo': 'Fecha Inicio', 'Valor': contract.fechaInicio
            },{
                'Campo': 'Fecha Terminación', 'Valor': contract.fechaTerminacion
            },{
                'Campo': 'Periodo de Culminación (Días)', 'Valor': contract.periodoCulminacion
            },{
                'Campo': 'División Área', 'Valor': contract.divisionArea
            },{
                'Campo': 'EEMN', 'Valor': contract.eemn
            },{
                'Campo': 'Región', 'Valor': contract.region
            },{
                'Campo': 'Naturaleza de la Contratación', 'Valor': contract.naturalezaContratacion
            },{
                'Campo': 'Línea de Servicio', 'Valor': contract.lineaServicio
            },{
                'Campo': 'N° Petición de Oferta', 'Valor': contract.numeroPeticionOferta
            },{
                'Campo': 'Modalidad de Contratación', 'Valor': contract.modalidadContratacion
            },{
                'Campo': 'Régimen Laboral', 'Valor': contract.regimenLaboral
            },{
                'Campo': 'Descripción del Contrato', 'Valor': contract.descripcionContrato
            },{
                'Campo': 'Fecha Cambio Alcance', 'Valor': contract.fechaCambioAlcance
            },{
                'Campo': 'Monto Original', 'Valor': `${contract.moneda} ${contract.montoOriginal.toFixed(2)}`
            },{
                'Campo': 'Monto Modificado', 'Valor': `${contract.moneda} ${contract.montoModificado.toFixed(2)}`
            },{
                'Campo': 'Monto Total', 'Valor': `${contract.moneda} ${contract.montoTotalContrato.toFixed(2)}`
            },{
                'Campo': 'N° Contrato', 'Valor': contract.numeroContrato
            },{
                'Campo': 'Observaciones', 'Valor': contract.observaciones
            },{
                'Campo': 'Estatus', 'Valor': contract.estatusContrato
            },{
                'Campo': 'Archivos Adjuntos', 'Valor': contract.archivosAdjuntos ? contract.archivosAdjuntos.map(f => f.name).join(', ') : 'N/A'
            }];

            const ws = XLSX.utils.json_to_sheet(dataToExport);

            // Add Partidas
            if (contract.partidas && contract.partidas.length > 0) {
                XLSX.utils.sheet_add_aoa(ws, [["", ""]], { origin: -1 }); // Spacer
                XLSX.utils.sheet_add_aoa(ws, [["Partidas del Contrato"]], { origin: -1 }); // Title
                XLSX.utils.sheet_add_aoa(ws, [["#", "Descripción", "Cantidad", "UMD", "Precio Unitario", "Total"]], { origin: -1 });
                const partidaRows = contract.partidas.map((p, idx) => [idx + 1, p.description, p.quantity, p.umd, p.unitPrice, p.total]);
                XLSX.utils.sheet_add_aoa(ws, partidaRows, { origin: -1 });
            }

            // Add HES if any
            const hesList = await db.hes.where({ contractId: contractId }).toArray();
            if (hesList.length > 0) {
                XLSX.utils.sheet_add_aoa(ws, [["", ""]], { origin: -1 }); // Spacer
                XLSX.utils.sheet_add_aoa(ws, [["Hojas de Entrada de Servicios (HES)"]], { origin: -1 }); // Title
                const hesHeaders = ["No HES", "F. Inicio HES", "F. Fin HES", "Aprobado", "Ejecutada", "Valuación", "Total HES"];
                XLSX.utils.sheet_add_aoa(ws, [hesHeaders], { origin: -1 });
                const hesRows = hesList.map(h => [
                    h.numeroHES, h.fechaInicioHES, h.fechaFinalHES, h.aprobadoHES ? 'Sí' : 'No', h.ejecutadaHES ? 'Sí' : 'No',
                    `${contract.moneda} ${h.valuacionHES.toFixed(2)}`, `${contract.moneda} ${h.totalHES.toFixed(2)}`
                ]);
                XLSX.utils.sheet_add_aoa(ws, hesRows, { origin: -1 });

                // Add HES Partidas
                for (const hes of hesList) {
                    if (hes.partidasHES && hes.partidasHES.length > 0) {
                        XLSX.utils.sheet_add_aoa(ws, [["", ""]], { origin: -1 }); // Spacer
                        XLSX.utils.sheet_add_aoa(ws, [[`Partidas de HES ${hes.numeroHES}`]], { origin: -1 });
                        const hesPartidaHeaders = ["#", "Descripción", "UMD", "Cantidad Original", "P. Unitario Original", "Cantidad Ejecutada", "Avance Físico (%)", "Avance Financiero (%)"];
                        XLSX.utils.sheet_add_aoa(ws, [hesPartidaHeaders], { origin: -1 });
                        const hesPartidaRows = hes.partidasHES.map((hp, idx) => [
                            idx + 1, hp.description, hp.umd, hp.cantidadContrato, hp.precioUnitarioContrato, hp.cantidadEjecutada,
                            hp.avanceFisicoPartida, hp.avanceFinancieroPartida
                        ]);
                        XLSX.utils.sheet_add_aoa(ws, hesPartidaRows, { origin: -1 });
                    }
                }
            }


            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, `Contrato-${contract.numeroContratoSICAC}`);
            XLSX.writeFile(wb, `contrato_${contract.numeroContratoSICAC}.xlsx`);
            showToast(`Contrato ${contract.numeroContratoSICAC} exportado a Excel.`, 'success');

        } catch (error) {
            console.error('Error al exportar contrato individual a Excel:', error);
            showToast('Error al exportar contrato individual a Excel.', 'error');
        }
    }

    async function exportSingleContractToPdf(contractId) {
        try {
            const contract = await db.contracts.get(contractId);
            if (!contract) {
                showToast('Contrato no encontrado para exportar.', 'error');
                return;
            }

            const advances = await calculateContractAdvances(contractId);

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            let y = 15;

            doc.setFontSize(16);
            doc.text(`Detalles del Contrato: ${contract.numeroContratoSICAC}`, 14, y);
            y += 10;
            doc.setFontSize(10);

            const contractDetails = [
                ['N° Proveedor:', contract.numeroProveedor],
                ['N° Contrato SICAC:', contract.numeroContratoSICAC],
                ['Fecha Firma Contrato:', contract.fechaFirmaContrato],
                ['Fecha Creado:', contract.fechaCreado],
                ['Fecha Inicio:', contract.fechaInicio],
                ['Fecha Terminación:', contract.fechaTerminacion],
                ['Periodo Culminación (Días):', contract.periodoCulminacion],
                ['División Área:', contract.divisionArea],
                ['EEMN:', contract.eemn],
                ['Región:', contract.region],
                ['Naturaleza de la Contratación:', contract.naturalezaContratacion],
                ['Línea de Servicio:', contract.lineaServicio],
                ['N° Petición de Oferta:', contract.numeroPeticionOferta],
                ['Modalidad de Contratación:', contract.modalidadContratacion],
                ['Régimen Laboral:', contract.regimenLaboral],
                ['Descripción del Contrato:', contract.descripcionContrato],
                ['Fecha Cambio Alcance:', contract.fechaCambioAlcance],
                ['Monto Original:', `${contract.moneda} ${contract.montoOriginal.toFixed(2)}`],
                ['Monto Modificado:', `${contract.moneda} ${contract.montoModificado.toFixed(2)}`],
                ['Monto Total:', `${contract.moneda} ${contract.montoTotalContrato.toFixed(2)}`],
                ['N° Contrato (Interno):', contract.numeroContrato],
                ['Observaciones:', contract.observaciones],
                ['Estatus:', contract.estatusContrato],
                ['Avance Financiero Total:', `${advances.financial}%`],
                ['Avance Físico Total:', `${advances.physical}%`]
            ];

            doc.autoTable({
                startY: y,
                body: contractDetails,
                theme: 'plain',
                styles: { fontSize: 9, cellPadding: 1 },
                columnStyles: { 0: { fontStyle: 'bold' } }
            });
            y = doc.autoTable.previous.finalY + 10;

            // Partidas del Contrato
            if (contract.partidas && contract.partidas.length > 0) {
                if (y + 20 > doc.internal.pageSize.height) { doc.addPage(); y = 15; }
                doc.setFontSize(12);
                doc.text("Partidas del Contrato:", 14, y);
                y += 7;
                doc.autoTable({
                    startY: y,
                    head: [["#", "Descripción", "Cantidad", "UMD", "Precio Unitario", "Total"]],
                    body: contract.partidas.map((p, idx) => [idx + 1, p.description, p.quantity, p.umd, p.unitPrice, p.total.toFixed(2)]),
                    styles: { fontSize: 8, cellPadding: 2 },
                    headStyles: { fillColor: [52, 73, 94] }
                });
                y = doc.autoTable.previous.finalY + 10;
            }

            // Hojas de Entrada de Servicios (HES)
            const hesList = await db.hes.where({ contractId: contractId }).toArray();
            if (hesList.length > 0) {
                if (y + 20 > doc.internal.pageSize.height) { doc.addPage(); y = 15; }
                doc.setFontSize(12);
                doc.text("Hojas de Entrada de Servicios (HES):", 14, y);
                y += 7;
                const hesHeaders = ["No HES", "F. Inicio", "F. Fin", "Aprobado", "Ejecutada", "Valuación", "Total HES"];
                const hesRows = hesList.map(h => [
                    h.numeroHES, h.fechaInicioHES, h.fechaFinalHES, h.aprobadoHES ? 'Sí' : 'No', h.ejecutadaHES ? 'Sí' : 'No',
                    `${contract.moneda} ${h.valuacionHES.toFixed(2)}`, `${contract.moneda} ${h.totalHES.toFixed(2)}`
                ]);
                doc.autoTable({
                    startY: y,
                    head: [hesHeaders],
                    body: hesRows,
                    styles: { fontSize: 8, cellPadding: 2 },
                    headStyles: { fillColor: [52, 73, 94] }
                });
                y = doc.autoTable.previous.finalY + 10;

                // HES Partidas for each HES
                for (const hes of hesList) {
                    if (hes.partidasHES && hes.partidasHES.length > 0) {
                        if (y + 20 > doc.internal.pageSize.height) { doc.addPage(); y = 15; }
                        doc.setFontSize(10);
                        doc.text(`Partidas de HES ${hes.numeroHES}:`, 14, y);
                        y += 7;
                        const hesPartidaHeaders = ["#", "Descripción", "UMD", "Cant. Original", "P. Unitario", "Cant. Ejec.", "Av. Físico (%)", "Av. Fin. (%)"];
                        const hesPartidaRows = hes.partidasHES.map((hp, idx) => [
                            idx + 1, hp.description, hp.umd, hp.cantidadContrato, hp.precioUnitarioContrato, hp.cantidadEjecutada,
                            hp.avanceFisicoPartida, hp.avanceFinancieroPartida
                        ]);
                        doc.autoTable({
                            startY: y,
                            head: [hesPartidaHeaders],
                            body: hesPartidaRows,
                            styles: { fontSize: 7, cellPadding: 1 },
                            headStyles: { fillColor: [100, 149, 237] } // Light blue for HES partidas
                        });
                        y = doc.autoTable.previous.finalY + 7;
                    }
                }
            }

            doc.save(`contrato_${contract.numeroContratoSICAC}.pdf`);
            showToast(`Contrato ${contract.numeroContratoSICAC} exportado a PDF.`, 'success');

        } catch (error) {
            console.error('Error al exportar contrato individual a PDF:', error);
            showToast('Error al exportar contrato individual a PDF.', 'error');
        }
    }


    // --- Avance Físico (Original Module - now just for other advances) ---
    const advanceContractSelect = document.getElementById('advance-contract-select');
    const advanceForm = document.getElementById('advance-form');
    const advanceHistoryBody = document.getElementById('advance-history-body');

    const loadContractsForAdvance = async () => {
        try {
            const contracts = await db.contracts.toArray();
            advanceContractSelect.innerHTML = '<option value="">Seleccione un Contrato</option>';
            contracts.forEach(contract => {
                const option = document.createElement('option');
                option.value = contract.id;
                option.textContent = `${contract.numeroContratoSICAC} - ${contract.descripcionContrato}`;
                advanceContractSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar contratos para avance:", error);
        }
    };

    advanceContractSelect.addEventListener('change', async () => {
        const contractId = parseInt(advanceContractSelect.value);
        if (contractId) {
            await loadAdvanceHistory(contractId);
        } else {
            advanceHistoryBody.innerHTML = '<tr><td colspan="5" class="text-center">Seleccione un contrato para ver su historial de avances.</td></tr>';
        }
    });

    const loadAdvanceHistory = async (contractId) => {
        try {
            const advances = await db.advances.where({ contractId: contractId }).sortBy('date');
            advanceHistoryBody.innerHTML = '';
            if (advances.length === 0) {
                advanceHistoryBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay avances registrados para este contrato.</td></tr>';
                return;
            }
            advances.forEach(advance => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${advance.date}</td>
                    <td>${advance.percentage}%</td>
                    <td>${advance.amount.toFixed(2)}</td>
                    <td>${advance.description}</td>
                    <td><button class="btn btn-danger btn-sm delete-advance-btn" data-id="${advance.id}"><i class="fas fa-trash"></i></button></td>
                `;
                advanceHistoryBody.appendChild(row);
            });

            document.querySelectorAll('.delete-advance-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const advanceId = parseInt(event.currentTarget.dataset.id);
                    if (confirm('¿Está seguro de eliminar este registro de avance?')) {
                        try {
                            await db.advances.delete(advanceId);
                            showToast('Avance eliminado.', 'success');
                            loadAdvanceHistory(contractId); // Reload history for current contract
                        } catch (error) {
                            console.error("Error al eliminar avance:", error);
                            showToast('Error al eliminar avance.', 'error');
                        }
                    }
                });
            });
        } catch (error) {
            console.error("Error al cargar historial de avances:", error);
            showToast('Error al cargar historial de avances.', 'error');
        }
    };

    advanceForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const contractId = parseInt(document.getElementById('advance-contract-select').value);
        const date = document.getElementById('advance-date').value;
        const percentage = parseFloat(document.getElementById('advance-percentage').value);
        const description = document.getElementById('advance-description').value;

        if (!contractId || isNaN(percentage)) {
            showToast('Seleccione un contrato y un porcentaje válido.', 'warning');
            return;
        }

        const contract = await db.contracts.get(contractId);
        if (!contract) {
            showToast('Contrato no encontrado para registrar avance.', 'error');
            return;
        }

        const amount = (contract.montoTotalContrato * percentage) / 100;

        try {
            await db.advances.add({
                contractId,
                date,
                percentage,
                amount,
                description
            });
            showToast('Avance físico registrado exitosamente.', 'success');
            advanceForm.reset();
            loadAdvanceHistory(contractId);
            loadContractList(); // Update main list with new advance if applicable
        } catch (error) {
            console.error("Error al registrar avance:", error);
            showToast('Error al registrar avance.', 'error');
        }
    });


    // --- Graphic Summary ---
    let myChart; // Chart.js instance

    const renderChart = async () => {
        const ctx = document.getElementById('modalityChart').getContext('2d');
        const chartType = document.getElementById('chart-type-select').value;

        const contracts = await db.contracts.toArray();
        const modalityCounts = {};
        contracts.forEach(contract => {
            modalityCounts[contract.modalidadContratacion] = (modalityCounts[contract.modalidadContratacion] || 0) + 1;
        });

        const labels = Object.keys(modalityCounts);
        const data = Object.values(modalityCounts);

        if (myChart) {
            myChart.destroy(); // Destroy previous chart instance
        }

        myChart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Contratos por Modalidad',
                    data: data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { if (Number.isInteger(value)) { return value; } }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Cantidad de Contratos por Modalidad'
                    }
                }
            }
        });
    };

    document.getElementById('chart-type-select').addEventListener('change', renderChart);
    renderChart(); // Initial chart render

    document.getElementById('export-chart-excel-btn').addEventListener('click', async () => {
        try {
            const contracts = await db.contracts.toArray();
            const dataToExport = contracts.map(contract => ({
                'N° Proveedor': contract.numeroProveedor,
                'N° SICAC': contract.numeroContratoSICAC,
                'Modalidad': contract.modalidadContratacion,
                'Monto Total': contract.montoTotalContrato
            }));
            if (dataToExport.length === 0) {
                showToast('No hay datos para exportar.', 'info');
                return;
            }
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Datos Contratos");
            XLSX.writeFile(wb, "datos_grafico_contratos.xlsx");
            showToast('Datos del gráfico exportados a Excel.', 'success');
        } catch (error) {
            console.error('Error al exportar datos del gráfico a Excel:', error);
            showToast('Error al exportar datos del gráfico a Excel.', 'error');
        }
    });

    document.getElementById('export-chart-pdf-btn').addEventListener('click', () => {
        if (myChart) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const imgData = myChart.toBase64Image();
            doc.addImage(imgData, 'PNG', 10, 10, 190, 100);
            doc.save('grafico_contratos.pdf');
            showToast('Gráfico exportado a PDF.', 'success');
        } else {
            showToast('No hay gráfico para exportar.', 'warning');
        }
    });

    document.getElementById('export-chart-png-btn').addEventListener('click', () => {
        if (myChart) {
            const a = document.createElement('a');
            a.href = myChart.toBase64Image();
            a.download = 'grafico_contratos.png';
            a.click();
            showToast('Gráfico exportado a PNG.', 'success');
        } else {
            showToast('No hay gráfico para exportar.', 'warning');
        }
    });


    // --- HES Management (NEW MODULE) ---
    const hesContractSelect = document.getElementById('hes-contract-select');
    const hesForm = document.getElementById('hes-form');
    const hesPartidasTableBody = document.getElementById('hes-partidas-table-body');
    const hesSubTotalInput = document.getElementById('hes-sub-total');
    const hesGastosAdmInput = document.getElementById('hes-gastos-adm');
    const hesTotalHESInput = document.getElementById('hes-total-hes');
    const hesIdInput = document.getElementById('hes-id');
    const hesListTableBody = document.getElementById('hes-list-body');

    // Load contracts for HES selection dropdown
    const loadContractsForHES = async () => {
        try {
            const contracts = await db.contracts.toArray();
            hesContractSelect.innerHTML = '<option value="">Seleccione un Contrato</option>';
            contracts.forEach(contract => {
                const option = document.createElement('option');
                option.value = contract.id;
                option.textContent = `${contract.numeroContratoSICAC} - ${contract.descripcionContrato}`;
                hesContractSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar contratos para HES:", error);
            showToast('Error al cargar contratos para HES.', 'error');
        }
    };
    loadContractsForHES(); // Initial load for HES module


    // Event listener when a contract is selected for HES creation
    hesContractSelect.addEventListener('change', async () => {
        const contractId = parseInt(hesContractSelect.value);
        hesPartidasTableBody.innerHTML = ''; // Clear previous HES partidas
        hesSubTotalInput.value = '0.00';
        hesGastosAdmInput.value = '0.00';
        hesTotalHESInput.value = '0.00';
        hesIdInput.value = ''; // Ensure no HES ID is set

        if (contractId) {
            const contract = await db.contracts.get(contractId);
            if (contract && contract.partidas && contract.partidas.length > 0) {
                // Check if 100% of the contract has been executed
                const hesList = await db.hes.where({ contractId: contractId }).toArray();
                let totalExecutedAmount = 0;
                hesList.forEach(hes => {
                    if (hes.ejecutadaHES || hes.aprobadoHES) {
                        totalExecutedAmount += hes.totalHES || 0;
                    }
                });

                if (totalExecutedAmount >= contract.montoTotalContrato * 0.999) { // Using 0.999 for float comparison
                    showToast('Este contrato ya está 100% ejecutado. No se pueden crear más HES.', 'warning');
                    hesForm.reset();
                    hesContractSelect.value = '';
                    return;
                }

                for (const partida of contract.partidas) {
                    // Calculate remaining quantity for this partida
                    let executedQuantityForPartida = 0;
                    for (const hes of hesList) {
                        if (hes.partidasHES) {
                            const hesPartida = hes.partidasHES.find(p => p.description === partida.description && p.umd === partida.umd);
                            if (hesPartida) {
                                executedQuantityForPartida += hesPartida.cantidadEjecutada || 0;
                            }
                        }
                    }
                    const remainingQuantity = partida.quantity - executedQuantityForPartida;

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${partida.description}</td>
                        <td>${partida.quantity}</td>
                        <td>${partida.umd}</td>
                        <td>${partida.unitPrice.toFixed(2)}</td>
                        <td><input type="number" step="0.01" class="form-control form-control-sm hes-partida-cantidad-ejecutada" min="0" max="${remainingQuantity}" value="0"></td>
                        <td class="hes-partida-subtotal">0.00</td>
                        <td class="hes-partida-avance-fisico">0.00%</td>
                        <td class="hes-partida-avance-financiero">0.00%</td>
                        <td>${remainingQuantity.toFixed(2)}</td>
                    `;
                    hesPartidasTableBody.appendChild(row);

                    const cantidadEjecutadaInput = row.querySelector('.hes-partida-cantidad-ejecutada');
                    const hesPartidaSubtotalCell = row.querySelector('.hes-partida-subtotal');
                    const hesPartidaAvanceFisicoCell = row.querySelector('.hes-partida-avance-fisico');
                    const hesPartidaAvanceFinancieroCell = row.querySelector('.hes-partida-avance-financiero');

                    const updateHesPartidaCalculations = () => {
                        const executedQty = parseFloat(cantidadEjecutadaInput.value) || 0;
                        const originalQty = partida.quantity;
                        const unitPrice = partida.unitPrice;

                        const partidaSubtotal = executedQty * unitPrice;
                        hesPartidaSubtotalCell.textContent = partidaSubtotal.toFixed(2);

                        const avanceFisico = (originalQty > 0) ? (executedQty / originalQty) * 100 : 0;
                        hesPartidaAvanceFisicoCell.textContent = `${avanceFisico.toFixed(2)}%`;

                        const avanceFinanciero = (originalQty * unitPrice > 0) ? (partidaSubtotal / (originalQty * unitPrice)) * 100 : 0;
                        hesPartidaAvanceFinancieroCell.textContent = `${avanceFinanciero.toFixed(2)}%`;

                        // Update global HES totals
                        updateHESGlobalTotals();
                    };

                    cantidadEjecutadaInput.addEventListener('input', updateHesPartidaCalculations);
                    updateHesPartidaCalculations(); // Initial calculation for existing HES
                }
            } else {
                showToast('El contrato seleccionado no tiene partidas definidas.', 'warning');
            }
        }
    });

    const updateHESGlobalTotals = () => {
        let currentSubTotal = 0;
        document.querySelectorAll('#hes-partidas-table-body tr').forEach(row => {
            currentSubTotal += parseFloat(row.querySelector('.hes-partida-subtotal').textContent) || 0;
        });

        hesSubTotalInput.value = currentSubTotal.toFixed(2);
        const gastosAdm = currentSubTotal * 0.05; // 5% Gastos Administrativos
        hesGastosAdmInput.value = gastosAdm.toFixed(2);
        hesTotalHESInput.value = (currentSubTotal + gastosAdm).toFixed(2);
    };


    // Save HES
    hesForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const contractId = parseInt(hesContractSelect.value);
        if (!contractId) {
            showToast('Debe seleccionar un contrato para crear una HES.', 'warning');
            return;
        }

        const contract = await db.contracts.get(contractId);
        if (!contract) {
            showToast('Contrato no encontrado para crear HES.', 'error');
            return;
        }

        // Check if 100% of the contract has been executed before saving HES
        const hesListForContract = await db.hes.where({ contractId: contractId }).toArray();
        let totalExecutedAmountForContract = 0;
        hesListForContract.forEach(hes => {
            if (hes.ejecutadaHES || hes.aprobadoHES) {
                totalExecutedAmountForContract += hes.totalHES || 0;
            }
        });

        // Get current HES total before saving
        const currentHesTotal = parseFloat(hesTotalHESInput.value) || 0;

        if (hesIdInput.value === '' && (totalExecutedAmountForContract + currentHesTotal > contract.montoTotalContrato * 1.001)) { // Allow slight floating point errors
            showToast('La suma de las HES excede el monto total del contrato. No se puede crear esta HES.', 'error');
            return;
        }

        const hesData = {
            contractId: contractId,
            numeroHES: document.getElementById('hes-no').value,
            fechaInicioHES: document.getElementById('hes-fecha-inicio').value,
            fechaFinalHES: document.getElementById('hes-fecha-final').value,
            aprobadoHES: document.getElementById('hes-aprobado').checked,
            textoHES: document.getElementById('hes-texto').value,
            ejecutadaHES: document.getElementById('hes-ejecutada').checked,
            fechaCreadoHES: document.getElementById('hes-fecha-creado').value,
            fechaAprobadoHES: document.getElementById('hes-fecha-aprobado').value,
            textoBreveHES: document.getElementById('hes-texto-breve').value,
            valuacionHES: parseFloat(document.getElementById('hes-valuacion').value) || 0,
            lugarPrestacionServicioHES: document.getElementById('hes-lugar-prestacion').value,
            responsableSDOHES: document.getElementById('hes-responsable-sdo').value,
            valuadoHES: document.getElementById('hes-valuado').checked,
            subTotalHES: parseFloat(hesSubTotalInput.value) || 0,
            gastosAdministrativosHES: parseFloat(hesGastosAdmInput.value) || 0,
            totalHES: parseFloat(hesTotalHESInput.value) || 0,
        };

        // Collect HES Partidas
        const hesPartidas = [];
        document.querySelectorAll('#hes-partidas-table-body tr').forEach(row => {
            const description = row.children[0].textContent;
            const quantityContract = parseFloat(row.children[1].textContent);
            const umd = row.children[2].textContent;
            const unitPriceContract = parseFloat(row.children[3].textContent);
            const cantidadEjecutada = parseFloat(row.querySelector('.hes-partida-cantidad-ejecutada').value) || 0;

            // Recalculate advances for each partida before saving
            const partidaSubtotal = cantidadEjecutada * unitPriceContract;
            const avanceFisicoPartida = (quantityContract > 0) ? (cantidadEjecutada / quantityContract) * 100 : 0;
            const avanceFinancieroPartida = (quantityContract * unitPriceContract > 0) ? (partidaSubtotal / (quantityContract * unitPriceContract)) * 100 : 0;

            hesPartidas.push({
                description,
                cantidadContrato: quantityContract,
                umd,
                precioUnitarioContrato: unitPriceContract,
                cantidadEjecutada,
                subtotal: partidaSubtotal,
                avanceFisicoPartida: parseFloat(avanceFisicoPartida.toFixed(2)),
                avanceFinancieroPartida: parseFloat(avanceFinancieroPartida.toFixed(2))
            });
        });
        hesData.partidasHES = hesPartidas;

        // Anexos HES (similar to contract attachments)
        const hesFilesInput = document.getElementById('hes-anexos');
        const attachedHesFiles = [];
        for (const file of hesFilesInput.files) {
            attachedHesFiles.push({ name: file.name, path: `uploads/hes_${file.name}` }); // Placeholder path
        }
        hesData.anexosHES = attachedHesFiles;

        try {
            let savedHesId;
            const isNewHES = !hesIdInput.value;

            if (isNewHES) {
                savedHesId = await db.hes.add(hesData);
                showToast('HES guardada exitosamente.', 'success');
            } else {
                savedHesId = parseInt(hesIdInput.value);
                await db.hes.update(savedHesId, hesData);
                showToast('HES actualizada exitosamente.', 'success');
            }
            clearHesForm();
            loadHesList(); // Refresh HES table
            loadContractList(); // Refresh contract list for advances
        } catch (error) {
            console.error("Error al guardar HES:", error);
            showToast('Error al guardar HES. Verifique los datos.', 'error');
        }
    });

    // Clear HES Form
    const clearHesForm = () => {
        hesForm.reset();
        hesIdInput.value = '';
        hesContractSelect.value = ''; // Reset selected contract
        hesPartidasTableBody.innerHTML = ''; // Clear HES partidas
        hesSubTotalInput.value = '0.00';
        hesGastosAdmInput.value = '0.00';
        hesTotalHESInput.value = '0.00';
        document.getElementById('hes-attached-files-list').innerHTML = '';
        showToast('Formulario HES limpio.', 'info');
    };
    document.getElementById('clear-hes-form-btn').addEventListener('click', clearHesForm);


    // Load HES for Editing
    const loadHesForEdit = async (id) => {
        try {
            const hes = await db.hes.get(id);
            if (hes) {
                hesIdInput.value = hes.id;
                hesContractSelect.value = hes.contractId; // Set selected contract
                await hesContractSelect.dispatchEvent(new Event('change')); // Trigger change to load contract partidas

                // Fill main HES fields
                document.getElementById('hes-no').value = hes.numeroHES;
                document.getElementById('hes-fecha-inicio').value = hes.fechaInicioHES;
                document.getElementById('hes-fecha-final').value = hes.fechaFinalHES;
                document.getElementById('hes-aprobado').checked = hes.aprobadoHES;
                document.getElementById('hes-texto').value = hes.textoHES;
                document.getElementById('hes-ejecutada').checked = hes.ejecutadaHES;
                document.getElementById('hes-fecha-creado').value = hes.fechaCreadoHES;
                document.getElementById('hes-fecha-aprobado').value = hes.fechaAprobadoHES;
                document.getElementById('hes-texto-breve').value = hes.textoBreveHES;
                document.getElementById('hes-valuacion').value = hes.valuacionHES;
                document.getElementById('hes-lugar-prestacion').value = hes.lugarPrestacionServicioHES;
                document.getElementById('hes-responsable-sdo').value = hes.responsableSDOHES;
                document.getElementById('hes-valuado').checked = hes.valuadoHES;

                // Fill HES Partidas (assuming loadContractPartidas already populated the rows based on contract)
                // Now, update quantities and totals for the specific HES
                if (hes.partidasHES && hes.partidasHES.length > 0) {
                    document.querySelectorAll('#hes-partidas-table-body tr').forEach(row => {
                        const description = row.children[0].textContent;
                        const umd = row.children[2].textContent;
                        const hesPartida = hes.partidasHES.find(p => p.description === description && p.umd === umd);

                        if (hesPartida) {
                            row.querySelector('.hes-partida-cantidad-ejecutada').value = hesPartida.cantidadEjecutada;
                            // Manually trigger input event to recalculate totals
                            row.querySelector('.hes-partida-cantidad-ejecutada').dispatchEvent(new Event('input'));
                        }
                    });
                }
                updateHESGlobalTotals(); // Ensure global totals are updated

                document.querySelector('.tab-btn[data-target="hes-management"]').click(); // Switch to HES form tab
            } else {
                showToast('HES no encontrada.', 'error');
            }
        } catch (error) {
            console.error("Error al cargar HES para edición:", error);
            showToast('Error al cargar HES para edición.', 'error');
        }
    };


    // Load HES List (table)
    const loadHesList = async () => {
        try {
            const hesList = await db.hes.toArray();
            hesListTableBody.innerHTML = '';

            if (hesList.length === 0) {
                hesListTableBody.innerHTML = '<tr><td colspan="10" class="text-center">No hay HES registradas.</td></tr>';
                return;
            }

            for (const hes of hesList) {
                const contract = await db.contracts.get(hes.contractId); // Get associated contract for display
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${hes.numeroHES}</td>
                    <td>${contract ? contract.numeroContratoSICAC : 'N/A'}</td>
                    <td>${hes.fechaInicioHES}</td>
                    <td>${hes.fechaFinalHES}</td>
                    <td>${hes.aprobadoHES ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="fas fa-times-circle text-danger"></i>'}</td>
                    <td>${hes.ejecutadaHES ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="fas fa-times-circle text-danger"></i>'}</td>
                    <td>${contract ? contract.moneda : 'USD'} ${hes.totalHES.toFixed(2)}</td>
                    <td>${(hes.totalHES / (contract ? contract.montoTotalContrato : 1) * 100).toFixed(2)}%</td>
                    <td>${hes.partidasHES && hes.partidasHES.length > 0 ?
                        (hes.partidasHES.reduce((sum, p) => sum + p.avanceFisicoPartida, 0) / hes.partidasHES.length).toFixed(2) : '0.00'}%</td>
                    <td class="actions-cell">
                        <button class="btn btn-primary btn-sm edit-hes-btn" data-id="${hes.id}" title="Editar HES"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm delete-hes-btn" data-id="${hes.id}" title="Eliminar HES Permanentemente"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                hesListTableBody.appendChild(row);
            }

            document.querySelectorAll('.edit-hes-btn').forEach(button => {
                button.addEventListener('click', (event) => loadHesForEdit(parseInt(event.currentTarget.dataset.id)));
            });
            document.querySelectorAll('.delete-hes-btn').forEach(button => {
                button.addEventListener('click', (event) => deleteHes(parseInt(event.currentTarget.dataset.id)));
            });

        } catch (error) {
            console.error("Error al cargar lista de HES:", error);
            showToast('Error al cargar lista de HES.', 'error');
        }
    };
    loadHesList(); // Initial load for HES list


    // Delete HES (Permanent)
    const deleteHes = async (id) => {
        if (confirm('¿Está seguro de eliminar esta HES PERMANENTEMENTE? Esta acción no se puede deshacer.')) {
            try {
                await db.hes.delete(id);
                showToast('HES eliminada permanentemente.', 'success');
                loadHesList();
                loadContractList(); // Refresh contract list as HES deletion affects contract advances
            } catch (error) {
                console.error("Error al eliminar HES:", error);
                showToast('Error al eliminar HES.', 'error');
            }
        }
    };


    // --- Reports and Visualizations (NEW MODULE) ---
    const reportContractSelect = document.getElementById('report-contract-select');
    const reportContractDetails = document.getElementById('report-contract-details');
    const reportHesListBody = document.getElementById('report-hes-list-body');
    const reportPartidasChartCtx = document.getElementById('reportPartidasChart').getContext('2d');
    let reportPartidasChart;

    const loadContractsForReports = async () => {
        try {
            const contracts = await db.contracts.toArray();
            reportContractSelect.innerHTML = '<option value="">Seleccione un Contrato</option>';
            contracts.forEach(contract => {
                const option = document.createElement('option');
                option.value = contract.id;
                option.textContent = `${contract.numeroContratoSICAC} - ${contract.descripcionContrato}`;
                reportContractSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar contratos para reportes:", error);
            showToast('Error al cargar contratos para reportes.', 'error');
        }
    };
    loadContractsForReports(); // Initial load for reports module

    reportContractSelect.addEventListener('change', async () => {
        const contractId = parseInt(reportContractSelect.value);
        reportContractDetails.innerHTML = '';
        reportHesListBody.innerHTML = '';
        if (reportPartidasChart) {
            reportPartidasChart.destroy();
        }

        if (!contractId) {
            return;
        }

        const contract = await db.contracts.get(contractId);
        if (!contract) {
            showToast('Contrato no encontrado para reportes.', 'error');
            return;
        }

        const hesList = await db.hes.where({ contractId: contractId }).toArray();
        const advances = await calculateContractAdvances(contractId);

        let totalConsumedAmount = 0;
        hesList.forEach(hes => {
            if (hes.ejecutadaHES || hes.aprobadoHES) {
                totalConsumedAmount += hes.totalHES || 0;
            }
        });
        const remainingAmount = contract.montoTotalContrato - totalConsumedAmount;

        reportContractDetails.innerHTML = `
            <h3>Detalles del Contrato: ${contract.numeroContratoSICAC}</h3>
            <p><strong>Monto Total del Contrato:</strong> ${contract.moneda} ${contract.montoTotalContrato.toFixed(2)}</p>
            <p><strong>Monto Consumido (HES Ejecutadas/Aprobadas):</strong> ${contract.moneda} ${totalConsumedAmount.toFixed(2)}</p>
            <p><strong>Monto Restante del Contrato:</strong> ${contract.moneda} ${remainingAmount.toFixed(2)}</p>
            <p><strong>Avance Financiero Total:</strong> ${advances.financial}%</p>
            <p><strong>Avance Físico Total:</strong> ${advances.physical}%</p>
            <h4>Partidas del Contrato y Avance:</h4>
            <table class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th>Cant. Original</th>
                        <th>Cant. Ejecutada</th>
                        <th>UMD</th>
                        <th>P. Unitario</th>
                        <th>Avance Físico (%)</th>
                        <th>Avance Financiero (%)</th>
                    </tr>
                </thead>
                <tbody id="report-contract-partidas-body">
                </tbody>
            </table>
        `;

        const reportContractPartidasBody = document.getElementById('report-contract-partidas-body');
        const partidaDescriptions = [];
        const partidaPhysicalAdvances = [];
        const partidaFinancialAdvances = [];

        if (contract.partidas && contract.partidas.length > 0) {
            for (const p of contract.partidas) {
                let totalExecutedQtyForPartida = 0;
                let totalExecutedAmountForPartida = 0;

                for (const hes of hesList) {
                    if (hes.ejecutadaHES || hes.aprobadoHES) {
                        const hesPartida = hes.partidasHES.find(hp => hp.description === p.description && hp.umd === p.umd);
                        if (hesPartida) {
                            totalExecutedQtyForPartida += hesPartida.cantidadEjecutada || 0;
                            totalExecutedAmountForPartida += (hesPartida.cantidadEjecutada * hesPartida.precioUnitarioContrato) || 0;
                        }
                    }
                }

                const currentPhysicalAdvance = (p.quantity > 0) ? (totalExecutedQtyForPartida / p.quantity) * 100 : 0;
                const currentFinancialAdvance = (p.total > 0) ? (totalExecutedAmountForPartida / p.total) * 100 : 0;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${p.description}</td>
                    <td>${p.quantity}</td>
                    <td>${totalExecutedQtyForPartida.toFixed(2)}</td>
                    <td>${p.umd}</td>
                    <td>${p.unitPrice.toFixed(2)}</td>
                    <td>${currentPhysicalAdvance.toFixed(2)}%</td>
                    <td>${currentFinancialAdvance.toFixed(2)}%</td>
                `;
                reportContractPartidasBody.appendChild(row);

                partidaDescriptions.push(p.description);
                partidaPhysicalAdvances.push(parseFloat(currentPhysicalAdvance.toFixed(2)));
                partidaFinancialAdvances.push(parseFloat(currentFinancialAdvance.toFixed(2)));
            }
        }

        // Render Partidas Chart
        if (reportPartidasChart) { reportPartidasChart.destroy(); }
        reportPartidasChart = new Chart(reportPartidasChartCtx, {
            type: 'bar',
            data: {
                labels: partidaDescriptions,
                datasets: [
                    {
                        label: 'Avance Físico por Partida (%)',
                        data: partidaPhysicalAdvances,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Avance Financiero por Partida (%)',
                        data: partidaFinancialAdvances,
                        backgroundColor: 'rgba(153, 102, 255, 0.6)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Porcentaje de Avance (%)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Avance por Partidas del Contrato'
                    }
                }
            }
        });


        // List HES for the selected contract
        if (hesList.length > 0) {
            for (const hes of hesList) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${hes.numeroHES}</td>
                    <td>${hes.fechaInicioHES}</td>
                    <td>${hes.fechaFinalHES}</td>
                    <td>${hes.aprobadoHES ? 'Sí' : 'No'}</td>
                    <td>${hes.ejecutadaHES ? 'Sí' : 'No'}</td>
                    <td>${contract.moneda} ${hes.totalHES.toFixed(2)}</td>
                    <td><button class="btn btn-info btn-sm view-hes-report-btn" data-id="${hes.id}" title="Ver Reporte de HES"><i class="fas fa-chart-bar"></i></button></td>
                `;
                reportHesListBody.appendChild(row);
            }
            document.querySelectorAll('.view-hes-report-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const hesId = parseInt(event.currentTarget.dataset.id);
                    await showHesReportModal(hesId, contract);
                });
            });
        } else {
            reportHesListBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay HES registradas para este contrato.</td></tr>';
        }
    });

    // HES Report Modal
    const hesReportModal = new bootstrap.Modal(document.getElementById('hesReportModal'));
    const hesReportModalTitle = document.getElementById('hesReportModalLabel');
    const hesReportModalBody = document.getElementById('hes-report-modal-body');
    const hesReportPartidasChartCtx = document.getElementById('hesReportPartidasChart').getContext('2d');
    let hesReportPartidasChart;

    const showHesReportModal = async (hesId, contract) => {
        const hes = await db.hes.get(hesId);
        if (!hes) {
            showToast('HES no encontrada.', 'error');
            return;
        }

        hesReportModalTitle.textContent = `Reporte de HES: ${hes.numeroHES} del Contrato ${contract.numeroContratoSICAC}`;

        hesReportModalBody.innerHTML = `
            <p><strong>Fecha Inicio HES:</strong> ${hes.fechaInicioHES}</p>
            <p><strong>Fecha Final HES:</strong> ${hes.fechaFinalHES}</p>
            <p><strong>Aprobada:</strong> ${hes.aprobadoHES ? 'Sí' : 'No'}</p>
            <p><strong>Ejecutada:</strong> ${hes.ejecutadaHES ? 'Sí' : 'No'}</p>
            <p><strong>Valuación HES:</strong> ${contract.moneda} ${hes.valuacionHES.toFixed(2)}</p>
            <p><strong>Sub Total HES:</strong> ${contract.moneda} ${hes.subTotalHES.toFixed(2)}</p>
            <p><strong>5% Gastos Administrativos:</strong> ${contract.moneda} ${hes.gastosAdministrativosHES.toFixed(2)}</p>
            <p><strong>Total HES:</strong> ${contract.moneda} ${hes.totalHES.toFixed(2)}</p>
            <p><strong>Descripción:</strong> ${hes.textoHES}</p>
            <p><strong>Anexos:</strong> ${hes.anexosHES && hes.anexosHES.length > 0 ? hes.anexosHES.map(f => f.name).join(', ') : 'N/A'}</p>

            <h4>Avance por Partida en esta HES:</h4>
            <table class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th>Cant. Contrato</th>
                        <th>P. Unitario</th>
                        <th>Cant. Ejecutada</th>
                        <th>Avance Físico (%)</th>
                        <th>Avance Financiero (%)</th>
                    </tr>
                </thead>
                <tbody id="hes-report-partidas-body">
                </tbody>
            </table>
            <div style="width: 100%; height: 300px;"><canvas id="hesReportPartidasChart"></canvas></div>
        `;

        const hesReportPartidasBody = document.getElementById('hes-report-partidas-body');
        const hesPartidaDescriptions = [];
        const hesPartidaPhysicalAdvances = [];
        const hesPartidaFinancialAdvances = [];

        if (hes.partidasHES && hes.partidasHES.length > 0) {
            hes.partidasHES.forEach(p => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${p.description}</td>
                    <td>${p.cantidadContrato}</td>
                    <td>${p.precioUnitarioContrato.toFixed(2)}</td>
                    <td>${p.cantidadEjecutada}</td>
                    <td>${p.avanceFisicoPartida.toFixed(2)}%</td>
                    <td>${p.avanceFinancieroPartida.toFixed(2)}%</td>
                `;
                hesReportPartidasBody.appendChild(row);

                hesPartidaDescriptions.push(p.description);
                hesPartidaPhysicalAdvances.push(p.avanceFisicoPartida);
                hesPartidaFinancialAdvances.push(p.avanceFinancieroPartida);
            });
        } else {
            hesReportPartidasBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay partidas registradas para esta HES.</td></tr>';
        }

        // Render HES Partidas Chart
        if (hesReportPartidasChart) { hesReportPartidasChart.destroy(); }
        hesReportPartidasChart = new Chart(hesReportPartidasChartCtx, {
            type: 'bar',
            data: {
                labels: hesPartidaDescriptions,
                datasets: [
                    {
                        label: 'Avance Físico por Partida HES (%)',
                        data: hesPartidaPhysicalAdvances,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Avance Financiero por Partida HES (%)',
                        data: hesPartidaFinancialAdvances,
                        backgroundColor: 'rgba(153, 102, 255, 0.6)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Porcentaje de Avance (%)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Avance de Partidas de la HES'
                    }
                }
            }
        });

        hesReportModal.show();
    };

    // --- End of DOMContentLoaded ---
});