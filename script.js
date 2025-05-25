document.addEventListener('DOMContentLoaded', () => {
    // --- Variables Globales y Almacenamiento ---
    let contracts = JSON.parse(localStorage.getItem('contracts')) || [];
    let hesRecords = JSON.parse(localStorage.getItem('hesRecords')) || [];
    let contractModalities = JSON.parse(localStorage.getItem('contractModalities')) || ['Obra', 'Servicio', 'Suministro', 'Consultoría'];
    let deletedContracts = JSON.parse(localStorage.getItem('deletedContracts')) || [];
    let deletedHes = JSON.parse(localStorage.getItem('deletedHes')) || [];
    
    let editingContractId = null; // Para saber si estamos editando un contrato existente
    let editingHesId = null; // Para saber si estamos editando una HES existente
    let currentHesPartidaRowIndex = 0; // Para el manejo de filas de partidas en HES

    // Referencia al Chart.js instance
    let myChart = null;

    // --- Elementos del DOM Comunes ---
    const mainContent = document.querySelector('.content');
    const navLinks = document.querySelectorAll('.nav-link');
    const toastContainer = document.getElementById('toast-container');

    // --- Funciones de Utilidad ---

    // Generar un ID único simple (no es UUID, pero suficiente para este caso)
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Función para mostrar Toast (mensajes de notificación)
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.classList.add('toast', type);
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3500); // 3.5 segundos de duración
    }

    // Función para guardar datos en localStorage
    function saveData() {
        localStorage.setItem('contracts', JSON.stringify(contracts));
        localStorage.setItem('hesRecords', JSON.stringify(hesRecords));
        localStorage.setItem('contractModalities', JSON.stringify(contractModalities));
        localStorage.setItem('deletedContracts', JSON.stringify(deletedContracts));
        localStorage.setItem('deletedHes', JSON.stringify(deletedHes));
    }

    // Función para mostrar una sección del contenido y ocultar las demás
    function showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === sectionId) {
                link.classList.add('active');
            }
        });

        // Lógicas específicas de inicialización por sección
        if (sectionId === 'list-contracts') {
            renderContractsTable();
            document.getElementById('filter-sicac').value = '';
            document.getElementById('filter-contractor').value = '';
            document.getElementById('filter-status').value = '';
        } else if (sectionId === 'hes-management') {
            resetHesForm(); // Resetear formulario HES al entrar
            loadContractsForHesSelect();
            loadContractsForHesFilter();
            renderHesListTable();
            document.getElementById('hes-detail-view').style.display = 'none'; // Ocultar detalle si estaba visible
            document.getElementById('filter-hes-contract').value = '';
            document.getElementById('filter-hes-number').value = '';
        } else if (sectionId === 'graphic-summary') {
            loadContractsForChartSelect();
            // Destruir el gráfico anterior si existe
            if (myChart) {
                myChart.destroy();
                myChart = null;
            }
            document.getElementById('export-chart-image-btn').style.display = 'none'; // Ocultar botón de exportar imagen
        } else if (sectionId === 'new-edit-contract') {
            // Reiniciar el formulario de contrato si se navega a 'Nuevo Contrato' sin editar
            if (!editingContractId) {
                resetContractForm();
            }
        } else if (sectionId === 'dashboard') {
            updateDashboardSummaries();
            renderRecentContracts();
        } else if (sectionId === 'deleted-records') {
            renderDeletedContractsTable();
            renderDeletedHesTable();
        }
    }

    // --- Navegación del Sidebar ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = e.target.dataset.section;
            if (sectionId) {
                showSection(sectionId);
            }
        });
    });

    // --- Funciones para el Dashboard ---
    function updateDashboardSummaries() {
        const activeContracts = contracts.filter(c => c.estatusContrato === 'Activo').length;
        const completedContracts = contracts.filter(c => c.estatusContrato === 'Completado').length;
        const inProgressContracts = contracts.filter(c => c.estatusContrato === 'En Proceso').length;
        const expiredContracts = contracts.filter(c => c.estatusContrato === 'Vencido').length;

        document.getElementById('active-contracts-count').textContent = activeContracts;
        document.getElementById('completed-contracts-count').textContent = completedContracts;
        document.getElementById('in-progress-contracts-count').textContent = inProgressContracts;
        document.getElementById('expired-contracts-count').textContent = expiredContracts;

        let totalPhysicalProgress = 0;
        let totalFinancialProgress = 0;
        let validContractsForProgress = 0;

        contracts.forEach(contract => {
            const currentPhysical = calculateContractPhysicalProgress(contract);
            const currentFinancial = calculateContractFinancialProgress(contract);

            if (!isNaN(currentPhysical)) {
                totalPhysicalProgress += currentPhysical;
                validContractsForProgress++;
            }
            if (!isNaN(currentFinancial)) {
                totalFinancialProgress += currentFinancial;
            }
        });

        const overallPhysicalAvg = validContractsForProgress > 0 ? (totalPhysicalProgress / validContractsForProgress) : 0;
        const overallFinancialAvg = validContractsForProgress > 0 ? (totalFinancialProgress / validContractsForProgress) : 0;

        document.getElementById('overall-physical-progress').style.width = `${overallPhysicalAvg.toFixed(2)}%`;
        document.getElementById('overall-physical-progress').textContent = `${overallPhysicalAvg.toFixed(2)}% Físico`;
        document.getElementById('overall-financial-progress').style.width = `${overallFinancialAvg.toFixed(2)}%`;
        document.getElementById('overall-financial-progress').textContent = `${overallFinancialAvg.toFixed(2)}% Financiero`;
    }

    function renderRecentContracts() {
        const tableBody = document.querySelector('#recent-contracts-table tbody');
        tableBody.innerHTML = '';

        const sortedContracts = [...contracts].sort((a, b) => new Date(a.fechaFin) - new Date(b.fechaFin));
        const recentContracts = sortedContracts.slice(0, 5); // Mostrar los 5 más próximos a vencer o recién vencidos

        if (recentContracts.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">No hay contratos recientes o activos para mostrar.</td></tr>';
            return;
        }

        recentContracts.forEach(contract => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = contract.numeroSicac;
            row.insertCell().textContent = contract.objetoContrato.substring(0, 50) + (contract.objetoContrato.length > 50 ? '...' : '');
            row.insertCell().textContent = contract.contratista;
            row.insertCell().textContent = contract.fechaFin;
            row.insertCell().textContent = contract.estatusContrato;
            
            const physicalProgress = calculateContractPhysicalProgress(contract);
            const financialProgress = calculateContractFinancialProgress(contract);

            const physicalCell = row.insertCell();
            physicalCell.innerHTML = `<div class="progress" style="width: 100px;">
                                        <div class="progress-bar bg-light-blue" role="progressbar" style="width: ${physicalProgress.toFixed(2)}%;" 
                                            aria-valuenow="${physicalProgress.toFixed(2)}" aria-valuemin="0" aria-valuemax="100">${physicalProgress.toFixed(2)}%</div>
                                    </div>`;

            const financialCell = row.insertCell();
            financialCell.innerHTML = `<div class="progress" style="width: 100px;">
                                        <div class="progress-bar bg-dark-blue" role="progressbar" style="width: ${financialProgress.toFixed(2)}%;" 
                                            aria-valuenow="${financialProgress.toFixed(2)}" aria-valuemin="0" aria-valuemax="100">${financialProgress.toFixed(2)}%</div>
                                    </div>`;
        });
    }

    // --- Gestión de Modalidades de Contratación (CRUD) ---
    const modalityModal = document.getElementById('modalidad-modal'); // Renombrado a modalityModal
    const addModalityBtn = document.getElementById('add-modalidad-btn'); // Renombrado a addModalityBtn
    const removeModalityBtn = document.getElementById('remove-modalidad-btn'); // Renombrado a removeModalityBtn
    const closeModalityModalBtn = document.getElementById('close-modalidad-modal'); // Renombrado a closeModalityModalBtn
    const saveModalityBtn = document.getElementById('save-modalidad-btn'); // Renombrado a saveModalityBtn
    const newModalityNameInput = document.getElementById('new-modalidad-name'); // Renombrado a newModalityNameInput
    const modalityListUl = document.getElementById('modalidad-list'); // Renombrado a modalityListUl
    const contractModalitySelect = document.getElementById('modalidad-contratacion'); // Renombrado a contractModalitySelect

    // Cargar y renderizar modalidades en el select y la lista del modal
    function renderModalities() {
        contractModalitySelect.innerHTML = '';
        modalityListUl.innerHTML = '';

        contractModalities.forEach(modality => {
            const option = document.createElement('option');
            option.value = modality;
            option.textContent = modality;
            contractModalitySelect.appendChild(option);

            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
            listItem.textContent = modality;
            
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('btn', 'btn-sm', 'btn-danger');
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.title = 'Eliminar Modalidad';
            deleteButton.addEventListener('click', () => {
                if (confirm(`¿Estás seguro de que quieres eliminar la modalidad "${modality}"? Esta acción es irreversible y podría afectar contratos existentes.`)) {
                    removeModality(modality);
                }
            });
            listItem.appendChild(deleteButton);
            modalityListUl.appendChild(listItem);
        });
        saveData(); // Guardar cambios en localStorage
    }

    // Abrir modal de modalidad
    addModalityBtn.addEventListener('click', () => {
        renderModalities(); // Asegurarse de que la lista esté actualizada al abrir
        modalityModal.classList.add('show');
    });

    // Cerrar modal de modalidad
    closeModalityModalBtn.addEventListener('click', () => {
        modalityModal.classList.remove('show');
        newModalityNameInput.value = ''; // Limpiar campo
    });

    // Cerrar modal haciendo clic fuera
    modalityModal.addEventListener('click', (e) => {
        if (e.target === modalityModal) {
            modalityModal.classList.remove('show');
            newModalityNameInput.value = '';
        }
    });

    // Añadir nueva modalidad
    saveModalityBtn.addEventListener('click', () => {
        const newModality = newModalityNameInput.value.trim();
        if (newModality && !contractModalities.includes(newModality)) {
            contractModalities.push(newModality);
            renderModalities();
            showToast('Modalidad añadida correctamente.', 'success');
            newModalityNameInput.value = '';
        } else if (contractModalities.includes(newModality)) {
            showToast('Esa modalidad ya existe.', 'warning');
        } else {
            showToast('Por favor, ingresa un nombre para la modalidad.', 'error');
        }
    });

    // Eliminar modalidad (solo la del select, no la del modal)
    // Este botón permite eliminar la modalidad seleccionada en el form principal
    removeModalityBtn.addEventListener('click', () => {
        const selectedModality = contractModalitySelect.value;
        if (selectedModality) {
            if (confirm(`¿Estás seguro de que quieres eliminar la modalidad "${selectedModality}"? Esta acción es irreversible y podría afectar contratos existentes.`)) {
                removeModality(selectedModality);
            }
        } else {
            showToast('No hay modalidad seleccionada para eliminar.', 'warning');
        }
    });

    // Función interna para eliminar modalidad de la lista (usada por el modal y el botón '-')
    function removeModality(modalityToRemove) {
        // Verificar si la modalidad está en uso por algún contrato
        const isInUse = contracts.some(c => c.modalidadContratacion === modalityToRemove);
        if (isInUse) {
            showToast(`No se puede eliminar "${modalityToRemove}" porque está siendo utilizada por uno o más contratos.`, 'error');
            return;
        }

        contractModalities = contractModalities.filter(m => m !== modalityToRemove);
        renderModalities();
        showToast('Modalidad eliminada.', 'success');
    }

    // --- Gestión de Contratos ---
    const contractForm = document.getElementById('contract-form');
    const contractIdInput = document.getElementById('contract-id');
    const numeroSicacInput = document.getElementById('numero-sicac');
    const sicacError = document.getElementById('sicac-error');
    const sicacSuggestions = document.getElementById('sicac-suggestions');
    const numeroReferenciaInput = document.getElementById('numero-referencia');
    const objetoContratoInput = document.getElementById('objeto-contrato');
    const contratistaInput = document.getElementById('contratista');
    const fechaInicioInput = document.getElementById('fecha-inicio');
    const fechaFinInput = document.getElementById('fecha-fin');
    const duracionDiasInput = document.getElementById('duracion-dias');
    const montoOriginalInput = document.getElementById('monto-original');
    const estatusContratoSelect = document.getElementById('estatus-contrato');
    const observacionesContratoInput = document.getElementById('observaciones-contrato');
    const partidasTableBody = document.querySelector('#partidas-table tbody');
    const addPartidaBtn = document.getElementById('add-partida-btn');
    const contractFormTitle = document.getElementById('contract-form-title');
    const saveContractBtn = document.getElementById('save-contract-btn');
    const cancelContractBtn = document.getElementById('cancel-contract-btn');

    function calculateDuration() {
        const startDate = new Date(fechaInicioInput.value);
        const endDate = new Date(fechaFinInput.value);

        if (startDate && endDate && !isNaN(startDate) && !isNaN(endDate) && endDate > startDate) {
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            duracionDiasInput.value = diffDays;
        } else {
            duracionDiasInput.value = '';
        }
    }

    fechaInicioInput.addEventListener('change', calculateDuration);
    fechaFinInput.addEventListener('change', calculateDuration);

    function resetContractForm() {
        contractForm.reset();
        contractIdInput.value = '';
        editingContractId = null;
        partidasTableBody.innerHTML = '';
        contractFormTitle.textContent = 'Nuevo Contrato';
        saveContractBtn.textContent = 'Guardar Contrato';
        numeroSicacInput.disabled = false; // Habilitar SICAC para nuevos contratos
        sicacError.style.display = 'none';
        sicacSuggestions.innerHTML = '';
        sicacSuggestions.style.display = 'none';
        // Añadir una fila de partida vacía por defecto
        addPartidaRow(); 
    }

    // Funciones para Partidas del Contrato
    function addPartidaRow(partida = {}) {
        const newRow = partidasTableBody.insertRow();
        const partidaId = partida.id || generateUniqueId();
        newRow.dataset.partidaId = partidaId; // Almacenar ID de partida en la fila

        newRow.innerHTML = `
            <td><input type="text" class="form-control partida-descripcion" value="${partida.descripcion || ''}" required></td>
            <td><input type="text" class="form-control partida-unidad" value="${partida.unidad || ''}" required></td>
            <td><input type="number" class="form-control partida-cantidad" step="0.01" value="${partida.cantidad || ''}" min="0" required></td>
            <td><input type="number" class="form-control partida-precio-unitario" step="0.01" value="${partida.precioUnitario || ''}" min="0" required></td>
            <td><input type="number" class="form-control partida-monto" step="0.01" value="${partida.monto || ''}" readonly></td>
            <td><input type="number" class="form-control partida-avance-fisico" step="0.01" min="0" max="100" value="${partida.avanceFisico || 0}" required></td>
            <td>
                <button type="button" class="btn btn-danger btn-sm remove-partida-btn"><i class="fas fa-trash"></i></button>
            </td>
        `;

        const cantidadInput = newRow.querySelector('.partida-cantidad');
        const precioUnitarioInput = newRow.querySelector('.partida-precio-unitario');
        const montoInput = newRow.querySelector('.partida-monto');
        const removeBtn = newRow.querySelector('.remove-partida-btn');

        const calculateMonto = () => {
            const cantidad = parseFloat(cantidadInput.value) || 0;
            const precioUnitario = parseFloat(precioUnitarioInput.value) || 0;
            montoInput.value = (cantidad * precioUnitario).toFixed(2);
        };

        cantidadInput.addEventListener('input', calculateMonto);
        precioUnitarioInput.addEventListener('input', calculateMonto);
        
        removeBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres eliminar esta partida?')) {
                newRow.remove();
                showToast('Partida eliminada.', 'info');
            }
        });

        calculateMonto(); // Calcular monto inicial si se carga una partida existente
    }

    addPartidaBtn.addEventListener('click', () => addPartidaRow());

    // Validación de SICAC y Sugerencias
    numeroSicacInput.addEventListener('input', () => {
        const value = numeroSicacInput.value.trim();
        sicacError.style.display = 'none';
        sicacSuggestions.innerHTML = '';
        sicacSuggestions.style.display = 'none';

        if (value.length > 0 && !editingContractId) { // Solo si no estamos editando
            const existingContracts = contracts.filter(c => 
                c.numeroSicac.toLowerCase().includes(value.toLowerCase())
            );

            if (existingContracts.length > 0) {
                sicacSuggestions.style.display = 'block';
                existingContracts.forEach(contract => {
                    const suggestionItem = document.createElement('a');
                    suggestionItem.href = "#";
                    suggestionItem.classList.add('list-group-item', 'list-group-item-action');
                    suggestionItem.textContent = `${contract.numeroSicac} - ${contract.objetoContrato.substring(0, 70)}...`;
                    suggestionItem.addEventListener('click', (e) => {
                        e.preventDefault();
                        editContract(contract.id); // Cargar contrato para edición
                        sicacSuggestions.style.display = 'none';
                        showToast(`Cargado contrato ${contract.numeroSicac} para edición.`, 'info');
                    });
                    sicacSuggestions.appendChild(suggestionItem);
                });
            }
        }
    });

    numeroSicacInput.addEventListener('blur', () => {
        // Pequeño retardo para permitir click en sugerencia antes de ocultar
        setTimeout(() => {
            if (!editingContractId) { // Solo si no estamos editando un contrato ya cargado
                const value = numeroSicacInput.value.trim();
                const contractExists = contracts.some(c => c.numeroSicac === value);
                if (contractExists) {
                    sicacError.style.display = 'block';
                    // Mantener el campo editable para que el usuario pueda corregir o seleccionar
                } else {
                    sicacError.style.display = 'none';
                }
            }
            sicacSuggestions.style.display = 'none';
        }, 100);
    });

    // Guardar Contrato
    contractForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const numeroSicac = numeroSicacInput.value.trim();
        const numeroReferencia = numeroReferenciaInput.value.trim();
        const objetoContrato = objetoContratoInput.value.trim();
        const contratista = contratistaInput.value.trim();
        const fechaInicio = fechaInicioInput.value;
        const fechaFin = fechaFinInput.value;
        const duracionDias = parseInt(duracionDiasInput.value);
        const montoOriginal = parseFloat(montoOriginalInput.value);
        const modalidadContratacion = contractModalitySelect.value;
        const estatusContrato = estatusContratoSelect.value;
        const observacionesContrato = observacionesContratoInput.value.trim();

        // Validaciones básicas
        if (!numeroSicac || !objetoContrato || !contratista || !fechaInicio || !fechaFin || isNaN(montoOriginal) || montoOriginal <= 0) {
            showToast('Por favor, completa todos los campos requeridos y asegúrate de que el monto sea válido.', 'error');
            return;
        }
        if (new Date(fechaFin) < new Date(fechaInicio)) {
            showToast('La fecha de fin no puede ser anterior a la fecha de inicio.', 'error');
            return;
        }

        // Validar si el número de SICAC ya existe para un NUEVO contrato
        const sicacExists = contracts.some(c => c.numeroSicac === numeroSicac && c.id !== editingContractId);
        if (sicacExists) {
            showToast('Ya existe un contrato con ese Número SICAC. Por favor, usa uno diferente o edita el contrato existente.', 'error');
            return;
        }

        const partidas = [];
        let totalPartidasMonto = 0;
        let hasInvalidPartida = false;

        partidasTableBody.querySelectorAll('tr').forEach(row => {
            const descripcion = row.querySelector('.partida-descripcion').value.trim();
            const unidad = row.querySelector('.partida-unidad').value.trim();
            const cantidad = parseFloat(row.querySelector('.partida-cantidad').value);
            const precioUnitario = parseFloat(row.querySelector('.partida-precio-unitario').value);
            const monto = parseFloat(row.querySelector('.partida-monto').value);
            const avanceFisico = parseFloat(row.querySelector('.partida-avance-fisico').value);

            if (!descripcion || !unidad || isNaN(cantidad) || cantidad <= 0 || isNaN(precioUnitario) || precioUnitario <= 0 || isNaN(avanceFisico) || avanceFisico < 0 || avanceFisico > 100) {
                hasInvalidPartida = true;
                showToast('Todas las partidas deben tener descripción, unidad, cantidad, precio unitario y avance físico válidos.', 'error');
                return;
            }
            partidas.push({
                id: row.dataset.partidaId, // Mantener el ID si existe, sino se generó uno nuevo
                descripcion,
                unidad,
                cantidad,
                precioUnitario,
                monto,
                avanceFisico
            });
            totalPartidasMonto += monto;
        });

        if (hasInvalidPartida) return;
        if (partidas.length === 0) {
            showToast('El contrato debe tener al menos una partida.', 'error');
            return;
        }
        // Validar que el monto original sea igual a la suma de las partidas
        if (Math.abs(montoOriginal - totalPartidasMonto) > 0.01) { // Usar una pequeña tolerancia para flotantes
            showToast(`El monto original del contrato (${montoOriginal.toFixed(2)}) no coincide con la suma de los montos de las partidas (${totalPartidasMonto.toFixed(2)}).`, 'error');
            return;
        }


        if (editingContractId) {
            // Editar contrato existente
            const contractIndex = contracts.findIndex(c => c.id === editingContractId);
            if (contractIndex !== -1) {
                contracts[contractIndex] = {
                    id: editingContractId,
                    numeroSicac,
                    numeroReferencia,
                    objetoContrato,
                    contratista,
                    fechaInicio,
                    fechaFin,
                    duracionDias,
                    montoOriginal,
                    modalidadContratacion,
                    estatusContrato,
                    observacionesContrato,
                    partidas
                };
                showToast('Contrato actualizado correctamente.', 'success');
            }
        } else {
            // Nuevo contrato
            const newContract = {
                id: generateUniqueId(),
                numeroSicac,
                numeroReferencia,
                objetoContrato,
                contratista,
                fechaInicio,
                fechaFin,
                duracionDias,
                montoOriginal,
                modalidadContratacion,
                estatusContrato,
                observacionesContrato,
                partidas
            };
            contracts.push(newContract);
            showToast('Contrato guardado correctamente.', 'success');
        }

        saveData();
        resetContractForm();
        showSection('list-contracts'); // Volver al listado después de guardar
    });

    cancelContractBtn.addEventListener('click', () => {
        resetContractForm();
        showSection('list-contracts');
    });

    // Cargar un contrato para edición
    function editContract(id) {
        const contract = contracts.find(c => c.id === id);
        if (contract) {
            editingContractId = id;
            contractFormTitle.textContent = 'Editar Contrato';
            saveContractBtn.textContent = 'Actualizar Contrato';

            contractIdInput.value = contract.id;
            numeroSicacInput.value = contract.numeroSicac;
            numeroReferenciaInput.value = contract.numeroReferencia;
            objetoContratoInput.value = contract.objetoContrato;
            contratistaInput.value = contract.contratista;
            fechaInicioInput.value = contract.fechaInicio;
            fechaFinInput.value = contract.fechaFin;
            duracionDiasInput.value = contract.duracionDias;
            montoOriginalInput.value = contract.montoOriginal;
            contractModalitySelect.value = contract.modalidadContratacion;
            estatusContratoSelect.value = contract.estatusContrato;
            observacionesContratoInput.value = contract.observacionesContrato;
            
            // Deshabilitar SICAC al editar
            numeroSicacInput.disabled = true;

            // Cargar partidas
            partidasTableBody.innerHTML = '';
            contract.partidas.forEach(partida => addPartidaRow(partida));

            showSection('new-edit-contract');
        } else {
            showToast('Contrato no encontrado.', 'error');
        }
    }

    // Eliminar Contrato (mover a registros eliminados)
    function deleteContract(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este contrato? Se moverá a registros eliminados.')) {
            const contractIndex = contracts.findIndex(c => c.id === id);
            if (contractIndex !== -1) {
                const [deletedContract] = contracts.splice(contractIndex, 1);
                deletedContract.fechaEliminacion = new Date().toISOString().split('T')[0];
                deletedContracts.push(deletedContract);
                saveData();
                renderContractsTable();
                showToast('Contrato eliminado (movido a papelera).', 'success');
                // También eliminar HES asociadas a este contrato de hesRecords (pero no de deletedHes)
                hesRecords = hesRecords.filter(hes => hes.contractId !== id);
                saveData();
            } else {
                showToast('Contrato no encontrado para eliminar.', 'error');
            }
        }
    }

    // Calcular avance físico total de un contrato
    function calculateContractPhysicalProgress(contract) {
        if (!contract || !contract.partidas || contract.partidas.length === 0) {
            return 0;
        }
        let totalWeightedPhysical = 0;
        let totalMonto = 0;
        contract.partidas.forEach(partida => {
            totalWeightedPhysical += (partida.monto || 0) * (partida.avanceFisico || 0);
            totalMonto += (partida.monto || 0);
        });
        return totalMonto > 0 ? (totalWeightedPhysical / totalMonto) : 0;
    }

    // Calcular avance financiero total de un contrato
    function calculateContractFinancialProgress(contract) {
        if (!contract || !contract.id || contract.montoOriginal === 0) {
            return 0;
        }
        const totalHesAmount = hesRecords
            .filter(hes => hes.contractId === contract.id)
            .reduce((sum, hes) => sum + (hes.montoHes || 0), 0);
        
        return (totalHesAmount / contract.montoOriginal) * 100;
    }


    // Renderizar la tabla de contratos
    const contractsTableBody = document.querySelector('#contracts-table tbody');
    const filterSicacInput = document.getElementById('filter-sicac');
    const filterContractorInput = document.getElementById('filter-contractor');
    const filterStatusSelect = document.getElementById('filter-status');
    const applyFilterBtn = document.getElementById('apply-filter-btn');
    const clearFilterBtn = document.getElementById('clear-filter-btn');

    function renderContractsTable() {
        contractsTableBody.innerHTML = '';
        let filteredContracts = contracts;

        const sicacFilter = filterSicacInput.value.toLowerCase();
        const contractorFilter = filterContractorInput.value.toLowerCase();
        const statusFilter = filterStatusSelect.value;

        filteredContracts = contracts.filter(contract => {
            const matchesSicac = sicacFilter === '' || contract.numeroSicac.toLowerCase().includes(sicacFilter);
            const matchesContratista = contractorFilter === '' || contract.contratista.toLowerCase().includes(contractorFilter);
            const matchesStatus = statusFilter === '' || contract.estatusContrato === statusFilter;
            return matchesSicac && matchesContratista && matchesStatus;
        });

        if (filteredContracts.length === 0) {
            contractsTableBody.innerHTML = '<tr><td colspan="13">No hay contratos para mostrar con los filtros aplicados.</td></tr>';
            return;
        }

        filteredContracts.forEach(contract => {
            const row = contractsTableBody.insertRow();
            row.insertCell().textContent = contract.numeroSicac;
            row.insertCell().textContent = contract.numeroReferencia;
            row.insertCell().textContent = contract.objetoContrato.substring(0, 70) + (contract.objetoContrato.length > 70 ? '...' : '');
            row.insertCell().textContent = contract.contratista;
            row.insertCell().textContent = contract.fechaInicio;
            row.insertCell().textContent = contract.fechaFin;
            row.insertCell().textContent = contract.duracionDias;
            row.insertCell().textContent = contract.montoOriginal.toLocaleString('es-VE', { style: 'currency', currency: 'VES' });
            row.insertCell().textContent = contract.modalidadContratacion;
            row.insertCell().textContent = contract.estatusContrato;
            
            const physicalProgress = calculateContractPhysicalProgress(contract);
            row.insertCell().textContent = `${physicalProgress.toFixed(2)}%`;

            const financialProgress = calculateContractFinancialProgress(contract);
            row.insertCell().textContent = `${financialProgress.toFixed(2)}%`;

            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `
                <button class="btn btn-primary btn-sm edit-contract-btn" data-id="${contract.id}" title="Editar Contrato"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm delete-contract-btn" data-id="${contract.id}" title="Eliminar Contrato"><i class="fas fa-trash"></i></button>
            `;
        });

        // Add event listeners for edit and delete buttons
        contractsTableBody.querySelectorAll('.edit-contract-btn').forEach(button => {
            button.addEventListener('click', (e) => editContract(e.currentTarget.dataset.id));
        });
        contractsTableBody.querySelectorAll('.delete-contract-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteContract(e.currentTarget.dataset.id));
        });
    }

    applyFilterBtn.addEventListener('click', renderContractsTable);
    clearFilterBtn.addEventListener('click', () => {
        filterSicacInput.value = '';
        filterContractorInput.value = '';
        filterStatusSelect.value = '';
        renderContractsTable();
    });


    // --- Gestión de HES (Hoja de Estimación de Servicios) ---
    const hesForm = document.getElementById('hes-form');
    const hesIdInput = document.getElementById('hes-id');
    const hesContractSelect = document.getElementById('hes-contract-select');
    const hesNumberInput = document.getElementById('hes-number');
    const hesNumberError = document.getElementById('hes-number-error');
    const hesDateInput = document.getElementById('hes-date');
    const hesMontoInput = document.getElementById('hes-monto'); // Este es el monto total de la HES
    const hesObservationsInput = document.getElementById('hes-observations');
    const hesPartidasTableBody = document.querySelector('#hes-partidas-table tbody');
    const addHesPartidaBtn = document.getElementById('add-hes-partida-btn');
    const saveHesBtn = document.getElementById('save-hes-btn');
    const cancelHesBtn = document.getElementById('cancel-hes-btn');
    const closeHesDetailBtn = document.getElementById('close-hes-detail-btn');

    // Cargar contratos activos en el select de HES
    function loadContractsForHesSelect() {
        hesContractSelect.innerHTML = '<option value="">-- Seleccione un Contrato --</option>';
        const activeContracts = contracts.filter(c => c.estatusContrato === 'Activo' || c.estatusContrato === 'En Proceso');
        activeContracts.forEach(contract => {
            const option = document.createElement('option');
            option.value = contract.id;
            option.textContent = `${contract.numeroSicac} - ${contract.objetoContrato.substring(0, 50)}...`;
            hesContractSelect.appendChild(option);
        });
    }

    // Cargar contratos para el filtro de HES
    const filterHesContractSelect = document.getElementById('filter-hes-contract');
    function loadContractsForHesFilter() {
        filterHesContractSelect.innerHTML = '<option value="">Todos los Contratos</option>';
        contracts.forEach(contract => {
            const option = document.createElement('option');
            option.value = contract.id;
            option.textContent = `${contract.numeroSicac} - ${contract.objetoContrato.substring(0, 50)}...`;
            filterHesContractSelect.appendChild(option);
        });
    }

    // Lógica para añadir partidas a la HES
    function addHesPartidaRow(hesPartida = {}) {
        const contractId = hesContractSelect.value;
        const contract = contracts.find(c => c.id === contractId);

        if (!contract) {
            showToast('Por favor, selecciona un contrato antes de añadir partidas HES.', 'warning');
            return;
        }

        const newRow = hesPartidasTableBody.insertRow();
        const hesPartidaId = hesPartida.id || generateUniqueId();
        newRow.dataset.hesPartidaId = hesPartidaId;

        // Crear el select para las partidas del contrato
        const partidaSelect = document.createElement('select');
        partidaSelect.classList.add('form-select', 'hes-partida-contract-id');
        partidaSelect.required = true;
        
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "-- Selecciona una Partida --";
        partidaSelect.appendChild(defaultOption);

        contract.partidas.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = `${p.descripcion.substring(0, 50)}... (Cant: ${p.cantidad} / PU: ${p.precioUnitario})`;
            partidaSelect.appendChild(option);
        });

        // Si se está editando una HES, seleccionar la partida correcta
        if (hesPartida.contractPartidaId) {
            partidaSelect.value = hesPartida.contractPartidaId;
        }

        const selectCell = newRow.insertCell();
        selectCell.appendChild(partidaSelect);

        const unidadCell = newRow.insertCell();
        unidadCell.textContent = hesPartida.unidad || '';

        const cantContratoCell = newRow.insertCell();
        cantContratoCell.textContent = hesPartida.cantidadContrato || '';

        const puContratoCell = newRow.insertCell();
        puContratoCell.textContent = hesPartida.precioUnitarioContrato || '';

        const montoContratoCell = newRow.insertCell();
        montoContratoCell.textContent = hesPartida.montoContrato || '';
        
        newRow.insertCell().innerHTML = `<input type="number" class="form-control hes-partida-cantidad" step="0.01" value="${hesPartida.cantidad || ''}" min="0" required>`;
        newRow.insertCell().innerHTML = `<input type="number" class="form-control hes-partida-precio-unitario" step="0.01" value="${hesPartida.precioUnitario || ''}" min="0" required>`;
        newRow.insertCell().innerHTML = `<input type="number" class="form-control hes-partida-monto" step="0.01" value="${hesPartida.monto || ''}" readonly>`;
        newRow.insertCell().innerHTML = `<input type="number" class="form-control hes-partida-avance-fisico" step="0.01" min="0" max="100" value="${hesPartida.avanceFisico || 0}" readonly>`;
        newRow.insertCell().innerHTML = `<button type="button" class="btn btn-danger btn-sm remove-hes-partida-btn"><i class="fas fa-trash"></i></button>`;

        const hesCantidadInput = newRow.querySelector('.hes-partida-cantidad');
        const hesPrecioUnitarioInput = newRow.querySelector('.hes-partida-precio-unitario');
        const hesMontoInput = newRow.querySelector('.hes-partida-monto');
        const hesAvanceFisicoInput = newRow.querySelector('.hes-partida-avance-fisico');
        const removeBtn = newRow.querySelector('.remove-hes-partida-btn');

        const updateHesPartidaFields = () => {
            const selectedPartidaId = partidaSelect.value;
            const selectedPartida = contract.partidas.find(p => p.id === selectedPartidaId);

            if (selectedPartida) {
                unidadCell.textContent = selectedPartida.unidad;
                cantContratoCell.textContent = selectedPartida.cantidad;
                puContratoCell.textContent = selectedPartida.precioUnitario;
                montoContratoCell.textContent = selectedPartida.monto.toFixed(2); // Mostrar con 2 decimales

                // Por defecto, se llena la cantidad de la partida de la HES con la cantidad restante
                const currentHesPartidas = Array.from(hesPartidasTableBody.querySelectorAll('tr')).map(row => {
                    const id = row.dataset.hesPartidaId;
                    const contractPartidaId = row.querySelector('.hes-partida-contract-id').value;
                    const cantidad = parseFloat(row.querySelector('.hes-partida-cantidad').value) || 0;
                    return { id, contractPartidaId, cantidad };
                });

                const totalClaimedForPartida = hesRecords.filter(hes => hes.contractId === contractId)
                    .flatMap(hes => hes.partidasHes)
                    .filter(p => p.contractPartidaId === selectedPartidaId && p.id !== hesPartidaId) // Excluir la partida actual si estamos editando
                    .reduce((sum, p) => sum + (p.cantidad || 0), 0);

                const totalClaimedForPartidaInCurrentHes = currentHesPartidas
                    .filter(p => p.contractPartidaId === selectedPartidaId && p.id !== hesPartidaId)
                    .reduce((sum, p) => sum + (p.cantidad || 0), 0);

                const remainingQuantity = selectedPartida.cantidad - (totalClaimedForPartida + totalClaimedForPartidaInCurrentHes);
                
                // Si es una partida nueva o la cantidad en HES es 0, precargar con la restante
                if (!hesPartida.cantidad || hesPartida.cantidad === 0) {
                    hesCantidadInput.value = remainingQuantity > 0 ? remainingQuantity : 0;
                }

                // El precio unitario de la HES es el del contrato, a menos que se especifique diferente
                hesPrecioUnitarioInput.value = hesPartida.precioUnitario || selectedPartida.precioUnitario;
                hesAvanceFisicoInput.value = hesPartida.avanceFisico || 0;
            } else {
                unidadCell.textContent = '';
                cantContratoCell.textContent = '';
                puContratoCell.textContent = '';
                montoContratoCell.textContent = '';
                hesCantidadInput.value = '';
                hesPrecioUnitarioInput.value = '';
                hesAvanceFisicoInput.value = '';
            }
            calculateHesPartidaMontoAndAvance();
            calculateHesTotalMonto();
        };

        const calculateHesPartidaMontoAndAvance = () => {
            const cantidadHes = parseFloat(hesCantidadInput.value) || 0;
            const precioUnitarioHes = parseFloat(hesPrecioUnitarioInput.value) || 0;
            const montoHes = cantidadHes * precioUnitarioHes;
            hesMontoInput.value = montoHes.toFixed(2);

            const selectedPartidaId = partidaSelect.value;
            const selectedPartida = contract.partidas.find(p => p.id === selectedPartidaId);

            if (selectedPartida && selectedPartida.cantidad > 0) {
                // Cantidad total ya reclamada en HESs anteriores para esta partida
                const totalClaimedInPastHes = hesRecords.filter(hes => hes.contractId === contractId)
                    .flatMap(hes => hes.partidasHes)
                    .filter(p => p.contractPartidaId === selectedPartidaId && p.id !== hesPartidaId) // Excluir la partida actual si estamos editando
                    .reduce((sum, p) => sum + (p.cantidad || 0), 0);
                
                // Cantidad de esta misma partida en otras filas de la HES actual
                const totalClaimedInCurrentHesOtherRows = Array.from(hesPartidasTableBody.querySelectorAll('tr'))
                    .filter(row => row.dataset.hesPartidaId !== hesPartidaId)
                    .map(row => ({
                        contractPartidaId: row.querySelector('.hes-partida-contract-id').value,
                        cantidad: parseFloat(row.querySelector('.hes-partida-cantidad').value) || 0
                    }))
                    .filter(p => p.contractPartidaId === selectedPartidaId)
                    .reduce((sum, p) => sum + p.cantidad, 0);

                const totalQuantityClaimedSoFar = totalClaimedInPastHes + totalClaimedInCurrentHesOtherRows + cantidadHes;
                
                let avanceFisico = (totalQuantityClaimedSoFar / selectedPartida.cantidad) * 100;
                if (avanceFisico > 100) avanceFisico = 100; // Limitar al 100%
                hesAvanceFisicoInput.value = avanceFisico.toFixed(2);
            } else {
                hesAvanceFisicoInput.value = '0.00';
            }
            calculateHesTotalMonto();
        };

        partidaSelect.addEventListener('change', updateHesPartidaFields);
        hesCantidadInput.addEventListener('input', calculateHesPartidaMontoAndAvance);
        hesPrecioUnitarioInput.addEventListener('input', calculateHesPartidaMontoAndAvance);
        
        removeBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres eliminar esta partida HES?')) {
                newRow.remove();
                calculateHesTotalMonto();
                showToast('Partida HES eliminada.', 'info');
            }
        });

        // Si es una nueva fila, o una fila existente, actualizar los campos inicialmente
        updateHesPartidaFields(); 
    }

    addHesPartidaBtn.addEventListener('click', () => addHesPartidaRow());

    // Calcular el monto total de la HES
    function calculateHesTotalMonto() {
        let total = 0;
        hesPartidasTableBody.querySelectorAll('.hes-partida-monto').forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        hesMontoInput.value = total.toFixed(2);
    }
    
    // Resetear formulario HES
    function resetHesForm() {
        hesForm.reset();
        hesIdInput.value = '';
        editingHesId = null;
        hesPartidasTableBody.innerHTML = '';
        hesNumberInput.disabled = false;
        hesContractSelect.disabled = false;
        hesNumberError.style.display = 'none';
        hesMontoInput.value = '0.00';
        currentHesPartidaRowIndex = 0; // Reiniciar el índice para partidas HES
    }

    // Guardar HES
    hesForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const contractId = hesContractSelect.value;
        const hesNumber = hesNumberInput.value.trim();
        const hesDate = hesDateInput.value;
        const hesMonto = parseFloat(hesMontoInput.value);
        const hesObservations = hesObservationsInput.value.trim();

        if (!contractId || !hesNumber || !hesDate || isNaN(hesMonto) || hesMonto <= 0) {
            showToast('Por favor, completa todos los campos requeridos de la HES y asegúrate que el monto sea válido.', 'error');
            return;
        }

        const contract = contracts.find(c => c.id === contractId);
        if (!contract) {
            showToast('Contrato seleccionado no encontrado.', 'error');
            return;
        }

        // Validar que el número de HES sea único para el contrato seleccionado
        const hesExists = hesRecords.some(hes => hes.contractId === contractId && hes.hesNumber === hesNumber && hes.id !== editingHesId);
        if (hesExists) {
            hesNumberError.style.display = 'block';
            showToast('Ya existe una HES con este número para el contrato seleccionado.', 'error');
            return;
        } else {
            hesNumberError.style.display = 'none';
        }

        const partidasHes = [];
        let hasInvalidHesPartida = false;
        hesPartidasTableBody.querySelectorAll('tr').forEach(row => {
            const contractPartidaId = row.querySelector('.hes-partida-contract-id').value;
            const cantidad = parseFloat(row.querySelector('.hes-partida-cantidad').value);
            const precioUnitario = parseFloat(row.querySelector('.hes-partida-precio-unitario').value);
            const monto = parseFloat(row.querySelector('.hes-partida-monto').value);
            const avanceFisico = parseFloat(row.querySelector('.hes-partida-avance-fisico').value);

            const originalPartida = contract.partidas.find(p => p.id === contractPartidaId);

            if (!contractPartidaId || isNaN(cantidad) || cantidad <= 0 || isNaN(precioUnitario) || precioUnitario <= 0) {
                hasInvalidHesPartida = true;
                showToast('Todas las partidas HES deben tener una partida de contrato seleccionada, cantidad y precio unitario válidos.', 'error');
                return;
            }

            // Validar que la cantidad HES no exceda la cantidad restante de la partida del contrato
            const currentPartidaHesId = row.dataset.hesPartidaId;
            const totalClaimedForPartida = hesRecords.filter(hes => hes.contractId === contractId)
                .flatMap(hes => hes.partidasHes)
                .filter(p => p.contractPartidaId === contractPartidaId && p.id !== currentPartidaHesId) // Excluir la partida actual si estamos editando
                .reduce((sum, p) => sum + (p.cantidad || 0), 0);

            const totalClaimedInCurrentHesOtherRows = Array.from(hesPartidasTableBody.querySelectorAll('tr'))
                .filter(otherRow => otherRow.dataset.hesPartidaId !== currentPartidaHesId)
                .map(otherRow => ({
                    contractPartidaId: otherRow.querySelector('.hes-partida-contract-id').value,
                    cantidad: parseFloat(otherRow.querySelector('.hes-partida-cantidad').value) || 0
                }))
                .filter(p => p.contractPartidaId === contractPartidaId)
                .reduce((sum, p) => sum + p.cantidad, 0);

            if (originalPartida && (totalClaimedForPartida + totalClaimedInCurrentHesOtherRows + cantidad) > originalPartida.cantidad) {
                hasInvalidHesPartida = true;
                showToast(`La cantidad total de la partida "${originalPartida.descripcion.substring(0, 30)}..." excede la cantidad original del contrato.`, 'error');
                return;
            }

            partidasHes.push({
                id: currentPartidaHesId, // El ID de la partida HES
                contractPartidaId, // ID de la partida del contrato a la que se refiere
                unidad: originalPartida.unidad, // Tomar la unidad del contrato
                cantidadContrato: originalPartida.cantidad, // Cantidad original del contrato
                precioUnitarioContrato: originalPartida.precioUnitario, // Precio unitario original del contrato
                montoContrato: originalPartida.monto, // Monto original del contrato
                cantidad,
                precioUnitario,
                monto,
                avanceFisico // Este ya se calculó automáticamente
            });
        });

        if (hasInvalidHesPartida) return;
        if (partidasHes.length === 0) {
            showToast('La HES debe tener al menos una partida.', 'error');
            return;
        }
        
        // Verificar que el monto total de la HES coincida con la suma de las partidas HES
        const calculatedHesTotal = partidasHes.reduce((sum, p) => sum + p.monto, 0);
        if (Math.abs(hesMonto - calculatedHesTotal) > 0.01) {
            showToast(`El monto total de la HES (${hesMonto.toFixed(2)}) no coincide con la suma de las partidas HES (${calculatedHesTotal.toFixed(2)}).`, 'error');
            return;
        }

        if (editingHesId) {
            const hesIndex = hesRecords.findIndex(hes => hes.id === editingHesId);
            if (hesIndex !== -1) {
                hesRecords[hesIndex] = {
                    id: editingHesId,
                    contractId,
                    hesNumber,
                    hesDate,
                    montoHes: hesMonto,
                    hesObservations,
                    partidasHes
                };
                showToast('HES actualizada correctamente.', 'success');
            }
        } else {
            const newHes = {
                id: generateUniqueId(),
                contractId,
                hesNumber,
                hesDate,
                montoHes: hesMonto,
                hesObservations,
                partidasHes
            };
            hesRecords.push(newHes);
            showToast('HES guardada correctamente.', 'success');
        }

        saveData();
        resetHesForm();
        renderHesListTable();
    });

    // Función para calcular el avance físico y financiero de una HES
    function calculateHesProgress(hes) {
        const contract = contracts.find(c => c.id === hes.contractId);
        if (!contract || hes.partidasHes.length === 0) {
            return { physical: 0, financial: 0 };
        }

        let totalContractMonto = contract.montoOriginal;
        let totalHesMonto = hes.montoHes;

        // Calcular avance físico basado en las partidas de la HES sobre las partidas del contrato
        let weightedPhysicalProgress = 0;
        hes.partidasHes.forEach(hesPartida => {
            const contractPartida = contract.partidas.find(p => p.id === hesPartida.contractPartidaId);
            if (contractPartida && contractPartida.cantidad > 0) {
                const avanceFisicoHES = (hesPartida.cantidad / contractPartida.cantidad) * 100;
                weightedPhysicalProgress += (hesPartida.monto || 0) * avanceFisicoHES;
            }
        });
        const hesPhysicalProgress = totalHesMonto > 0 ? (weightedPhysicalProgress / totalHesMonto) : 0;

        // Calcular avance financiero de esta HES sobre el total del contrato
        const hesFinancialProgress = (totalHesMonto / totalContractMonto) * 100;

        return { physical: hesPhysicalProgress, financial: hesFinancialProgress };
    }

    // Renderizar la tabla de HES
    const hesListTableBody = document.querySelector('#hes-list-table tbody');
    const filterHesNumberInput = document.getElementById('filter-hes-number');
    const applyHesFilterBtn = document.getElementById('apply-hes-filter-btn');
    const clearHesFilterBtn = document.getElementById('clear-hes-filter-btn');


    function renderHesListTable() {
        hesListTableBody.innerHTML = '';
        document.getElementById('hes-detail-view').style.display = 'none';

        let filteredHes = hesRecords;

        const contractFilterId = filterHesContractSelect.value;
        const hesNumberFilter = filterHesNumberInput.value.toLowerCase();

        filteredHes = hesRecords.filter(hes => {
            const matchesContract = contractFilterId === '' || hes.contractId === contractFilterId;
            const matchesHesNumber = hesNumberFilter === '' || hes.hesNumber.toLowerCase().includes(hesNumberFilter);
            return matchesContract && matchesHesNumber;
        });


        if (filteredHes.length === 0) {
            hesListTableBody.innerHTML = '<tr><td colspan="7">No hay HES registradas con los filtros aplicados.</td></tr>';
            return;
        }

        filteredHes.forEach(hes => {
            const row = hesListTableBody.insertRow();
            const contract = contracts.find(c => c.id === hes.contractId);
            const contractSicac = contract ? contract.numeroSicac : 'Contrato Eliminado';

            const progress = calculateHesProgress(hes);

            row.insertCell().textContent = contractSicac;
            row.insertCell().textContent = hes.hesNumber;
            row.insertCell().textContent = hes.hesDate;
            row.insertCell().textContent = hes.montoHes.toLocaleString('es-VE', { style: 'currency', currency: 'VES' });
            row.insertCell().textContent = `${progress.physical.toFixed(2)}%`;
            row.insertCell().textContent = `${progress.financial.toFixed(2)}%`;

            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `
                <button class="btn btn-info btn-sm view-hes-btn" data-id="${hes.id}" title="Ver Detalle HES"><i class="fas fa-eye"></i></button>
                <button class="btn btn-primary btn-sm edit-hes-btn" data-id="${hes.id}" title="Editar HES"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm delete-hes-btn" data-id="${hes.id}" title="Eliminar HES"><i class="fas fa-trash"></i></button>
            `;
        });

        hesListTableBody.querySelectorAll('.view-hes-btn').forEach(button => {
            button.addEventListener('click', (e) => viewHesDetail(e.currentTarget.dataset.id));
        });
        hesListTableBody.querySelectorAll('.edit-hes-btn').forEach(button => {
            button.addEventListener('click', (e) => editHes(e.currentTarget.dataset.id));
        });
        hesListTableBody.querySelectorAll('.delete-hes-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteHes(e.currentTarget.dataset.id));
        });
    }

    applyHesFilterBtn.addEventListener('click', renderHesListTable);
    clearHesFilterBtn.addEventListener('click', () => {
        filterHesContractSelect.value = '';
        filterHesNumberInput.value = '';
        renderHesListTable();
    });

    // Editar HES
    function editHes(id) {
        const hes = hesRecords.find(h => h.id === id);
        if (hes) {
            editingHesId = id;
            
            // Cargar datos principales
            hesIdInput.value = hes.id;
            hesNumberInput.value = hes.hesNumber;
            hesDateInput.value = hes.hesDate;
            hesObservationsInput.value = hes.hesObservations;
            hesMontoInput.value = hes.montoHes.toFixed(2); // Asegurar que el monto se muestre

            // Deshabilitar el select de contrato y el número HES para edición
            hesContractSelect.value = hes.contractId;
            hesContractSelect.disabled = true;
            hesNumberInput.disabled = true;

            // Cargar partidas de HES
            hesPartidasTableBody.innerHTML = '';
            hes.partidasHes.forEach(p => addHesPartidaRow(p));

            showSection('hes-management'); // Mostrar la sección de gestión de HES
        } else {
            showToast('HES no encontrada.', 'error');
        }
    }

    // Eliminar HES (mover a registros eliminados)
    function deleteHes(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta HES? Se moverá a registros eliminados.')) {
            const hesIndex = hesRecords.findIndex(h => h.id === id);
            if (hesIndex !== -1) {
                const [deletedHesRecord] = hesRecords.splice(hesIndex, 1);
                deletedHesRecord.fechaEliminacion = new Date().toISOString().split('T')[0];
                deletedHes.push(deletedHesRecord);
                saveData();
                renderHesListTable();
                showToast('HES eliminada (movida a papelera).', 'success');
            } else {
                showToast('HES no encontrada para eliminar.', 'error');
            }
        }
    }

    cancelHesBtn.addEventListener('click', () => {
        resetHesForm();
        renderHesListTable(); // Recargar la tabla de HES por si hubo cambios pendientes
    });

    // Ver Detalle de HES
    const hesDetailView = document.getElementById('hes-detail-view');
    const hesDetailNumber = document.getElementById('hes-detail-number');
    const hesDetailContractSicac = document.getElementById('hes-detail-contract-sicac');
    const hesDetailDate = document.getElementById('hes-detail-date');
    const hesDetailMonto = document.getElementById('hes-detail-monto');
    const hesDetailObservations = document.getElementById('hes-detail-observations');
    const hesDetailPartidasTableBody = document.querySelector('#hes-detail-partidas-table tbody');

    function viewHesDetail(id) {
        const hes = hesRecords.find(h => h.id === id);
        if (hes) {
            const contract = contracts.find(c => c.id === hes.contractId);
            
            hesDetailNumber.textContent = hes.hesNumber;
            hesDetailContractSicac.textContent = contract ? contract.numeroSicac : 'N/A';
            hesDetailDate.textContent = hes.hesDate;
            hesDetailMonto.textContent = hes.montoHes.toLocaleString('es-VE', { style: 'currency', currency: 'VES' });
            hesDetailObservations.textContent = hes.hesObservations || 'Ninguna.';

            hesDetailPartidasTableBody.innerHTML = '';
            hes.partidasHes.forEach(hesPartida => {
                const row = hesDetailPartidasTableBody.insertRow();
                const contractPartida = contract ? contract.partidas.find(p => p.id === hesPartida.contractPartidaId) : null;
                const partidaDesc = contractPartida ? contractPartida.descripcion : 'Partida No Encontrada';
                
                row.insertCell().textContent = partidaDesc;
                row.insertCell().textContent = hesPartida.cantidad;
                row.insertCell().textContent = hesPartida.precioUnitario.toLocaleString('es-VE', { style: 'currency', currency: 'VES' });
                row.insertCell().textContent = hesPartida.monto.toLocaleString('es-VE', { style: 'currency', currency: 'VES' });
                row.insertCell().textContent = `${hesPartida.avanceFisico.toFixed(2)}%`;
            });

            hesDetailView.style.display = 'block';
            hesDetailView.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Scroll para ver el detalle
        } else {
            showToast('Detalle de HES no encontrado.', 'error');
        }
    }

    closeHesDetailBtn.addEventListener('click', () => {
        hesDetailView.style.display = 'none';
    });


    // --- Registros Eliminados ---
    const deletedContractsTableBody = document.querySelector('#deleted-contracts-table tbody');
    const deletedHesTableBody = document.querySelector('#deleted-hes-table tbody');

    function renderDeletedContractsTable() {
        deletedContractsTableBody.innerHTML = '';
        if (deletedContracts.length === 0) {
            deletedContractsTableBody.innerHTML = '<tr><td colspan="5">No hay contratos eliminados.</td></tr>';
            return;
        }
        deletedContracts.forEach(contract => {
            const row = deletedContractsTableBody.insertRow();
            row.insertCell().textContent = contract.numeroSicac;
            row.insertCell().textContent = contract.objetoContrato.substring(0, 70) + (contract.objetoContrato.length > 70 ? '...' : '');
            row.insertCell().textContent = contract.contratista;
            row.insertCell().textContent = contract.fechaEliminacion;
            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `
                <button class="btn btn-success btn-sm restore-contract-btn" data-id="${contract.id}" title="Restaurar Contrato"><i class="fas fa-undo"></i></button>
                <button class="btn btn-danger btn-sm permanently-delete-contract-btn" data-id="${contract.id}" title="Eliminar Permanentemente"><i class="fas fa-times-circle"></i></button>
            `;
        });
        deletedContractsTableBody.querySelectorAll('.restore-contract-btn').forEach(button => {
            button.addEventListener('click', (e) => restoreContract(e.currentTarget.dataset.id));
        });
        deletedContractsTableBody.querySelectorAll('.permanently-delete-contract-btn').forEach(button => {
            button.addEventListener('click', (e) => permanentlyDeleteContract(e.currentTarget.dataset.id));
        });
    }

    function restoreContract(id) {
        if (confirm('¿Estás seguro de que quieres restaurar este contrato?')) {
            const contractIndex = deletedContracts.findIndex(c => c.id === id);
            if (contractIndex !== -1) {
                const [restoredContract] = deletedContracts.splice(contractIndex, 1);
                contracts.push(restoredContract);
                saveData();
                renderDeletedContractsTable();
                renderContractsTable(); // Actualizar tabla principal
                showToast('Contrato restaurado correctamente.', 'success');
            } else {
                showToast('Contrato no encontrado para restaurar.', 'error');
            }
        }
    }

    function permanentlyDeleteContract(id) {
        if (confirm('¡ADVERTENCIA! ¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE este contrato? Esta acción es irreversible.')) {
            const contractIndex = deletedContracts.findIndex(c => c.id === id);
            if (contractIndex !== -1) {
                deletedContracts.splice(contractIndex, 1);
                // Opcional: también eliminar HES asociadas a este contrato de deletedHes si se eliminó permanentemente
                deletedHes = deletedHes.filter(hes => hes.contractId !== id);
                saveData();
                renderDeletedContractsTable();
                renderDeletedHesTable();
                showToast('Contrato eliminado permanentemente.', 'success');
            } else {
                showToast('Contrato no encontrado para eliminación permanente.', 'error');
            }
        }
    }

    function renderDeletedHesTable() {
        deletedHesTableBody.innerHTML = '';
        if (deletedHes.length === 0) {
            deletedHesTableBody.innerHTML = '<tr><td colspan="4">No hay HES eliminadas.</td></tr>';
            return;
        }
        deletedHes.forEach(hes => {
            const row = deletedHesTableBody.insertRow();
            const originalContract = contracts.find(c => c.id === hes.contractId);
            const contractSicac = originalContract ? originalContract.numeroSicac : 'Contrato (Eliminado)'; // Si el contrato original no existe
            
            row.insertCell().textContent = contractSicac;
            row.insertCell().textContent = hes.hesNumber;
            row.insertCell().textContent = hes.fechaEliminacion;
            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `
                <button class="btn btn-success btn-sm restore-hes-btn" data-id="${hes.id}" title="Restaurar HES"><i class="fas fa-undo"></i></button>
                <button class="btn btn-danger btn-sm permanently-delete-hes-btn" data-id="${hes.id}" title="Eliminar Permanentemente"><i class="fas fa-times-circle"></i></button>
            `;
        });
        deletedHesTableBody.querySelectorAll('.restore-hes-btn').forEach(button => {
            button.addEventListener('click', (e) => restoreHes(e.currentTarget.dataset.id));
        });
        deletedHesTableBody.querySelectorAll('.permanently-delete-hes-btn').forEach(button => {
            button.addEventListener('click', (e) => permanentlyDeleteHes(e.currentTarget.dataset.id));
        });
    }

    function restoreHes(id) {
        if (confirm('¿Estás seguro de que quieres restaurar esta HES?')) {
            const hesIndex = deletedHes.findIndex(h => h.id === id);
            if (hesIndex !== -1) {
                const [restoredHes] = deletedHes.splice(hesIndex, 1);
                // Validar si el contrato al que pertenece existe
                const originalContractExists = contracts.some(c => c.id === restoredHes.contractId);
                if (!originalContractExists) {
                    showToast('No se puede restaurar esta HES. El contrato al que pertenece fue eliminado permanentemente.', 'error');
                    deletedHes.push(restoredHes); // Devolverla a la papelera si el contrato padre no existe
                    saveData();
                    return;
                }
                hesRecords.push(restoredHes);
                saveData();
                renderDeletedHesTable();
                renderHesListTable(); // Actualizar tabla principal
                showToast('HES restaurada correctamente.', 'success');
            } else {
                showToast('HES no encontrada para restaurar.', 'error');
            }
        }
    }

    function permanentlyDeleteHes(id) {
        if (confirm('¡ADVERTENCIA! ¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE esta HES? Esta acción es irreversible.')) {
            const hesIndex = deletedHes.findIndex(h => h.id === id);
            if (hesIndex !== -1) {
                deletedHes.splice(hesIndex, 1);
                saveData();
                renderDeletedHesTable();
                showToast('HES eliminada permanentemente.', 'success');
            } else {
                showToast('HES no encontrada para eliminación permanente.', 'error');
            }
        }
    }


    // --- Exportación a Excel y PDF ---
    function exportTableToExcel(tableId, filename = '') {
        const table = document.getElementById(tableId);
        if (!table) {
            showToast('Tabla no encontrada para exportar.', 'error');
            return;
        }
        const ws = XLSX.utils.table_to_sheet(table);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `${filename || tableId}_${new Date().toLocaleDateString()}.xlsx`);
        showToast('Tabla exportada a Excel.', 'success');
    }

    function exportTableToPDF(tableId, filename = '') {
        const table = document.getElementById(tableId);
        if (!table) {
            showToast('Tabla no encontrada para exportar.', 'error');
            return;
        }

        // Clonar la tabla para eliminar la columna de acciones si existe
        const tableClone = table.cloneNode(true);
        const headerRow = tableClone.querySelector('thead tr');
        let actionColumnIndex = -1;

        // Buscar la columna 'Acciones' en el thead
        Array.from(headerRow.children).forEach((th, index) => {
            if (th.textContent.includes('Acciones') || th.textContent.includes('acciones')) {
                actionColumnIndex = index;
            }
        });

        if (actionColumnIndex !== -1) {
            // Eliminar la columna de acciones del thead
            headerRow.children[actionColumnIndex].remove();
            // Eliminar la columna de acciones de todas las filas del tbody
            Array.from(tableClone.querySelectorAll('tbody tr')).forEach(row => {
                if (row.children[actionColumnIndex]) {
                    row.children[actionColumnIndex].remove();
                }
            });
        }
        
        // Convertir HTML a PDF
        html2pdf().from(tableClone).set({
            margin: 10,
            filename: `${filename || tableId}_${new Date().toLocaleDateString()}.pdf`,
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        }).save();
        showToast('Tabla exportada a PDF.', 'success');
    }

    document.getElementById('export-contracts-excel-btn').addEventListener('click', () => exportTableToExcel('contracts-table', 'Listado_Contratos'));
    document.getElementById('export-contracts-pdf-btn').addEventListener('click', () => exportTableToPDF('contracts-table', 'Listado_Contratos'));
    document.getElementById('export-hes-excel-btn').addEventListener('click', () => exportTableToExcel('hes-list-table', 'Listado_HES'));
    document.getElementById('export-hes-pdf-btn').addEventListener('click', () => exportTableToPDF('hes-list-table', 'Listado_HES'));


    // --- Resumen Gráfico (Chart.js) ---
    const chartContractSelect = document.getElementById('chart-contract-select');
    const chartTypeSelect = document.getElementById('chart-type-select');
    const renderChartBtn = document.getElementById('render-chart-btn');
    const mainChartCanvas = document.getElementById('mainChart');
    const exportChartImageBtn = document.getElementById('export-chart-image-btn');

    // Cargar contratos en el select de gráficos
    function loadContractsForChartSelect() {
        chartContractSelect.innerHTML = '<option value="">Todos los Contratos</option>';
        contracts.forEach(contract => {
            const option = document.createElement('option');
            option.value = contract.id;
            option.textContent = `${contract.numeroSicac} - ${contract.objetoContrato.substring(0, 50)}...`;
            chartContractSelect.appendChild(option);
        });
    }

    renderChartBtn.addEventListener('click', renderChart);

    function renderChart() {
        if (myChart) {
            myChart.destroy(); // Destruir instancia anterior del gráfico
        }
        exportChartImageBtn.style.display = 'none'; // Ocultar por defecto

        const selectedContractId = chartContractSelect.value;
        const selectedChartType = chartTypeSelect.value;

        let filteredContracts = contracts;
        if (selectedContractId) {
            filteredContracts = contracts.filter(c => c.id === selectedContractId);
            if (filteredContracts.length === 0) {
                showToast('Contrato seleccionado no encontrado para el gráfico.', 'error');
                return;
            }
        }
        
        if (filteredContracts.length === 0) {
            showToast('No hay datos para generar el gráfico.', 'info');
            return;
        }

        let chartData = {};
        let chartOptions = {};
        let chartType = 'bar'; // Tipo de gráfico por defecto

        switch (selectedChartType) {
            case 'status':
                chartType = 'pie';
                const statusCounts = {};
                filteredContracts.forEach(c => {
                    statusCounts[c.estatusContrato] = (statusCounts[c.estatusContrato] || 0) + 1;
                });
                chartData = {
                    labels: Object.keys(statusCounts),
                    datasets: [{
                        data: Object.values(statusCounts),
                        backgroundColor: ['#4CAF50', '#2196F3', '#FFC107', '#f44336', '#9E9E9E', '#607D8B'], // Colores representativos
                        hoverOffset: 4
                    }]
                };
                chartOptions = {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Contratos por Estatus'
                        },
                        legend: {
                            position: 'top',
                        }
                    }
                };
                break;
            case 'modality':
                chartType = 'pie';
                const modalityCounts = {};
                filteredContracts.forEach(c => {
                    modalityCounts[c.modalidadContratacion] = (modalityCounts[c.modalidadContratacion] || 0) + 1;
                });
                chartData = {
                    labels: Object.keys(modalityCounts),
                    datasets: [{
                        data: Object.values(modalityCounts),
                        backgroundColor: ['#8BC34A', '#FF9800', '#00BCD4', '#E91E63', '#673AB7', '#FFEB3B'],
                        hoverOffset: 4
                    }]
                };
                chartOptions = {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Contratos por Modalidad'
                        },
                        legend: {
                            position: 'top',
                        }
                    }
                };
                break;
            case 'physicalAdvance':
            case 'financialAdvance':
                chartType = 'bar';
                const labels = filteredContracts.map(c => c.numeroSicac);
                const physicalData = filteredContracts.map(c => calculateContractPhysicalProgress(c).toFixed(2));
                const financialData = filteredContracts.map(c => calculateContractFinancialProgress(c).toFixed(2));

                chartData = {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Avance Físico (%)',
                            data: physicalData,
                            backgroundColor: 'rgba(81, 139, 202, 0.8)', // light-blue-header
                            borderColor: 'rgba(81, 139, 202, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Avance Financiero (%)',
                            data: financialData,
                            backgroundColor: 'rgba(44, 74, 126, 0.8)', // dark-blue-sidebar
                            borderColor: 'rgba(44, 74, 126, 1)',
                            borderWidth: 1
                        }
                    ]
                };
                chartOptions = {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: `Avance Físico y Financiero por Contrato${selectedContractId ? ` (${filteredContracts[0].numeroSicac})` : ''}`
                        },
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Porcentaje (%)'
                            }
                        }
                    }
                };
                break;
            case 'montoTipo':
                chartType = 'bar';
                const montoByModality = {};
                filteredContracts.forEach(c => {
                    montoByModality[c.modalidadContratacion] = (montoByModality[c.modalidadContratacion] || 0) + c.montoOriginal;
                });
                chartData = {
                    labels: Object.keys(montoByModality),
                    datasets: [{
                        label: 'Monto Total',
                        data: Object.values(montoByModality),
                        backgroundColor: 'rgba(75, 192, 192, 0.8)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                };
                chartOptions = {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Monto Total por Modalidad de Contratación'
                        },
                        legend: {
                            display: false,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Monto Original (VES)'
                            }
                        }
                    }
                };
                break;
            case 'montoEstatus':
                chartType = 'bar';
                const montoByStatus = {};
                filteredContracts.forEach(c => {
                    montoByStatus[c.estatusContrato] = (montoByStatus[c.estatusContrato] || 0) + c.montoOriginal;
                });
                chartData = {
                    labels: Object.keys(montoByStatus),
                    datasets: [{
                        label: 'Monto Total',
                        data: Object.values(montoByStatus),
                        backgroundColor: 'rgba(153, 102, 255, 0.8)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }]
                };
                chartOptions = {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Monto Total por Estatus de Contrato'
                        },
                        legend: {
                            display: false,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Monto Original (VES)'
                            }
                        }
                    }
                };
                break;
            case 'timeline':
                chartType = 'bar'; // Usaremos barras horizontales o un scatter/line para representar la línea de tiempo
                // Para una línea de tiempo, un gráfico de barras horizontal puede ser más claro,
                // o incluso un gráfico de tipo 'scatter' si se necesita más precisión en el tiempo.
                // Usaremos un gráfico de barras apiladas para mostrar el rango de fechas.
                
                const timelineLabels = filteredContracts.map(c => c.numeroSicac);
                const startDates = filteredContracts.map(c => new Date(c.fechaInicio).getTime());
                const endDates = filteredContracts.map(c => new Date(c.fechaFin).getTime());

                // Para mostrar el rango, necesitamos el inicio y la duración desde el inicio
                const durationData = filteredContracts.map(c => {
                    const start = new Date(c.fechaInicio);
                    const end = new Date(c.fechaFin);
                    if (start && end && !isNaN(start) && !isNaN(end) && end > start) {
                        return (end.getTime() - start.getTime()); // Duración en milisegundos
                    }
                    return 0;
                });

                chartData = {
                    labels: timelineLabels,
                    datasets: [
                        {
                            label: 'Inicio',
                            data: startDates,
                            backgroundColor: 'rgba(255, 99, 132, 0.8)', // Rojo para el inicio
                            stack: 'stack0', // Importante para apilar
                            barPercentage: 0.8, // Grosor de la barra
                            categoryPercentage: 0.8
                        },
                        {
                            label: 'Duración',
                            data: durationData,
                            backgroundColor: 'rgba(54, 162, 235, 0.8)', // Azul para la duración
                            stack: 'stack0', // Importante para apilar
                            barPercentage: 0.8,
                            categoryPercentage: 0.8
                        }
                    ]
                };
                chartOptions = {
                    responsive: true,
                    indexAxis: 'y', // Hace las barras horizontales
                    plugins: {
                        title: {
                            display: true,
                            text: `Línea de Tiempo de Contratos${selectedContractId ? ` (${filteredContracts[0].numeroSicac})` : ''}`
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.x;
                                    if (label === 'Inicio') {
                                        return `${label}: ${new Date(value).toLocaleDateString()}`;
                                    } else if (label === 'Duración') {
                                        const durationDays = Math.ceil(value / (1000 * 60 * 60 * 24));
                                        return `${label}: ${durationDays} días`;
                                    }
                                    return '';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'month' // O 'day', 'week', 'year'
                            },
                            title: {
                                display: true,
                                text: 'Fecha'
                            },
                            stacked: true // Apilar las barras
                        },
                        y: {
                            stacked: true // Apilar las barras
                        }
                    }
                };
                break;
            default:
                showToast('Tipo de gráfico no reconocido.', 'error');
                return;
        }

        const ctx = mainChartCanvas.getContext('2d');
        myChart = new Chart(ctx, {
            type: chartType,
            data: chartData,
            options: chartOptions
        });

        exportChartImageBtn.style.display = 'block'; // Mostrar botón de exportar imagen
        showToast('Gráfico generado.', 'info');
    }

    exportChartImageBtn.addEventListener('click', () => {
        if (myChart) {
            const image = myChart.toBase64Image('image/png', 1);
            const a = document.createElement('a');
            a.href = image;
            a.download = `SIGESCON_Grafico_${chartTypeSelect.value}_${new Date().toLocaleDateString()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast('Gráfico exportado como imagen.', 'success');
        } else {
            showToast('No hay un gráfico para exportar.', 'warning');
        }
    });

    // --- Inicialización y Eventos al cargar la página ---
    renderModalities(); // Cargar modalidades al inicio
    showSection('dashboard'); // Mostrar el dashboard al cargar la página
});