// script.js

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si Dexie está disponible
    if (typeof Dexie === 'undefined') {
        console.error("Dexie.js no se ha cargado correctamente.");
        showToast("Error: Dexie.js no está disponible.", "error");
        return;
    }

    // Inicializar base de datos
    const db = new Dexie('SigesconDB');
    db.version(1).stores({
        contracts: '++id,numeroProveedor,fechaFirmaContrato,fechaCreado,fechaInicio,fechaTerminacion,periodoCulminacion,numeroContratoSICAC,divisionArea,eemn,region,naturalezaContratacion,lineaServicio,numeroPeticionOferta,modalidadContratacion,regimenLaboral,descripcionContrato,fechaCambioAlcance,montoOriginal,montoModificado,montoTotalContrato,numeroContrato,observaciones,estatusContrato,archivosAdjuntos,partidas',
        hes: '++id,contractId,numeroHES,fechaInicioHES,fechaFinalHES,aprobadoHES,textoHES,ejecutadaHES,fechaCreadoHES,fechaAprobadoHES,textoBreveHES,valuacionHES,lugarPrestacionServicioHES,responsableSDOHES,anexosHES,valuadoHES,subTotalHES,gastosAdministrativosHES,totalHES,partidasHES',
        modalities: '++id,name'
    });

    try {
        await db.open();
        console.log("Base de datos abierta correctamente.");
    } catch (err) {
        console.error("Error al abrir la base de datos:", err.stack || err);
        showToast("Error al cargar la base de datos local.", "error");
    }

    // Elementos del DOM
    const tabButtons = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.content-section');
    const toastElement = document.getElementById('toast');

    // Función para mostrar mensajes emergentes
    window.showToast = (message, type = 'success') => {
        if (!toastElement) return;

        toastElement.textContent = message;
        toastElement.className = `toast show ${type}`;

        setTimeout(() => {
            toastElement.classList.remove('show');
        }, 3000);
    };

    // Manejar pestañas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Botón de ayuda - redirección
    const helpButton = document.querySelector('.help-btn');
    if (helpButton) {
        helpButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'ayuda.html';
        });
    }

    // Cargar modalidades dinámicas
    const modalitySelect = document.getElementById('modalidad-contratacion');
    const addModalityBtn = document.getElementById('add-modality-btn');
    const removeModalityBtn = document.getElementById('remove-modality-btn');

    const loadModalities = async () => {
        try {
            const modalities = await db.modalities.toArray();
            modalitySelect.innerHTML = '<option value="">Selecciona una modalidad</option>';
            modalities.forEach(mod => {
                const option = document.createElement('option');
                option.value = mod.name;
                option.textContent = mod.name;
                modalitySelect.appendChild(option);
            });
        } catch (err) {
            console.error("Error al cargar las modalidades:", err);
            showToast("Error al cargar las modalidades.", "error");
        }
    };

    // Añadir nueva modalidad
    if (addModalityBtn && modalitySelect) {
        addModalityBtn.addEventListener('click', async () => {
            const newModality = prompt("Ingrese una nueva modalidad:");
            if (newModality && !Array.from(modalitySelect.options).some(opt => opt.value === newModality)) {
                await db.modalities.add({ name: newModality });
                showToast(`Modalidad "${newModality}" agregada.`, "success");
                loadModalities();
            } else {
                showToast("La modalidad ya existe o no es válida.", "warning");
            }
        });
    }

    // Eliminar modalidad
    if (removeModalityBtn && modalitySelect) {
        removeModalityBtn.addEventListener('click', async () => {
            const selected = modalitySelect.value;
            if (selected) {
                if (confirm(`¿Está seguro de eliminar "${selected}"?`)) {
                    const modalityToDelete = await db.modalities.where({ name: selected }).first();
                    if (modalityToDelete) {
                        await db.modalities.delete(modalityToDelete.id);
                        showToast(`Modalidad "${selected}" eliminada.`, "success");
                        loadModalities();
                    }
                }
            } else {
                showToast("Seleccione una modalidad antes de eliminar.", "warning");
            }
        });
    }

    // Inicialización
    if (modalitySelect) {
        loadModalities();
    }

    // Mostrar mensaje inicial
    showToast("SIGESCON cargado correctamente", "success");

    // Manejar botones principales
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', loadContractList);
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            filterProveedor.value = '';
            filterSicac.value = '';
            filterFechaInicio.value = '';
            filterFechaFinal.value = '';
        });
    }

    // Cargar lista inicial de contratos
    if (document.getElementById('contract-list-body')) {
        loadContractList();
    }

    // Manejar botones de avance físico
    const advanceForm = document.getElementById('advance-form');
    if (advanceForm) {
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
                loadContractList(); // Actualizar la lista principal si es aplicable
            } catch (error) {
                console.error("Error al registrar avance:", error);
                showToast('Error al registrar avance.', 'error');
            }
        });
    }

    // Cargar historial de avances
    const loadAdvanceHistory = async (contractId) => {
        try {
            const advances = await db.advances.where({ contractId: contractId }).sortBy('date');
            const historyBody = document.getElementById('advance-history-body');
            historyBody.innerHTML = '';

            if (advances.length === 0) {
                historyBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay avances registrados.</td></tr>';
                return;
            }

            advances.forEach(advance => {
                const row = `
                    <tr>
                        <td>${advance.date}</td>
                        <td>${advance.percentage}%</td>
                        <td>${advance.amount.toFixed(2)}</td>
                        <td>${advance.description}</td>
                        <td>
                            <button class="btn btn-danger btn-sm delete-advance-btn" data-id="${advance.id}"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>
                `;
                historyBody.innerHTML += row;
            });

            // Eventos para eliminar avances
            document.querySelectorAll('.delete-advance-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const advanceId = parseInt(button.getAttribute('data-id'));
                    if (confirm('¿Estás seguro de eliminar este avance?')) {
                        await db.advances.delete(advanceId);
                        showToast('Avance eliminado exitosamente.', 'success');
                        loadAdvanceHistory(contractId);
                    }
                });
            });
        } catch (error) {
            console.error("Error al cargar historial de avances:", error);
            showToast('Error al cargar historial de avances.', 'error');
        }
    };
});