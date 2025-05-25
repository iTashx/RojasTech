document.addEventListener('DOMContentLoaded', async () => {
    // Inicialización de Dexie (base de datos local)
    const db = new Dexie('SigesconDB');
    db.version(1).stores({
        contracts: '++id,numeroProveedor,fechaFirmaContrato,montoTotalContrato,estatusContrato',
        partidas: '++id,contractId,descripcion,cantidad,umd,precioUnitario,total'
    });

    try {
        await db.open();
        console.log("Base de datos abierta exitosamente.");
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
    const filterContractsForm = document.getElementById('filter-contracts-form');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    let currentContractId = null; // Para edición de contratos

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
        }, 3000); // El toast desaparece después de 3 segundos
    }
    window.showToast = showToast; // Hacerla global para acceso desde HTML si es necesario

    // --- Manejar Pestañas (Secciones) ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Cargar datos específicos al cambiar de pestaña
            if (targetId === 'contract-list') {
                loadContractList();
            } else if (targetId === 'general-summary') {
                updateSummaryCards();
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

    // Establecer fecha de creación por defecto
    const fechaCreadoInput = document.getElementById('fecha-creado');
    if (fechaCreadoInput) {
        fechaCreadoInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Añadir Partida a la tabla
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
        updatePartidaTotals(); // Actualizar totales al añadir
    });

    // Delegación de eventos para eliminar partida y actualizar totales
    partidasTableBody.addEventListener('click', (e) => {
        if (e.target.closest('.remove-partida-btn')) {
            e.target.closest('tr').remove();
            updatePartidaTotals();
        }
    });

    partidasTableBody.addEventListener('input', (e) => {
        if (e.target.name === 'cantidad' || e.target.name === 'precioUnitario') {
            updatePartidaTotals(e.target.closest('tr'));
        }
    });

    function updatePartidaTotals(row = null) {
        let totalGlobalPartidas = 0;
        const rows = row ? [row] : partidasTableBody.children;

        Array.from(rows).forEach(r => {
            const cantidad = parseFloat(r.querySelector('[name="cantidad"]').value) || 0;
            const precioUnitario = parseFloat(r.querySelector('[name="precioUnitario"]').value) || 0;
            const totalPartida = cantidad * precioUnitario;
            r.querySelector('.total-partida').textContent = totalPartida.toFixed(2);
            totalGlobalPartidas += totalPartida;
        });

        // Actualizar el campo 'monto-total-contrato'
        document.getElementById('monto-total-contrato').value = totalGlobalPartidas.toFixed(2);
    }

    // Limpiar formulario de contrato completo
    clearContractFormBtn.addEventListener('click', () => {
        contractForm.reset(); // Resetea todos los campos del formulario
        partidasTableBody.innerHTML = ''; // Limpia las partidas de la tabla
        document.getElementById('adjuntar-archivos-info').textContent = 'Ningún archivo seleccionado';
        currentContractId = null; // Reinicia el ID de contrato actual
        document.getElementById('fecha-creado').value = new Date().toISOString().split('T')[0]; // Restaurar fecha de creación
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
            periodoCulminacion: parseInt(document.getElementById('periodo-culminacion').value) || 0,
            numeroSICAC: document.getElementById('numero-sicac').value,
            divisionArea: document.getElementById('division-area').value,
            eemn: document.getElementById('eemn').value,
            region: document.getElementById('region').value,
            naturalezaContratacion: document.getElementById('naturaleza-contratacion').value,
            lineaServicio: document.getElementById('linea-servicio').value,
            noPeticionOferta: document.getElementById('no-peticion-oferta').value,
            modalidadContratacion: document.getElementById('modalidad-contratacion').value,
            regimenLaboral: document.getElementById('regimen-laboral').value,
            objetoContractual: document.getElementById('objeto-contractual').value,
            fechaCambioAlcance: document.getElementById('fecha-cambio-alcance').value,
            montoOriginal: parseFloat(document.getElementById('monto-original').value) || 0,
            montoModificado: parseFloat(document.getElementById('monto-modificado').value) || 0,
            montoTotalContrato: parseFloat(document.getElementById('monto-total-contrato').value) || 0,
            numeroContratoInterno: document.getElementById('numero-contrato-interno').value,
            observaciones: document.getElementById('observaciones').value,
            estatusContrato: document.getElementById('estatus-contrato').value,
            moneda: document.getElementById('moneda').value,
            // Los archivos adjuntos requieren manejo especial (no se almacenan directamente en Dexie)
        };

        if (!contractData.numeroProveedor || !contractData.fechaFirmaContrato || !contractData.montoTotalContrato) {
            showToast("Por favor, complete los campos obligatorios: N° Proveedor, Fecha Firma y Monto Total.", "warning");
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
            await db.partidas.where({ contractId: contractId }).delete(); // Eliminar antiguas partidas
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
            
            clearContractFormBtn.click(); // Limpiar el formulario
            loadContractList(); // Recargar la lista de contratos
            tabButtons.forEach(btn => { // Cambiar a la pestaña de lista de contratos
                if (btn.getAttribute('data-target') === 'contract-list') {
                    btn.click();
                }
            });

        } catch (error) {
            console.error("Error al guardar/actualizar el contrato:", error);
            showToast("Error al guardar/actualizar el contrato: " + error.message, "error");
        }
    });

    // Manejar selección de archivos para mostrar nombre
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

    // Cargar lista inicial de contratos
    loadContractList();

    async function loadContractList(filters = {}) {
        const contractListBody = document.getElementById('contract-list-body');
        contractListBody.innerHTML = '';

        let contracts = await db.contracts.toArray();

        // Aplicar filtros
        if (filters.numeroProveedor) {
            contracts = contracts.filter(c => c.numeroProveedor.toLowerCase().includes(filters.numeroProveedor.toLowerCase()));
        }
        if (filters.numeroSICAC) {
            contracts = contracts.filter(c => c.numeroSICAC && c.numeroSICAC.toLowerCase().includes(filters.numeroSICAC.toLowerCase()));
        }

        if (contracts.length === 0) {
            contractListBody.innerHTML = `<tr><td colspan="6" class="text-center">No hay contratos registrados.</td></tr>`;
            return;
        }

        contracts.forEach(contract => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contract.numeroProveedor}</td>
                <td>${contract.numeroSICAC || '-'}</td>
                <td>${contract.fechaInicio}</td>
                <td>${contract.montoTotalContrato ? contract.montoTotalContrato.toFixed(2) : '0.00'} ${contract.moneda || 'USD'}</td>
                <td>${contract.estatusContrato || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-contract-btn" data-id="${contract.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-contract-btn" data-id="${contract.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            contractListBody.appendChild(row);
        });
    }

    // Aplicar filtros
    applyFiltersBtn.addEventListener('click', () => {
        const filters = {
            numeroProveedor: document.getElementById('filter-proveedor').value,
            numeroSICAC: document.getElementById('filter-sicac').value
        };
        loadContractList(filters);
    });

    // Limpiar filtros
    clearFiltersBtn.addEventListener('click', () => {
        document.getElementById('filter-proveedor').value = '';
        document.getElementById('filter-sicac').value = '';
        loadContractList(); // Recargar sin filtros
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
                // Rellenar formulario principal
                document.getElementById('numero-proveedor').value = contract.numeroProveedor || '';
                document.getElementById('fecha-firma-contrato').value = contract.fechaFirmaContrato || '';
                document.getElementById('fecha-creado').value = contract.fechaCreado || new Date().toISOString().split('T')[0];
                document.getElementById('fecha-inicio').value = contract.fechaInicio || '';
                document.getElementById('fecha-terminacion').value = contract.fechaTerminacion || '';
                document.getElementById('periodo-culminacion').value = contract.periodoCulminacion || '';
                document.getElementById('numero-sicac').value = contract.numeroSICAC || '';
                document.getElementById('division-area').value = contract.divisionArea || '';
                document.getElementById('eemn').value = contract.eemn || '';
                document.getElementById('region').value = contract.region || '';
                document.getElementById('naturaleza-contratacion').value = contract.naturalezaContratacion || '';
                document.getElementById('linea-servicio').value = contract.lineaServicio || '';
                document.getElementById('no-peticion-oferta').value = contract.noPeticionOferta || '';
                document.getElementById('modalidad-contratacion').value = contract.modalidadContratacion || '';
                document.getElementById('regimen-laboral').value = contract.regimenLaboral || '';
                document.getElementById('objeto-contractual').value = contract.objetoContractual || '';
                document.getElementById('fecha-cambio-alcance').value = contract.fechaCambioAlcance || '';
                document.getElementById('monto-original').value = contract.montoOriginal !== undefined ? contract.montoOriginal.toFixed(2) : '0.00';
                document.getElementById('monto-modificado').value = contract.montoModificado !== undefined ? contract.montoModificado.toFixed(2) : '0.00';
                document.getElementById('monto-total-contrato').value = contract.montoTotalContrato !== undefined ? contract.montoTotalContrato.toFixed(2) : '0.00';
                document.getElementById('numero-contrato-interno').value = contract.numeroContratoInterno || '';
                document.getElementById('observaciones').value = contract.observaciones || '';
                document.getElementById('estatus-contrato').value = contract.estatusContrato || 'Activo';
                document.getElementById('moneda').value = contract.moneda || 'USD';
                
                // Cargar partidas del contrato
                partidasTableBody.innerHTML = ''; // Limpiar partidas existentes
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
                updatePartidaTotals(); // Calcular el total del contrato basado en las partidas cargadas

                currentContractId = contractId; // Establecer el ID para actualización
                showToast("Contrato cargado para edición.", "info");
                // Cambiar a la pestaña de edición
                tabButtons.forEach(btn => {
                    if (btn.getAttribute('data-target') === 'new-edit-contract') {
                        btn.click();
                    }
                });
            }
        } else if (targetBtn.classList.contains('delete-contract-btn')) {
            if (confirm('¿Está seguro de que desea eliminar este contrato y todas sus partidas?')) {
                try {
                    await db.contracts.delete(contractId);
                    await db.partidas.where({ contractId: contractId }).delete();
                    showToast("Contrato eliminado exitosamente.", "success");
                    loadContractList();
                    updateSummaryCards();
                } catch (error) {
                    console.error("Error al eliminar contrato:", error);
                    showToast("Error al eliminar el contrato: " + error.message, "error");
                }
            }
        }
    });

    // --- Funciones de Exportación (implementación básica) ---
    exportExcelBtn.addEventListener('click', async () => {
        try {
            const contracts = await db.contracts.toArray();
            if (contracts.length === 0) {
                showToast("No hay datos para exportar a Excel.", "warning");
                return;
            }

            const data = contracts.map(c => ({
                'N° Proveedor': c.numeroProveedor,
                'Fecha Firma': c.fechaFirmaContrato,
                'N° SICAC': c.numeroSICAC,
                'Monto Total': c.montoTotalContrato,
                'Estatus': c.estatusContrato,
                'Modalidad': c.modalidadContratacion,
                'Objeto': c.objetoContractual
                // Añadir más campos según necesites
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Contratos");
            XLSX.writeFile(wb, "Contratos.xlsx");
            showToast("Datos exportados a Excel.", "success");
        } catch (error) {
            console.error("Error al exportar a Excel:", error);
            showToast("Error al exportar a Excel.", "error");
        }
    });

    exportPdfBtn.addEventListener('click', async () => {
        try {
            const contracts = await db.contracts.toArray();
            if (contracts.length === 0) {
                showToast("No hay datos para exportar a PDF.", "warning");
                return;
            }

            // Usar jspdf y jspdf-autotable
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const tableColumn = ["N° Proveedor", "N° SICAC", "Fecha Inicio", "Monto Total", "Estatus"];
            const tableRows = contracts.map(c => [
                c.numeroProveedor,
                c.numeroSICAC || '-',
                c.fechaInicio,
                `${c.montoTotalContrato ? c.montoTotalContrato.toFixed(2) : '0.00'} ${c.moneda || 'USD'}`,
                c.estatusContrato || '-'
            ]);

            doc.autoTable(tableColumn, tableRows, { startY: 20 });
            doc.text("Lista de Contratos", 14, 15);
            doc.save("Contratos.pdf");
            showToast("Datos exportados a PDF.", "success");
        } catch (error) {
            console.error("Error al exportar a PDF:", error);
            showToast("Error al exportar a PDF.", "error");
        }
    });

    // Iniciar el resumen general al cargar la página
    updateSummaryCards();
});