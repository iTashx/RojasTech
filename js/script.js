// script.js

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si Dexie está disponible
    if (typeof Dexie === 'undefined') {
        console.error("Dexie.js no se ha cargado correctamente. Asegúrate de que la CDN esté accesible.");
        // Un mensaje de alerta más intrusivo si el toast no funciona
        alert("Error crítico: Dexie.js no está disponible. La aplicación no funcionará correctamente.");
        return; // Detener la ejecución si Dexie no está presente
    }

    // Inicializar base de datos
    const db = new Dexie('SigesconDB');
    db.version(1).stores({
        contracts: '++id,numeroProveedor,fechaFirmaContrato,fechaCreado,fechaInicio,fechaTerminacion,periodoCulminacion,numeroContratoSICAC,divisionArea,eemn,region,naturalezaContratacion,lineaServicio,numeroPeticionOferta,modalidadContratacion,regimenLaboral,descripcionContrato,fechaCambioAlcance,montoOriginal,montoModificado,montoTotalContrato,numeroContrato,observaciones,estatusContrato,archivosAdjuntos,partidas',
        advances: '++id,contractId,date,percentage,amount,description', // Avances Físicos (originales)
        hes: '++id,contractId,numeroHES,fechaInicioHES,fechaFinalHES,aprobadoHES,textoHES,ejecutadaHES,fechaCreadoHES,fechaAprobadoHES,textoBreveHES,valuacionHES,lugarPrestacionServicioHES,responsableSDOHES,anexosHES,valuadoHES,subTotalHES,gastosAdministrativosHES,totalHES,partidasHES',
        modalities: '++id,name' // Tabla para modalidades de contratación
    });

    try {
        await db.open();
        console.log("Base de datos abierta correctamente.");
    } catch (err) {
        console.error("Error al abrir la base de datos:", err.stack || err);
        showToast("Error al cargar la base de datos local. Recargue la página.", "error");
    }

    // --- Global Utility Functions ---
    const toastElement = document.getElementById('toast');
    const showToast = (message, type = 'success') => {
        if (!toastElement) {
            console.warn('Elemento toast no encontrado. Mensaje:', message);
            return;
        }
        toastElement.textContent = message;
        toastElement.className = `toast show ${type}`;
        setTimeout(() => {
            toastElement.className = toastElement.className.replace('show', '');
        }, 3000);
    };
    window.showToast = showToast; // Hacerla global para acceso desde fuera del DOMContentLoaded si es necesario

    const isValidDate = (dateString) => {
        if (!dateString) return false;
        // Añadir T00:00:00 para evitar problemas de zona horaria con new Date()
        const d = new Date(dateString + 'T00:00:00'); 
        return !isNaN(d.getTime());
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
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            } else {
                console.error(`Sección con ID ${targetSectionId} no encontrada.`);
                showToast('Error: Sección no encontrada.', 'error');
                return;
            }

            // Special handling for sections that need refresh
            if (targetSectionId === 'list-contracts') {
                loadContractList();
                loadModalities(); // Ensure modalities are loaded for filters
            } else if (targetSectionId === 'advance-physical') {
                loadContractsForAdvance();
                // Optionally, clear/reset advance form here
                // document.getElementById('advance-form')?.reset();
                // document.getElementById('advance-history-body')?.innerHTML = '<tr><td colspan="4" class="text-center">Seleccione un contrato para ver su historial.</td></tr>';
            } else if (targetSectionId === 'graphic-summary') {
                renderChart(); // Placeholder, implement this function
            } else if (targetSectionId === 'hes-management') { // New HES tab
                loadContractsForHES(); // Load contracts for HES selection
                loadHesList(); // Load existing HES (placeholder)
            } else if (targetSectionId === 'reports-view') { // New Reports tab
                loadContractsForReports(); // Load contracts for report selection (placeholder)
            } else if (targetSectionId === 'general-summary') {
                updateDashboardStats();
            }
        });
    });

    // Activate the default tab (Resumen General) on page load
    document.querySelector('.tab-btn[data-target="general-summary"]')?.click();


    // --- Dashboard / Resumen General ---
    const updateDashboardStats = async () => {
        try {
            const contracts = await db.contracts.toArray();
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to compare only dates

            const activeContracts = contracts.filter(c => {
                if (!isValidDate(c.fechaTerminacion)) return false;
                const endDate = new Date(c.fechaTerminacion + 'T00:00:00');
                return endDate >= today;
            });

            const totalContractedAmount = activeContracts.reduce((sum, c) => sum + (c.montoTotalContrato || 0), 0);
            const contractsDueSoon = activeContracts.filter(c => {
                if (!isValidDate(c.fechaTerminacion)) return false;
                const endDate = new Date(c.fechaTerminacion + 'T00:00:00');
                const diffTime = endDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 30;
            }).length;

            const modalities = await db.modalities.toArray();

            document.getElementById('active-contracts-count')?.textContent = activeContracts.length;
            document.getElementById('total-contracted-amount')?.textContent = `USD ${totalContractedAmount.toFixed(2)}`;
            document.getElementById('contracts-due-soon-count')?.textContent = contractsDueSoon;
            document.getElementById('total-modalities-count')?.textContent = modalities.length;
        } catch (error) {
            console.error("Error updating dashboard stats:", error);
            showToast('Error al actualizar estadísticas del dashboard.', 'error');
        }
    };
    // updateDashboardStats() is called by the click event on the default tab.


    // --- Modalities Management (for Contract Form) ---
    const modalitySelect = document.getElementById('modalidad-contratacion');
    const filterModalidadSelect = document.getElementById('filter-modalidad'); // Ensure this element exists in list-contracts section

    const loadModalities = async () => {
        try {
            const modalities = await db.modalities.toArray();
            if (modalitySelect) {
                modalitySelect.innerHTML = '<option value="">Seleccione una modalidad</option>';
            }
            if (filterModalidadSelect) {
                filterModalidadSelect.innerHTML = '<option value="Todos">Todos</option>';
            }
            
            modalities.forEach(mod => {
                if (modalitySelect) {
                    const option = document.createElement('option');
                    option.value = mod.name;
                    option.textContent = mod.name;
                    modalitySelect.appendChild(option);
                }
                if (filterModalidadSelect) {
                    const filterOption = document.createElement('option');
                    filterOption.value = mod.name;
                    filterOption.textContent = mod.name;
                    filterModalidadSelect.appendChild(filterOption);
                }
            });
        } catch (error) {
            console.error("Error al cargar modalidades:", error);
            showToast('Error al cargar modalidades.', 'error');
        }
    };
    // loadModalities() is called by the click event on the default tab, and list-contracts tab


    const addModalityBtn = document.getElementById('add-modality-btn');
    if (addModalityBtn) {
        addModalityBtn.addEventListener('click', async () => {
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
    }

    const removeModalityBtn = document.getElementById('remove-modality-btn');
    if (removeModalityBtn) {
        removeModalityBtn.addEventListener('click', async () => {
            if (!modalitySelect) {
                showToast('Elemento de selección de modalidad no encontrado.', 'error');
                return;
            }
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
    }

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
        if (!fechaInicioInput || !fechaTerminacionInput || !duracionDiasInput) return;

        if (!isValidDate(fechaInicioInput.value) || !isValidDate(fechaTerminacionInput.value)) {
            duracionDiasInput.value = '';
            return;
        }
        const startDate = new Date(fechaInicioInput.value + 'T00:00:00');
        const endDate = new Date(fechaTerminacionInput.value + 'T00:00:00');

        if (startDate <= endDate) {
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day
            duracionDiasInput.value = diffDays;
        } else {
            duracionDiasInput.value = '';
            showToast('La fecha de terminación no puede ser anterior a la fecha de inicio.', 'warning');
        }
    };

    if (fechaInicioInput) fechaInicioInput.addEventListener('change', updateDuracionDias);
    if (fechaTerminacionInput) fechaTerminacionInput.addEventListener('change', updateDuracionDias);

    // Function to update Monto Original and Total from Partidas
    const updateMontoOriginalAndTotal = () => {
        let totalPartidas = 0;
        document.querySelectorAll('#partidas-table-body tr').forEach(row => {
            const totalCell = row.querySelector('.partida-total');
            if (totalCell) {
                totalPartidas += parseFloat(totalCell.textContent) || 0;
            }
        });
        if (montoOriginalInput) montoOriginalInput.value = totalPartidas.toFixed(2);

        const montoModificadoVal = parseFloat(montoModificadoInput?.value) || 0;
        if (montoTotalContratoInput) montoTotalContratoInput.value = (totalPartidas + montoModificadoVal).toFixed(2);
    };

    if (montoModificadoInput) montoModificadoInput.addEventListener('input', updateMontoOriginalAndTotal);


    // Add Partida Row
    let partidaCounter = 0;
    if (addPartidaBtn && partidasTableBody) {
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
                // Re-index remaining rows after removal
                partidaCounter = 0; // Reset counter for re-indexing
                document.querySelectorAll('#partidas-table-body tr').forEach((r, idx) => {
                    r.firstElementChild.textContent = idx + 1; // Update displayed index
                    partidaCounter++; // Update counter to the last index + 1
                });
            });
        });
    }

    // Clear Contract Form
    const clearContractForm = () => {
        if (contractForm) contractForm.reset();
        if (contractIdInput) contractIdInput.value = '';
        if (partidasTableBody) partidasTableBody.innerHTML = ''; // Clear partidas
        if (montoOriginalInput) montoOriginalInput.value = '0.00';
        if (montoModificadoInput) montoModificadoInput.value = '0.00';
        if (montoTotalContratoInput) montoTotalContratoInput.value = '0.00';
        if (duracionDiasInput) duracionDiasInput.value = '';
        partidaCounter = 0; // Reset counter
        const attachedFilesList = document.getElementById('attached-files-list');
        if (attachedFilesList) attachedFilesList.innerHTML = ''; // Clear file list
        showToast('Formulario de contrato limpio.', 'info');
    };
    if (clearContractFormBtn) clearContractFormBtn.addEventListener('click', clearContractForm);


    // Save Contract
    if (contractForm) {
        contractForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const contractData = {
                numeroProveedor: document.getElementById('numero-proveedor')?.value || '',
                fechaFirmaContrato: document.getElementById('fecha-firma-contrato')?.value || '',
                fechaCreado: document.getElementById('fecha-creacion')?.value || '',
                fechaInicio: document.getElementById('fecha-inicio')?.value || '',
                fechaTerminacion: document.getElementById('fecha-terminacion')?.value || '',
                periodoCulminacion: document.getElementById('duracion-dias')?.value || '',
                numeroContratoSICAC: document.getElementById('numero-contrato-sicac')?.value || '',
                divisionArea: document.getElementById('division-area')?.value || '',
                eemn: document.getElementById('eemn')?.value || '',
                region: document.getElementById('region')?.value || '',
                naturalezaContratacion: document.getElementById('naturaleza-contratacion')?.value || '',
                lineaServicio: document.getElementById('linea-servicio')?.value || '',
                numeroPeticionOferta: document.getElementById('no-peticion-oferta')?.value || '',
                modalidadContratacion: document.getElementById('modalidad-contratacion')?.value || '',
                regimenLaboral: document.getElementById('regimen-laboral')?.value || '',
                descripcionContrato: document.getElementById('objeto-contractual')?.value || '',
                fechaCambioAlcance: document.getElementById('fecha-cambio-alcance')?.value || '',
                montoOriginal: parseFloat(montoOriginalInput?.value) || 0,
                montoModificado: parseFloat(montoModificadoInput?.value) || 0,
                montoTotalContrato: parseFloat(montoTotalContratoInput?.value) || 0,
                numeroContrato: document.getElementById('numero-contrato')?.value || '',
                observaciones: document.getElementById('observaciones')?.value || '',
                estatusContrato: document.getElementById('estatus-contrato')?.value || '',
            };

            // Collect Partidas
            const partidas = [];
            let allPartidasValid = true;
            document.querySelectorAll('#partidas-table-body tr').forEach(row => {
                const description = row.querySelector('.partida-description')?.value;
                const quantity = parseFloat(row.querySelector('.partida-quantity')?.value);
                const umd = row.querySelector('.partida-umd')?.value;
                const unitPrice = parseFloat(row.querySelector('.partida-unit-price')?.value);
                const total = parseFloat(row.querySelector('.partida-total')?.textContent);

                if (!description || isNaN(quantity) || !umd || isNaN(unitPrice)) {
                    allPartidasValid = false;
                    return; // Salir del forEach si una partida no es válida
                }

                partidas.push({
                    description: description,
                    quantity: quantity,
                    umd: umd,
                    unitPrice: unitPrice,
                    total: total,
                });
            });

            if (!allPartidasValid) {
                showToast('Todas las partidas deben tener descripción, cantidad, UMD y precio unitario válidos.', 'error');
                return;
            }
            contractData.partidas = partidas;

            // Collect Attached Files (only names for now)
            const filesInput = document.getElementById('adjuntar-archivos');
            const attachedFiles = [];
            if (filesInput && filesInput.files) {
                for (const file of filesInput.files) {
                    attachedFiles.push({ name: file.name, path: `uploads/${file.name}` }); // Placeholder path
                }
            }
            contractData.archivosAdjuntos = attachedFiles;


            try {
                let savedContractId;
                const isNewContract = !contractIdInput?.value;

                if (isNewContract) {
                    savedContractId = await db.contracts.add(contractData);
                    showToast('Contrato guardado exitosamente.', 'success');

                    // === Avance Físico Automático (0% al Crear Contrato) ===
                    const avanceFecha = isValidDate(contractData.fechaCreado) ? contractData.fechaCreado : new Date().toISOString().split('T')[0];
                    await db.advances.add({
                        contractId: savedContractId,
                        date: avanceFecha,
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
    }

    // Load Contract for Editing
    const loadContractForEdit = async (id) => {
        try {
            const contract = await db.contracts.get(id);
            if (contract) {
                if (contractIdInput) contractIdInput.value = contract.id;
                document.getElementById('numero-proveedor').value = contract.numeroProveedor || '';
                document.getElementById('fecha-firma-contrato').value = contract.fechaFirmaContrato || '';
                document.getElementById('fecha-creacion').value = contract.fechaCreado || '';
                document.getElementById('fecha-inicio').value = contract.fechaInicio || '';
                document.getElementById('fecha-terminacion').value = contract.fechaTerminacion || '';
                document.getElementById('duracion-dias').value = contract.periodoCulminacion || '';
                document.getElementById('numero-contrato-sicac').value = contract.numeroContratoSICAC || '';
                document.getElementById('division-area').value = contract.divisionArea || '';
                document.getElementById('eemn').value = contract.eemn || '';
                document.getElementById('region').value = contract.region || '';
                document.getElementById('naturaleza-contratacion').value = contract.naturalezaContratacion || '';
                document.getElementById('linea-servicio').value = contract.lineaServicio || '';
                document.getElementById('no-peticion-oferta').value = contract.numeroPeticionOferta || '';
                if (modalitySelect) modalitySelect.value = contract.modalidadContratacion || '';
                document.getElementById('regimen-laboral').value = contract.regimenLaboral || '';
                document.getElementById('objeto-contractual').value = contract.descripcionContrato || '';
                document.getElementById('fecha-cambio-alcance').value = contract.fechaCambioAlcance || '';
                if (montoOriginalInput) montoOriginalInput.value = (contract.montoOriginal || 0).toFixed(2);
                if (montoModificadoInput) montoModificadoInput.value = (contract.montoModificado || 0).toFixed(2);
                if (montoTotalContratoInput) montoTotalContratoInput.value = (contract.montoTotalContrato || 0).toFixed(2);
                document.getElementById('numero-contrato').value = contract.numeroContrato || '';
                document.getElementById('observaciones').value = contract.observaciones || '';
                document.getElementById('estatus-contrato').value = contract.estatusContrato || '';


                // Load Partidas
                if (partidasTableBody) partidasTableBody.innerHTML = '';
                partidaCounter = 0; // Reset counter before loading new ones
                if (partidasTableBody && contract.partidas && contract.partidas.length > 0) {
                    contract.partidas.forEach((partida, index) => {
                        partidaCounter++;
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${partidaCounter}</td>
                            <td><input type="text" class="form-control form-control-sm partida-description" value="${partida.description || ''}" required></td>
                            <td><input type="number" step="0.01" class="form-control form-control-sm partida-quantity" value="${partida.quantity || 0}" required></td>
                            <td><input type="text" class="form-control form-control-sm partida-umd" value="${partida.umd || ''}" required></td>
                            <td><input type="number" step="0.01" class="form-control form-control-sm partida-unit-price" value="${partida.unitPrice || 0}" required></td>
                            <td class="partida-total">${(partida.total || 0).toFixed(2)}</td>
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
                            partidaCounter = 0; // Reset for re-indexing
                            document.querySelectorAll('#partidas-table-body tr').forEach((r, idx) => {
                                r.firstElementChild.textContent = idx + 1;
                                partidaCounter++;
                            });
                        });
                    });
                }
                updateMontoOriginalAndTotal(); // Ensure calculated fields are correct
                document.querySelector('.tab-btn[data-target="new-edit-contract"]')?.click(); // Switch to contract form tab

                // Load attached files for display (names only)
                const attachedFilesList = document.getElementById('attached-files-list');
                if (attachedFilesList) attachedFilesList.innerHTML = '';
                if (attachedFilesList && contract.archivosAdjuntos && contract.archivosAdjuntos.length > 0) {
                    contract.archivosAdjuntos.forEach(file => {
                        const fileItem = document.createElement('div');
                        fileItem.textContent = file.name;
                        attachedFilesList.appendChild(fileItem);
                    });
                }
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
    // filterModalidad already defined globally for modalities management
    const filterEstado = document.getElementById('filter-estado');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');


    // Function to calculate Financial and Physical Advance for display (IMPROVED LOGIC)
    const calculateContractAdvances = async (contractId) => {
        const contract = await db.contracts.get(contractId);
        if (!contract || !contract.montoTotalContrato) {
            return { financial: 0, physical: 0 };
        }

        const hesList = await db.hes.where({ contractId: contractId }).toArray();
        let totalExecutedFinancialAmount = 0;

        // Map to store accumulated executed quantity for each contract partida
        // Key: `${description}-${umd}`, Value: accumulated_executed_quantity
        const executedQuantitiesByPartida = new Map();

        // Calculate total original amount from contract partidas and initialize executed quantities map
        let totalContractOriginalValue = 0;
        if (contract.partidas && contract.partidas.length > 0) {
            contract.partidas.forEach(p => {
                totalContractOriginalValue += p.total; // Sum of original values (quantity * unitPrice)
                executedQuantitiesByPartida.set(`${p.description}-${p.umd}`, 0); // Initialize executed quantities
            });
        }

        for (const hes of hesList) {
            // Consider only executed/approved HES for calculations
            if (hes.ejecutadaHES || hes.aprobadoHES) {
                totalExecutedFinancialAmount += hes.totalHES || 0; // Accumulate financial execution

                if (hes.partidasHES && hes.partidasHES.length > 0) {
                    for (const hesPartida of hes.partidasHES) {
                        const key = `${hesPartida.description}-${hesPartida.umd}`;
                        if (executedQuantitiesByPartida.has(key)) {
                            // Accumulate executed quantity for this specific partida across all HES
                            executedQuantitiesByPartida.set(key, executedQuantitiesByPartida.get(key) + (hesPartida.cantidadEjecutada || 0));
                        }
                    }
                }
            }
        }

        let totalWeightedPhysicalAdvance = 0;
        // Calculate total physical advance based on accumulated executed quantities for each contract partida
        for (const contractPartida of contract.partidas || []) {
            const key = `${contractPartida.description}-${contractPartida.umd}`;
            const accumulatedExecutedQuantity = executedQuantitiesByPartida.get(key) || 0;

            if (contractPartida.quantity > 0) { // Avoid division by zero
                // Calculate individual partida progress, cap at 100%
                const individualPartidaProgress = Math.min(1, accumulatedExecutedQuantity / contractPartida.quantity);
                // Weight this partida's advance by its original total value in the contract
                totalWeightedPhysicalAdvance += individualPartidaProgress * contractPartida.total;
            }
        }

        const financialAdvance = (contract.montoTotalContrato > 0) ? (totalExecutedFinancialAmount / contract.montoTotalContrato) * 100 : 0;
        const physicalAdvance = (totalContractOriginalValue > 0) ? (totalWeightedPhysicalAdvance / totalContractOriginalValue) * 100 : 0;

        return {
            financial: parseFloat(financialAdvance.toFixed(2)),
            physical: parseFloat(physicalAdvance.toFixed(2))
        };
    };

    // Load Contract List (main table)
    async function loadContractList() {
        if (!contractListBody) return; // Exit if the element is not found
        contractListBody.innerHTML = `<tr><td colspan="10" class="text-center">Cargando contratos...</td></tr>`;

        let contracts = await db.contracts.toArray();

        // Apply filters (check if filter elements exist)
        const fProveedor = filterProveedor?.value.toLowerCase() || '';
        const fSicac = filterSicac?.value.toLowerCase() || '';
        const fFechaInicio = filterFechaInicio?.value || '';
        const fFechaFinal = filterFechaFinal?.value || '';
        const fModalidad = filterModalidadSelect?.value || 'Todos';
        const fEstado = filterEstado?.value || 'Todos';

        contracts = contracts.filter(contract => {
            const matchesProveedor = (contract.numeroProveedor || '').toLowerCase().includes(fProveedor);
            const matchesSicac = (contract.numeroContratoSICAC || '').toLowerCase().includes(fSicac);

            let matchesDate = true;
            if (fFechaInicio && isValidDate(contract.fechaInicio)) {
                const contractStartDate = new Date(contract.fechaInicio + 'T00:00:00');
                const filterStartDate = new Date(fFechaInicio + 'T00:00:00');
                if (contractStartDate < filterStartDate) matchesDate = false;
            }
            if (fFechaFinal && isValidDate(contract.fechaTerminacion)) {
                const contractEndDate = new Date(contract.fechaTerminacion + 'T00:00:00');
                const filterEndDate = new Date(fFechaFinal + 'T00:00:00');
                if (contractEndDate > filterEndDate) matchesDate = false;
            }

            const matchesModalidad = fModalidad === 'Todos' || (contract.modalidadContratacion || '') === fModalidad;

            let matchesEstado = true;
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to compare only dates

            if (fEstado !== 'Todos') {
                if (!isValidDate(contract.fechaTerminacion)) {
                    matchesEstado = false; // Cannot have a date status if the date is invalid
                } else {
                    const contractEndForStatus = new Date(contract.fechaTerminacion + 'T00:00:00');

                    if (fEstado === 'Activos') {
                        matchesEstado = contractEndForStatus >= today;
                    } else if (fEstado === 'Por Vencer (30 días)') {
                        const thirtyDaysFromNow = new Date(today);
                        thirtyDaysFromNow.setDate(today.getDate() + 30);
                        thirtyDaysFromNow.setHours(0, 0, 0, 0);
                        matchesEstado = contractEndForStatus > today && contractEndForStatus <= thirtyDaysFromNow;
                    } else if (fEstado === 'Vencidos') {
                        matchesEstado = contractEndForStatus < today;
                    } else {
                        // Match specific status from dropdown
                        matchesEstado = (contract.estatusContrato || '') === fEstado;
                    }
                }
            }
            return matchesProveedor && matchesSicac && matchesDate && matchesModalidad && matchesEstado;
        });

        contractListBody.innerHTML = ''; // Clear loading message

        if (contracts.length === 0) {
            contractListBody.innerHTML = `<tr><td colspan="10" class="text-center">No hay contratos que coincidan con los filtros.</td></tr>`;
            return;
        }

        for (const contract of contracts) {
            const advances = await calculateContractAdvances(contract.id);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contract.numeroProveedor || ''}</td>
                <td>${contract.numeroContratoSICAC || ''}</td>
                <td>${contract.fechaInicio || ''}</td>
                <td>${contract.fechaTerminacion || ''}</td>
                <td>${contract.periodoCulminacion || ''}</td>
                <td>USD ${(contract.montoTotalContrato || 0).toFixed(2)}</td>
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

        // Add event listeners to the new buttons after they are added to the DOM
        contractListBody.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', () => loadContractForEdit(parseInt(button.dataset.id)));
        });

        contractListBody.querySelectorAll('.delete-contract-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const id = parseInt(button.dataset.id);
                if (confirm('¿Está seguro de eliminar este contrato y todos sus avances y HES asociados? Esta acción es irreversible.')) {
                    try {
                        await db.contracts.delete(id);
                        // Also delete related advances and HES
                        await db.advances.where({ contractId: id }).delete();
                        await db.hes.where({ contractId: id }).delete();
                        showToast('Contrato y datos asociados eliminados exitosamente.', 'success');
                        loadContractList();
                        updateDashboardStats();
                        // Refrescar otras secciones que dependen de contratos
                        loadContractsForAdvance();
                        loadContractsForHES();
                        loadContractsForReports();
                    } catch (error) {
                        console.error("Error al eliminar contrato:", error);
                        showToast('Error al eliminar contrato.', 'error');
                    }
                }
            });
        });

        // Add event listeners for view details, export Excel, export PDF (placeholders)
        contractListBody.querySelectorAll('.view-details-btn').forEach(button => {
            button.addEventListener('click', () => {
                const id = parseInt(button.dataset.id);
                showToast(`Ver detalles del contrato ID: ${id} (Funcionalidad pendiente)`, 'info');
                // Aquí podrías llamar a una función como: viewContractDetails(id);
            });
        });

        contractListBody.querySelectorAll('.export-single-excel-btn').forEach(button => {
            button.addEventListener('click', () => {
                const id = parseInt(button.dataset.id);
                showToast(`Exportar a Excel contrato ID: ${id} (Funcionalidad pendiente, requiere SheetJS)`, 'info');
                // Aquí podrías llamar a una función como: exportSingleContractToExcel(id);
            });
        });

        contractListBody.querySelectorAll('.export-single-pdf-btn').forEach(button => {
            button.addEventListener('click', () => {
                const id = parseInt(button.dataset.id);
                showToast(`Exportar a PDF contrato ID: ${id} (Funcionalidad pendiente, requiere jsPDF)`, 'info');
                // Aquí podrías llamar a una función como: exportSingleContractToPdf(id);
            });
        });
    }

    // Filters event listeners
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', loadContractList);
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            if (filterProveedor) filterProveedor.value = '';
            if (filterSicac) filterSicac.value = '';
            if (filterFechaInicio) filterFechaInicio.value = '';
            if (filterFechaFinal) filterFechaFinal.value = '';
            if (filterModalidadSelect) filterModalidadSelect.value = 'Todos';
            if (filterEstado) filterEstado.value = 'Todos';
            loadContractList();
            showToast('Filtros limpiados.', 'info');
        });
    }


    // --- Advance Physical Section Functions ---
    const advanceContractSelect = document.getElementById('advance-contract-select');
    const advanceHistoryBody = document.getElementById('advance-history-body');

    async function loadContractsForAdvance() {
        if (!advanceContractSelect) return;
        advanceContractSelect.innerHTML = '<option value="">Cargando contratos...</option>';
        try {
            const contracts = await db.contracts.toArray();
            advanceContractSelect.innerHTML = '<option value="">Seleccione un Contrato</option>';
            contracts.forEach(c => {
                const option = document.createElement('option');
                option.value = c.id;
                option.textContent = `${c.numeroContrato || c.numeroContratoSICAC || c.id} - ${c.descripcionContrato}`;
                advanceContractSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar contratos para avance físico:", error);
            showToast('Error al cargar contratos para avance.', 'error');
        }
    }

    // Event listener for advance contract selection change
    if (advanceContractSelect) {
        advanceContractSelect.addEventListener('change', async () => {
            const contractId = parseInt(advanceContractSelect.value);
            if (contractId) {
                loadAdvanceHistory(contractId);
            } else {
                if (advanceHistoryBody) advanceHistoryBody.innerHTML = '<tr><td colspan="4" class="text-center">Seleccione un contrato para ver su historial.</td></tr>';
            }
        });
    }

    async function saveAdvance(contractId, date, percentage, description) {
        try {
            await db.advances.add({
                contractId: contractId,
                date: date,
                percentage: percentage,
                amount: 0, // In this simplified physical advance, amount might not be directly calculated
                description: description
            });
        } catch (error) {
            console.error("Error saving advance:", error);
            throw error; // Re-throw to be caught by calling function
        }
    }

    async function loadAdvanceHistory(contractId) {
        if (!advanceHistoryBody) return;
        advanceHistoryBody.innerHTML = `<tr><td colspan="4" class="text-center">Cargando historial...</td></tr>`;
        try {
            const advances = await db.advances.where({ contractId: contractId }).toArray();
            if (advances.length === 0) {
                advanceHistoryBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay avances registrados para este contrato.</td></tr>';
                return;
            }
            advanceHistoryBody.innerHTML = ''; // Clear loading message

            advances.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date

            advances.forEach(advance => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${advance.date || ''}</td>
                    <td>${advance.percentage}%</td>
                    <td>${advance.description || ''}</td>
                    <td class="actions-cell">
                        <button class="btn btn-danger btn-sm delete-advance-btn" data-id="${advance.id}" title="Eliminar Avance"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                advanceHistoryBody.appendChild(row);
            });

            // Add event listeners for delete advance buttons
            advanceHistoryBody.querySelectorAll('.delete-advance-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const advanceId = parseInt(button.dataset.id);
                    if (confirm('¿Está seguro de eliminar este avance físico?')) {
                        try {
                            await db.advances.delete(advanceId);
                            showToast('Avance eliminado exitosamente.', 'success');
                            loadAdvanceHistory(contractId); // Reload history
                            loadContractList(); // Update main list advance percentage
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
            if (advanceHistoryBody) advanceHistoryBody.innerHTML = '<tr><td colspan="4" class="text-center">Error al cargar historial.</td></tr>';
        }
    }

    // Handle saving advance (already defined in DOMContentLoaded)
    const advanceForm = document.getElementById('advance-form');
    if (advanceForm) {
        advanceForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const contractId = parseInt(document.getElementById('advance-contract-select')?.value);
            const date = document.getElementById('advance-date')?.value;
            const percentage = parseFloat(document.getElementById('advance-percentage')?.value);
            const description = document.getElementById('advance-description')?.value;

            if (!contractId || isNaN(percentage) || !date) {
                showToast('Seleccione un contrato, fecha y un porcentaje válido.', 'warning');
                return;
            }
            if (percentage < 0 || percentage > 100) {
                showToast('El porcentaje de avance debe estar entre 0 y 100.', 'warning');
                return;
            }

            try {
                await saveAdvance(contractId, date, percentage, description);
                showToast('Avance guardado correctamente.', 'success');
                advanceForm.reset();
                loadAdvanceHistory(contractId);
                loadContractList(); // Update main list advance percentage
            } catch (error) {
                console.error("Error al guardar avance:", error);
                showToast('Error al guardar avance.', 'error');
            }
        });
    }


    // --- HES Management Section Functions (Placeholders) ---
    const hesContractSelect = document.getElementById('hes-contract-select');
    async function loadContractsForHES() {
        if (!hesContractSelect) return;
        hesContractSelect.innerHTML = '<option value="">Cargando contratos...</option>';
        try {
            const contracts = await db.contracts.toArray();
            hesContractSelect.innerHTML = '<option value="">Seleccione un Contrato</option>';
            contracts.forEach(c => {
                const option = document.createElement('option');
                option.value = c.id;
                option.textContent = `${c.numeroContrato || c.numeroContratoSICAC || c.id} - ${c.descripcionContrato}`;
                hesContractSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar contratos para HES:", error);
            showToast('Error al cargar contratos para HES.', 'error');
        }
    }

    async function loadHesList() {
        console.log('Cargando la lista de HES existentes... (Funcionalidad pendiente)');
        // Implementar lógica para mostrar una lista de HES
    }


    // --- Graphic Summary Section Functions (Placeholder) ---
    function renderChart() {
        console.log('Renderizando gráfico de resumen... (Funcionalidad pendiente)');
        const ctx = document.getElementById('contractsChart')?.getContext('2d');
        if (ctx) {
            // Placeholder for Chart.js initialization
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Contratos Activos', 'Contratos Vencidos', 'Monto Total'],
                    datasets: [{
                        label: 'Resumen General',
                        data: [
                            parseInt(document.getElementById('active-contracts-count')?.textContent || '0'),
                            0, // Placeholder for expired contracts
                            parseFloat(document.getElementById('total-contracted-amount')?.textContent.replace('USD ', '') || '0')
                        ],
                        backgroundColor: ['#007bff', '#dc3545', '#28a745']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }


    // --- Reports Section Functions (Placeholder) ---
    async function loadContractsForReports() {
        console.log('Cargando contratos para la sección de Reportes... (Funcionalidad pendiente)');
        // Similar a loadContractsForAdvance, pero para la sección de Reportes
        // Podrías tener un select similar para elegir el contrato a reportar.
    }


    // Botón de ayuda - redirección (ya definido arriba, pero lo mantengo aquí por claridad si se refactoriza)
    const helpButton = document.querySelector('.help-btn');
    if (helpButton) {
        helpButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('ayuda.html', '_blank'); // Abre en una nueva pestaña
        });
    }

    showToast("SIGESCON cargado correctamente", "success");

});